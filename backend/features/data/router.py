from fastapi import APIRouter, Query
from typing import Optional
from core.state import _df, _traffic, _predictions, _recommendations
from features.data.data import compute_summary, generate_benchmark
from core.redis_client import get_cache, set_cache

router = APIRouter(tags=["Data"])

@router.get("/api/complaints")
def get_complaints(
    status: Optional[str] = None, kota: Optional[str] = None,
    category: Optional[str] = None, sort: str = "priority_score",
    limit: int = Query(300, le=500), type: Optional[str] = None
):
    if type == "summary":
        return compute_summary(_df)
    df = _df.copy()
    if status:   df = df[df["status"] == status]
    if kota:     df = df[df["kota"] == kota]
    if category: df = df[df["category"] == category]
    if sort in df.columns:
        asc = sort == "days_ago"
        df = df.sort_values(sort, ascending=asc)
    return df.head(limit).to_dict(orient="records")

@router.get("/api/complaints/summary")
def get_summary():
    cached = get_cache("summary")
    if cached:
        return cached
    summary = compute_summary(_df)
    set_cache("summary", summary, expire_seconds=300)
    return summary

@router.get("/api/traffic")
def get_traffic():
    return _traffic

@router.get("/api/predictions")
def get_predictions():
    return _predictions

@router.get("/api/recommendations")
def get_recommendations():
    return _recommendations

@router.get("/api/benchmark")
def get_benchmark_route():
    cached = get_cache("benchmark")
    if cached:
        return cached
    bench = generate_benchmark()
    set_cache("benchmark", bench, expire_seconds=300)
    return bench
