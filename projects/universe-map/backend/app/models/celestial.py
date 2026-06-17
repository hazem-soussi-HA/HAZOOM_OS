from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import numpy as np

Base = declarative_base()


class CelestialObject(Base):
    __tablename__ = "celestial_objects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    object_type = Column(String(100), nullable=False, index=True)
    
    ra = Column(Float, nullable=False, index=True)
    dec = Column(Float, nullable=False, index=True)
    distance = Column(Float, nullable=False)
    
    mass = Column(Float)
    radius = Column(Float)
    temperature = Column(Float)
    luminosity = Column(Float)
    
    spectral_features = Column(ARRAY(Float))
    type_id = Column(Integer)
    
    region = Column(String(100), index=True)
    
    catalog_id = Column(String(100))
    catalog_source = Column(String(100))
    
    discovery_date = Column(DateTime)
    last_observed = Column(DateTime)
    
    metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.object_type,
            "position": {
                "ra": self.ra,
                "dec": self.dec,
                "distance": self.distance
            },
            "physical": {
                "mass": self.mass,
                "radius": self.radius,
                "temperature": self.temperature,
                "luminosity": self.luminosity
            },
            "spectral": self.spectral_features,
            "region": self.region,
            "catalog": {
                "id": self.catalog_id,
                "source": self.catalog_source
            },
            "discovery": self.discovery_date.isoformat() if self.discovery_date else None,
            "last_observed": self.last_observed.isoformat() if self.last_observed else None
        }


class UniverseRegion(Base):
    __tablename__ = "universe_regions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    
    ra_min = Column(Float)
    ra_max = Column(Float)
    dec_min = Column(Float)
    dec_max = Column(Float)
    distance_min = Column(Float)
    distance_max = Column(Float)
    
    object_count = Column(Integer, default=0)
    dominant_type = Column(String(100))
    
    description = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "bounds": {
                "ra": {"min": self.ra_min, "max": self.ra_max},
                "dec": {"min": self.dec_min, "max": self.dec_max},
                "distance": {"min": self.distance_min, "max": self.distance_max}
            },
            "stats": {
                "object_count": self.object_count,
                "dominant_type": self.dominant_type
            },
            "description": self.description
        }


class ObservationData(Base):
    __tablename__ = "observation_data"
    
    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(Integer, ForeignKey("celestial_objects.id"))
    
    observatory = Column(String(255))
    instrument = Column(String(255))
    observation_date = Column(DateTime)
    
    wavelength = Column(Float)
    magnitude = Column(Float)
    redshift = Column(Float)
    
    data_quality = Column(Float)
    processing_level = Column(String(50))
    
    raw_data_url = Column(String(500))
    processed_data_url = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)


class CatalogSync(Base):
    __tablename__ = "catalog_syncs"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)
    sync_date = Column(DateTime, default=datetime.utcnow)
    objects_synced = Column(Integer, default=0)
    sync_duration = Column(Float)
    status = Column(String(50))
    error_message = Column(Text)
