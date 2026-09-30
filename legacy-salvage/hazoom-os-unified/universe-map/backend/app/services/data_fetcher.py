import aiohttp
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
from astropy import units as u
from astropy.coordinates import SkyCoord
import structlog

from app.core.config import settings
from app.database.connection import SessionLocal
from app.models.celestial import CelestialObject, CatalogSync

logger = structlog.get_logger()


class UniverseDataFetcher:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.sources = {
            "simbad": "http://simbad.cds.unistra.fr/simbad/sim-script",
            "gaia": "https://gea.esac.esa.int/tap-server/tap",
            "nasa": "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        }
    
    async def initialize(self):
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)
        logger.info("Data fetcher initialized")
    
    async def close(self):
        if self.session:
            await self.session.close()
    
    async def fetch_from_simbad(self, query: str) -> List[Dict]:
        try:
            data = {"script": query}
            headers = {"Content-Type": "text/plain"}
            
            async with self.session.post(
                self.sources["simbad"],
                data=data,
                headers=headers
            ) as response:
                text = await response.text()
                return self._parse_simbad_response(text)
        except Exception as e:
            logger.error(f"SIMBAD fetch error: {str(e)}")
            return []
    
    async def fetch_from_gaia(self, query: str) -> List[Dict]:
        try:
            params = {
                "request": "doQuery",
                "lang": "adql",
                "format": "json",
                "query": query
            }
            
            async with self.session.get(
                self.sources["gaia"],
                params=params
            ) as response:
                data = await response.json()
                return self._parse_gaia_response(data)
        except Exception as e:
            logger.error(f"Gaia fetch error: {str(e)}")
            return []
    
    def _parse_simbad_response(self, text: str) -> List[Dict]:
        objects = []
        lines = text.strip().split('\n')
        
        for line in lines[3:-2]:
            if '::' not in line:
                continue
            
            parts = [p.strip() for p in line.split('::')]
            if len(parts) >= 4:
                try:
                    coord = SkyCoord(parts[1], unit=(u.hourangle, u.deg))
                    
                    obj = {
                        "name": parts[0].replace("'", ""),
                        "ra": coord.ra.deg,
                        "dec": coord.dec.deg,
                        "object_type": parts[2],
                        "catalog_source": "SIMBAD"
                    }
                    objects.append(obj)
                except:
                    continue
        
        return objects
    
    def _parse_gaia_response(self, data: Dict) -> List[Dict]:
        objects = []
        
        if "data" in data:
            for row in data["data"]:
                obj = {
                    "name": f"Gaia DR3 {row[0]}",
                    "ra": float(row[1]),
                    "dec": float(row[2]),
                    "parallax": float(row[3]) if row[3] else None,
                    "magnitude": float(row[4]) if row[4] else None,
                    "object_type": "Star",
                    "catalog_source": "Gaia DR3",
                    "catalog_id": str(row[0])
                }
                
                if obj["parallax"]:
                    obj["distance"] = 1000.0 / obj["parallax"]
                
                objects.append(obj)
        
        return objects
    
    async def sync_from_source(self, source: str = "all") -> Dict:
        sync_start = datetime.utcnow()
        objects_added = 0
        
        sync_record = CatalogSync(
            source_name=source,
            sync_date=sync_start,
            status="in_progress"
        )
        
        db = SessionLocal()
        try:
            db.add(sync_record)
            db.commit()
            
            if source in ["all", "simbad"]:
                query = """
                query sample
                1 10
                format object "%IDLIST.1 %COO(d;A D) %OTYPE"
                """
                simbad_objects = await self.fetch_from_simbad(query)
                objects_added += await self._save_objects(simbad_objects, db)
            
            if source in ["all", "gaia"]:
                query = """
                SELECT TOP 1000 source_id, ra, dec, parallax, phot_g_mean_mag
                FROM gaiadr3.gaia_source
                WHERE random_index < 1000
                """
                gaia_objects = await self.fetch_from_gaia(query)
                objects_added += await self._save_objects(gaia_objects, db)
            
            sync_duration = (datetime.utcnow() - sync_start).total_seconds()
            
            sync_record.objects_synced = objects_added
            sync_record.sync_duration = sync_duration
            sync_record.status = "completed"
            db.commit()
            
            logger.info(f"Sync completed: {objects_added} objects in {sync_duration:.2f}s")
            
            return {
                "objects_added": objects_added,
                "duration": sync_duration,
                "source": source
            }
            
        except Exception as e:
            sync_record.status = "failed"
            sync_record.error_message = str(e)
            db.commit()
            logger.error(f"Sync failed: {str(e)}")
            raise
        
        finally:
            db.close()
    
    async def _save_objects(self, objects: List[Dict], db) -> int:
        added = 0
        
        for obj_data in objects:
            try:
                existing = db.query(CelestialObject).filter(
                    CelestialObject.name == obj_data["name"]
                ).first()
                
                if existing:
                    continue
                
                spectral_features = np.random.rand(10).tolist()
                type_id = hash(obj_data["object_type"]) % 10
                
                obj = CelestialObject(
                    name=obj_data["name"],
                    object_type=obj_data["object_type"],
                    ra=obj_data["ra"],
                    dec=obj_data["dec"],
                    distance=obj_data.get("distance", 100.0),
                    catalog_source=obj_data.get("catalog_source"),
                    catalog_id=obj_data.get("catalog_id"),
                    spectral_features=spectral_features,
                    type_id=type_id,
                    discovery_date=datetime.utcnow(),
                    last_observed=datetime.utcnow()
                )
                
                db.add(obj)
                added += 1
                
            except Exception as e:
                logger.error(f"Error saving object {obj_data.get('name')}: {str(e)}")
                continue
        
        if added > 0:
            db.commit()
        
        return added
