import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

import services.container as svc
from models.prediction import (
    PredictionRequest,
    PredictionResponse,
    LivePredictionResponse,
    VerifyRequest,
)

router = APIRouter()
logger = logging.getLogger("SatoshiSignal.PredictionRouter")


@router.get("/latest", response_model=LivePredictionResponse)
async def get_latest_prediction(
    timeframe: str = Query(default="15m", pattern="^(5m|15m|60m)$"),
):
    if not svc.indicator_engine or not svc.indicator_engine.latest_indicators:
        raise HTTPException(status_code=503, detail="Indicator data not yet available")

    indicators = svc.indicator_engine.latest_indicators
    sentiment = svc.sentiment_fetcher.get_current() if svc.sentiment_fetcher else None

    if not svc.ai_engine:
        raise HTTPException(status_code=503, detail="AI engine not initialized")

    prediction = await svc.ai_engine.predict(indicators, sentiment, timeframe)

    pred_response = PredictionResponse(
        bullish_pct=prediction.get("bullish_pct", 50),
        bearish_pct=prediction.get("bearish_pct", 50),
        confidence=prediction.get("confidence", "Medium"),
        reasoning=prediction.get("reasoning", ""),
        key_drivers=prediction.get("key_drivers", []),
        predicted_direction=prediction.get("predicted_direction", "neutral"),
        timestamp=datetime.utcnow().isoformat(),
        timeframe=timeframe,
        price=indicators.get("price"),
    )

    if svc.prediction_tracker:
        await svc.prediction_tracker.record_prediction(
            {"timeframe": timeframe, **prediction},
            indicators.get("price", 0),
        )

    market_snapshot = {
        "price": indicators.get("price"),
        "rsi": indicators.get("rsi"),
        "ema_9": indicators.get("ema_9"),
        "ema_21": indicators.get("ema_21"),
        "ema_50": indicators.get("ema_50"),
        "conditions": indicators.get("conditions"),
    }

    return LivePredictionResponse(
        prediction=pred_response,
        market_snapshot=market_snapshot,
        sentiment=sentiment,
    )


@router.get("/history")
async def get_prediction_history(limit: int = Query(default=50, le=200)):
    if not svc.prediction_tracker:
        raise HTTPException(status_code=503, detail="Prediction tracker not initialized")
    history = svc.prediction_tracker.get_history(limit)
    for record in history:
        key_drivers_str = record.pop("key_drivers", "")
        record["key_drivers"] = [d.strip() for d in key_drivers_str.split(",")] if key_drivers_str else []
        record["was_correct"] = bool(record["was_correct"]) if record["was_correct"] is not None else None
    return {"count": len(history), "predictions": history}


@router.get("/accuracy")
async def get_accuracy_stats():
    if not svc.prediction_tracker:
        raise HTTPException(status_code=503, detail="Prediction tracker not initialized")
    return svc.prediction_tracker.get_accuracy_stats()


@router.post("/verify")
async def verify_prediction(body: VerifyRequest):
    if not svc.prediction_tracker:
        raise HTTPException(status_code=503, detail="Prediction tracker not initialized")

    entry_price = body.entry_price
    if entry_price is None:
        history = svc.prediction_tracker.get_history(50)
        matched = [h for h in history if h["id"] == body.prediction_id]
        if matched:
            entry_price = matched[0].get("entry_price", body.actual_price)
        else:
            entry_price = body.actual_price

    result = await svc.prediction_tracker.verify_manual(body.prediction_id, body.actual_price, entry_price)
    return result
