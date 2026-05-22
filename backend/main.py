import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, HOST, PORT, DEBUG
from database import init_db
from services.container import (
    binance_ws, indicator_engine, sentiment_fetcher, ai_engine, prediction_tracker
)
import services.container as svc
from services.binance_ws import BinanceWebSocket
from services.indicators import IndicatorEngine
from services.sentiment import SentimentFetcher
from services.ai_engine import AIEngine
from services.prediction_tracker import PredictionTracker
from routers import market_router, predictions_router, sentiment_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SatoshiSignal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SatoshiSignal backend...")
    init_db()

    svc.binance_ws = BinanceWebSocket()
    svc.indicator_engine = IndicatorEngine()
    svc.sentiment_fetcher = SentimentFetcher()
    svc.ai_engine = AIEngine()
    svc.prediction_tracker = PredictionTracker()

    await svc.binance_ws.connect()
    logger.info("Binance WebSocket connected")

    await svc.binance_ws.seed_historical_klines(200)
    logger.info("Historical candles seeded")

    asyncio.create_task(svc.indicator_engine.periodic_update(svc.binance_ws))
    asyncio.create_task(svc.sentiment_fetcher.periodic_update())
    asyncio.create_task(svc.prediction_tracker.periodic_verify(svc.binance_ws, svc.indicator_engine))

    yield

    logger.info("Shutting down SatoshiSignal backend...")
    await svc.binance_ws.disconnect()
    logger.info("Cleanup complete")


app = FastAPI(
    title="SatoshiSignal",
    description="AI-powered Bitcoin prediction market intelligence platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router, prefix="/api/market", tags=["Market"])
app.include_router(predictions_router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(sentiment_router, prefix="/api/sentiment", tags=["Sentiment"])

connected_clients: set[WebSocket] = set()


@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(connected_clients)}")
    try:
        while True:
            await asyncio.sleep(0.5)
            if svc.binance_ws and svc.binance_ws.latest_data:
                payload = svc.binance_ws.latest_data.copy()
                if svc.indicator_engine and svc.indicator_engine.latest_indicators:
                    payload["indicators"] = svc.indicator_engine.latest_indicators
                if svc.binance_ws.ticker_24h:
                    payload["ticker_24h"] = svc.binance_ws.ticker_24h
                try:
                    await websocket.send_json(payload)
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(connected_clients)}")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "SatoshiSignal",
        "ws_connected": svc.binance_ws is not None and svc.binance_ws.is_connected if svc.binance_ws else False,
        "latest_price": svc.binance_ws.latest_data.get("price") if svc.binance_ws and svc.binance_ws.latest_data else None,
    }


if __name__ == "__main__":
    import subprocess
    import sys

    import uvicorn

    # Kill any process already using our port
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        for line in result.stdout.splitlines():
            if f":{PORT}" in line and "LISTENING" in line:
                pid = line.strip().split()[-1]
                logger.warning(f"Port {PORT} is in use by PID {pid}, killing it...")
                subprocess.run(["taskkill", "/F", "/PID", pid], timeout=5)
                import time
                time.sleep(1)
                break
    except Exception:
        pass

    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)
