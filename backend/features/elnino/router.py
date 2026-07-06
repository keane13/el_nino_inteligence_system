from fastapi import APIRouter, Query
from typing import Optional
from features.data.data import (
    generate_drought_index, generate_fire_hotspots, generate_air_quality,
    generate_reservoir_levels, generate_enso_history, get_elnino_summary
)
from core.redis_client import get_cache, set_cache

router = APIRouter(tags=["ElNino"])

@router.get("/api/drought")
def get_drought():
    cached = get_cache("drought")
    if cached: return cached
    data = generate_drought_index()
    set_cache("drought", data, expire_seconds=600)
    return data

@router.get("/api/fire-hotspots")
def get_fire_hotspots(province: Optional[str] = None, confidence: Optional[str] = None, limit: int = Query(500, le=2000)):
    cached = get_cache(f"fire_{province}_{confidence}_{limit}")
    if cached: return cached
    data = generate_fire_hotspots()
    if province:
        data = [h for h in data if province.lower() in h["province"].lower()]
    if confidence:
        data = [h for h in data if h["confidence"].lower() == confidence.lower()]
    result = data[:limit]
    set_cache(f"fire_{province}_{confidence}_{limit}", result, expire_seconds=300)
    return result

@router.get("/api/air-quality")
def get_air_quality():
    cached = get_cache("air_quality")
    if cached: return cached
    data = generate_air_quality()
    set_cache("air_quality", data, expire_seconds=300)
    return data

@router.get("/api/reservoir")
def get_reservoir():
    cached = get_cache("reservoir")
    if cached: return cached
    data = generate_reservoir_levels()
    set_cache("reservoir", data, expire_seconds=600)
    return data

@router.get("/api/enso")
def get_enso():
    cached = get_cache("enso")
    if cached: return cached
    data = generate_enso_history()
    set_cache("enso", data, expire_seconds=3600)
    return data

@router.get("/api/elnino/summary")
def get_elnino_summary_endpoint():
    cached = get_cache("elnino_summary")
    if cached: return cached
    data = get_elnino_summary()
    set_cache("elnino_summary", data, expire_seconds=300)
    return data
