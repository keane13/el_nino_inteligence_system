from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import os, httpx
from features.data.data import get_elnino_summary

router = APIRouter(tags=["Webhooks"])

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

async def send_telegram_alert(message: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram settings are not fully configured in .env.")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"}
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json=payload)
        except Exception as e:
            print(f"Failed to send telegram alert: {e}")

class AlertWebhookRequest(BaseModel):
    issue_id: str
    priority: str
    title: str
    description: str

@router.post("/api/webhook/telegram")
async def telegram_webhook(alert: AlertWebhookRequest):
    if alert.priority.lower() in ["high", "critical"]:
        message = f"🚨 *ALERT {alert.priority.upper()}* 🚨\n*ID:* {alert.issue_id}\n*Title:* {alert.title}\n*Description:* {alert.description}"
        await send_telegram_alert(message)
        return {"status": "alert sent"}
    return {"status": "ignored", "reason": "priority not high or critical"}

@router.get("/api/webhook/elnino-check")
async def elnino_alert_check():
    summary = get_elnino_summary()
    alerts_sent = []
    if summary["avg_pm25_jakarta"] > 150:
        msg = f"🌫️ *EMERGENCY AIR QUALITY ALERT*\nJakarta avg PM2.5 *{summary['avg_pm25_jakarta']} µg/m³*\nCategory: {summary['worst_aqi_category']} at {summary['worst_aqi_station']}\n⚠️ Suspend outdoor activities immediately!"
        await send_telegram_alert(msg)
        alerts_sent.append("aqi")
    if summary["total_fire_hotspots"] > 800:
        msg = f"🔥 *MASSIVE WILDFIRE ALERT*\nTotal active hotspots: *{summary['total_fire_hotspots']}* spots\nHigh confidence: {summary['high_confidence_hotspots']} spots\n⚠️ Mobilize Manggala Agni immediately!"
        await send_telegram_alert(msg)
        alerts_sent.append("fire")
    if summary["drought_critical_provinces"] >= 3:
        msg = f"🏜️ *EL NIÑO DROUGHT ALERT*\n{summary['drought_critical_provinces']} provinces at CRITICAL status\nTotal {summary['total_population_affected']:,} people affected\n⚠️ Activate emergency water distribution!"
        await send_telegram_alert(msg)
        alerts_sent.append("drought")
    return {"alerts_sent": alerts_sent, "summary": summary}
