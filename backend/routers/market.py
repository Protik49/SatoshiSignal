import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from services.container import binance_ws, indicator_engine
from models.market import MarketSnapshot, IndicatorSet, CandleData

router = APIRouter()
logger = logging.getLogger("SatoshiSignal.MarketRouter")


@router.get("/current", response_model=MarketSnapshot)
async def get_current_market():
    if not binance_ws or not binance_ws.latest_data:
        raise HTTPException(status_code=503, detail="Market data not yet available")
    data = binance_ws.latest_data
    indicators = indicator_engine.latest_indicators if indicator_engine else None

    indicator_set = None
    if indicators:
        indicator_set = IndicatorSet(**{k: v for k, v in indicators.items() if k != "conditions"})
        indicator_set.conditions = indicators.get("conditions", {})

    return MarketSnapshot(
        price=data.get("price", 0),
        volume=data.get("volume"),
        timestamp=data.get("timestamp"),
        indicators=indicator_set,
        is_buyer_maker=data.get("is_buyer_maker"),
    )


@router.get("/candles")
async def get_candles(
    timeframe: str = Query(default="1m", description="Candle interval"),
    limit: int = Query(default=100, le=500),
):
    if not binance_ws:
        raise HTTPException(status_code=503, detail="WebSocket not connected")
    candles = binance_ws.get_ohlcv(limit)
    return {
        "timeframe": timeframe,
        "count": len(candles),
        "candles": candles,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/indicators")
async def get_indicators():
    if not indicator_engine or not indicator_engine.latest_indicators:
        raise HTTPException(status_code=503, detail="Indicators not yet computed")
    indicators = indicator_engine.latest_indicators
    return {
        "indicators": indicators,
        "updated_at": datetime.utcnow().isoformat(),
    }
