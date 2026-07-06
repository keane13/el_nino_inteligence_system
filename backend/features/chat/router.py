from fastapi import APIRouter
from pydantic import BaseModel
import json
from features.data.data import (
    compute_summary, generate_drought_index,
    generate_reservoir_levels, get_elnino_summary
)
from core.state import _df, _traffic, _predictions, _recommendations, _elnino_summary
from features.chat.agent import create_jakarta_pulse_agent

router = APIRouter(prefix="/api/chat", tags=["Chat"])

from typing import Optional, List

class ChatRequest(BaseModel):
    message: str = ""
    history: list = []
    image: Optional[str] = None

def build_context():
    s = compute_summary(_df)
    cat_counts = _df.groupby("category")["id"].count().sort_values(ascending=False).head(5).to_dict()
    dist_counts = _df.groupby("district")["id"].count().sort_values(ascending=False).head(5).to_dict()
    top_pri = _df.nlargest(5, "priority_score")[["id","category","district","priority_score","status"]].to_dict(orient="records")
    worst_traffic = sorted(_traffic, key=lambda x: -x["congestion_level"])[:3]
    top_recs = [r for r in _recommendations if r["priority"] in ("critical","high")][:3]
    top_preds = [p for p in _predictions if p["trend"] == "rising"][:3]

    elnino = get_elnino_summary()
    drought = generate_drought_index()
    reservoir = generate_reservoir_levels()
    worst_drought = drought[:3]
    critical_res = [r for r in reservoir if r["status"] == "Critical"]

    return f"""You are Jakarta Pulse AI, a smart city analytics assistant for Jakarta.

LIVE DATA:
- Total: {s['total_complaints']} | Open: {s['open_complaints']} | Escalated: {s['escalated_complaints']} | Resolved: {s['resolved_complaints']}
- High priority: {s['high_priority_count']} | Resolution rate: {s['resolution_rate']}%

TOP CATEGORIES: {json.dumps(cat_counts, ensure_ascii=False)}
TOP DISTRICTS: {json.dumps(dist_counts, ensure_ascii=False)}
HIGHEST COMPLAINTS: {json.dumps(top_pri, ensure_ascii=False)}
WORST TRAFFIC: {json.dumps([{'name':h['name'],'congestion':h['congestion_level'],'speed':h['avg_speed_kmh']} for h in worst_traffic], ensure_ascii=False)}
RISING RISK PREDICTIONS: {json.dumps([{'location':p['district'],'category':p['category'],'prediction_7d':p['predicted_complaints_7d'],'confidence':p['confidence']} for p in top_preds], ensure_ascii=False)}
PRIORITY RECOMMENDATIONS: {json.dumps([{'priority':r['priority'],'action':r['action'],'impact':r['estimated_impact']} for r in top_recs], ensure_ascii=False)}

EL NIÑO 2026 STATUS:
- ONI Index: {elnino['oni_index']} ({elnino['enso_phase']} {elnino['enso_strength']})
- Critical Drought Provinces: {elnino['drought_critical_provinces']} | Severe: {elnino['drought_parah_provinces']}
- Total Wildfire Hotspots: {elnino['total_fire_hotspots']} | High Confidence: {elnino['high_confidence_hotspots']}
- Jakarta Avg PM2.5: {elnino['avg_pm25_jakarta']} µg/m³ | Worst Station: {elnino['worst_aqi_station']} ({elnino['worst_aqi_category']})
- Critical Reservoirs: {elnino['critical_reservoirs']} of 6 | Alert Level: {elnino['alert_level']}
- Total Affected Population: {elnino['total_population_affected']:,} people
WORST DROUGHT: {json.dumps([{'province':d['province'],'drought_index':d['drought_index'],'severity':d['severity_level'],'rainfall_pct':d['rainfall_pct_normal'],'population':d['population_affected']} for d in worst_drought], ensure_ascii=False)}
CRITICAL RESERVOIRS: {json.dumps([{'name':r['name'],'level':r['current_pct'],'status':r['status'],'days_to_critical':r['days_to_critical']} for r in critical_res], ensure_ascii=False)}

Answer concisely and specifically. Use English."""

@router.post("")
async def chat(req: ChatRequest):
    try:
        context = build_context()
        agent = create_jakarta_pulse_agent(context)
        reply_text = agent.run(req.message, req.history, req.image)
        return {"reply": reply_text}
    except Exception as e:
        print("Agent error:", e)
        return {"reply": _fallback_reply(req.message)}

def _fallback_reply(msg: str) -> str:
    s = compute_summary(_df)
    m = msg.lower()
    if any(w in m for w in ["predict","forecast","risk"]):
        rising = [p for p in _predictions if p["trend"] == "rising"][:2]
        return "Highest risk predictions:\n" + "\n".join([f"• {p['district']}/{p['category']}: {p['predicted_complaints_7d']} reports (7d), confidence {p['confidence']}%" for p in rising])
    if any(w in m for w in ["recommend","suggest","dispatch"]):
        top = _recommendations[:2]
        return "\n\n".join([f"[{r['priority'].upper()}] {r['action']}\n→ {r['estimated_impact']}" for r in top])
    if any(w in m for w in ["jam","traffic","congestion"]):
        worst = sorted(_traffic, key=lambda x: -x["congestion_level"])[:3]
        return "Worst congestion:\n" + "\n".join([f"• {h['name']}: {h['congestion_level']}/10 ({h['avg_speed_kmh']} km/h)" for h in worst])
    if any(w in m for w in ["elnino","el niño","drought","hotspot","wildfire","pm25","reservoir"]):
        elnino = _elnino_summary
        return (
            f"El Niño 2026: ONI {elnino['oni_index']} ({elnino['enso_phase']} {elnino['enso_strength']})\n"
            f"• Critical drought: {elnino['drought_critical_provinces']} provinces\n"
            f"• Fire hotspots: {elnino['total_fire_hotspots']} spots\n"
            f"• PM2.5 Jakarta: {elnino['avg_pm25_jakarta']} µg/m³\n"
            f"• Alert Level: {elnino['alert_level']}"
        )
    return f"Jakarta Pulse: {s['total_complaints']} complaints, {s['open_complaints']} open, {s['escalated_complaints']} escalated, {s['high_priority_count']} high priority. Resolution rate: {s['resolution_rate']}%."
