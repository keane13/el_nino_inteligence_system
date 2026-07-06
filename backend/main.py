from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Routers from features
from features.chat import router as chat_router
from features.data import router as data_router
from features.elnino import router as elnino_router
from features.webhooks import router as webhooks_router
from features.forecasting import router as forecasting_router

# Import State to initialize globals on startup
from core import state

app = FastAPI(title="Jakarta Pulse API v2", version="2.0.0")
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Include Routers
app.include_router(chat_router.router)
app.include_router(data_router.router)
app.include_router(elnino_router.router)
app.include_router(webhooks_router.router)
app.include_router(forecasting_router.router)

@app.get("/api/health")
def health():
    return {
        "status": "ok", 
        "version": "2.0.0", 
        "complaints": len(state._df), 
        "elnino_alert": state._elnino_summary.get("alert_level", "N/A")
    }
