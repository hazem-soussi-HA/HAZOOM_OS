from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from prometheus_client import make_asgi_app
import structlog
from typing import List, Optional
import numpy as np
from datetime import datetime

from app.core.config import settings
from app.core.security import get_api_key
from app.database.connection import get_db, engine
from app.models.celestial import CelestialObject, UniverseRegion
from app.services.attention_optimizer import universe_optimizer
from app.services.data_fetcher import UniverseDataFetcher
from app.services.cache import CacheService
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

logger = structlog.get_logger()

data_fetcher = UniverseDataFetcher()
cache_service = CacheService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Universe Map API")
    await data_fetcher.initialize()
    yield
    logger.info("Shutting down Universe Map API")


app = FastAPI(
    title="Universe Map API",
    description="Automated Universe Map with Attention-Based Optimization",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

FastAPIInstrumentor.instrument_app(app)

app.mount("/metrics", make_asgi_app())

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "universe-map-api",
        "version": "1.0.0"
    }


@app.get("/api/v1/celestial-objects")
async def get_celestial_objects(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    object_type: Optional[str] = None,
    region: Optional[str] = None,
    optimized: bool = True,
    db=Depends(get_db)
):
    cache_key = f"celestial:{limit}:{offset}:{object_type}:{region}:{optimized}"
    
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    query = db.query(CelestialObject)
    
    if object_type:
        query = query.filter(CelestialObject.object_type == object_type)
    
    if region:
        query = query.filter(CelestialObject.region == region)
    
    objects = query.offset(offset).limit(limit).all()
    
    if optimized and objects:
        positions = np.array([[obj.ra, obj.dec, obj.distance] for obj in objects])
        physical = np.array([[obj.mass, obj.radius, obj.temperature, obj.luminosity] for obj in objects])
        spectral = np.array([obj.spectral_features for obj in objects])
        types = np.array([obj.type_id for obj in objects])
        
        optimal_order = universe_optimizer.optimize_rendering_order(
            positions, physical, spectral, types
        )
        objects = [objects[i] for i in optimal_order]
    
    result = {
        "objects": [obj.to_dict() for obj in objects],
        "total": query.count(),
        "optimized": optimized
    }
    
    await cache_service.set(cache_key, result, ttl=300)
    return result


@app.get("/api/v1/celestial-objects/{object_id}")
async def get_celestial_object(object_id: int, db=Depends(get_db)):
    obj = db.query(CelestialObject).filter(CelestialObject.id == object_id).first()
    
    if not obj:
        raise HTTPException(status_code=404, detail="Celestial object not found")
    
    return obj.to_dict()


@app.get("/api/v1/regions")
async def get_universe_regions(db=Depends(get_db)):
    regions = db.query(UniverseRegion).all()
    return {"regions": [region.to_dict() for region in regions]}


@app.get("/api/v1/optimize")
async def optimize_view(
    viewer_position: str = Query(..., description="RA,DEC,DISTANCE in degrees"),
    fov: float = Query(60.0, description="Field of view in degrees"),
    max_objects: int = Query(100, ge=1, le=1000),
    db=Depends(get_db)
):
    try:
        ra, dec, distance = map(float, viewer_position.split(','))
    except:
        raise HTTPException(status_code=400, detail="Invalid viewer position format")
    
    cache_key = f"optimize:{ra}:{dec}:{distance}:{fov}:{max_objects}"
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    objects = db.query(CelestialObject).limit(max_objects * 2).all()
    
    positions = np.array([[obj.ra, obj.dec, obj.distance] for obj in objects])
    physical = np.array([[obj.mass, obj.radius, obj.temperature, obj.luminosity] for obj in objects])
    spectral = np.array([obj.spectral_features for obj in objects])
    types = np.array([obj.type_id for obj in objects])
    
    optimal_order = universe_optimizer.optimize_rendering_order(
        positions, physical, spectral, types
    )
    
    attention_weights = universe_optimizer.compute_attention_weights(
        positions, physical, spectral, types
    )
    
    result = {
        "optimized_objects": [objects[i].to_dict() for i in optimal_order[:max_objects]],
        "attention_weights": attention_weights.tolist(),
        "viewer_position": {"ra": ra, "dec": dec, "distance": distance},
        "fov": fov
    }
    
    await cache_service.set(cache_key, result, ttl=60)
    return result


@app.post("/api/v1/sync-data")
async def sync_astronomical_data(
    source: str = Query("all", description="Data source to sync"),
    api_key: str = Depends(get_api_key)
):
    try:
        result = await data_fetcher.sync_from_source(source)
        return {
            "status": "success",
            "message": f"Synced {result['objects_added']} objects",
            "details": result
        }
    except Exception as e:
        logger.error(f"Data sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/stats")
async def get_universe_statistics(db=Depends(get_db)):
    stats = {
        "total_objects": db.query(CelestialObject).count(),
        "by_type": {},
        "regions": db.query(UniverseRegion).count()
    }
    
    types = db.query(CelestialObject.object_type).distinct().all()
    for obj_type in types:
        count = db.query(CelestialObject).filter(
            CelestialObject.object_type == obj_type[0]
        ).count()
        stats["by_type"][obj_type[0]] = count
    
    return stats


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
