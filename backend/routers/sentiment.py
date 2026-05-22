import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

import services.container as svc

router = APIRouter()
logger = logging.getLogger("SatoshiSignal.SentimentRouter")


@router.get("/current")
async def get_current_sentiment():
    if not svc.sentiment_fetcher:
        raise HTTPException(status_code=503, detail="Sentiment fetcher not initialized")
    sentiment = svc.sentiment_fetcher.get_current()
    if not sentiment:
        raise HTTPException(status_code=503, detail="Sentiment data not yet available")
    return sentiment


@router.get("/news")
async def get_news(limit: int = Query(default=10, le=50)):
    if not svc.sentiment_fetcher:
        raise HTTPException(status_code=503, detail="Sentiment fetcher not initialized")
    news = svc.sentiment_fetcher.get_news(limit)
    return {
        "count": len(news),
        "news": news,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/fear-greed")
async def get_fear_greed():
    if not svc.sentiment_fetcher:
        raise HTTPException(status_code=503, detail="Sentiment fetcher not initialized")
    fg = svc.sentiment_fetcher.get_fear_greed()
    if not fg:
        raise HTTPException(status_code=503, detail="Fear & Greed data not yet available")
    return fg
