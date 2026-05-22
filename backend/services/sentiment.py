import asyncio
import logging
from datetime import datetime
from typing import Optional

import httpx

from config import (
    NEWSDATA_API_KEY,
    ALTERNATIVE_ME_FNG_URL,
    NEWSDATA_API_URL,
    CACHE_TTL_SENTIMENT,
    CACHE_TTL_NEWS,
)
from utils.caching import cache_get, cache_set

logger = logging.getLogger("SatoshiSignal.Sentiment")

BULLISH_KEYWORDS = {
    "surge", "rally", "bullish", "breakout", "moon", "ath", "all-time high",
    "adoption", "etf inflow", "institutional", "upgrade", "buy", "long",
    "green", "pump", "uptrend", "support", "rebound", "recovery",
    "halving", "accumulation", "whale buying", "positive", "growth",
}

BEARISH_KEYWORDS = {
    "crash", "dump", "bearish", "breakdown", "sell-off", "selloff", "panic",
    "ban", "hack", "exploit", "scam", "fraud", "downgrade", "sell", "short",
    "red", "downtrend", "resistance", "liquidation", "fud", "fear",
    "negative", "decline", "drop", "plunge", "loss", "risk",
}


class SentimentFetcher:
    def __init__(self):
        self._lock = asyncio.Lock()
        self.latest_sentiment: dict = {}
        self.latest_news: list = []
        self.fear_greed_data: dict = {}

    async def periodic_update(self):
        while True:
            try:
                await self.refresh_all()
            except Exception as e:
                logger.error(f"Sentiment update error: {e}")
            await asyncio.sleep(CACHE_TTL_SENTIMENT)

    async def refresh_all(self):
        fg, news = await asyncio.gather(
            self._fetch_fear_greed(),
            self._fetch_news(),
        )
        async with self._lock:
            if fg:
                self.fear_greed_data = fg
            if news:
                self.latest_news = news
            self.latest_sentiment = self._compute_sentiment_score()

    async def _fetch_fear_greed(self) -> Optional[dict]:
        cache_key = "fear_greed"
        cached = cache_get(cache_key)
        if cached:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(ALTERNATIVE_ME_FNG_URL)
                if resp.status_code == 200:
                    data = resp.json()
                    entry = data.get("data", [{}])[0]
                    result = {
                        "value": int(entry.get("value", 50)),
                        "classification": entry.get("value_classification", "Neutral"),
                        "timestamp": entry.get("timestamp", ""),
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                    cache_set(cache_key, result, ttl=CACHE_TTL_SENTIMENT)
                    return result
        except Exception as e:
            logger.error(f"Fear & Greed fetch error: {e}")
        return None

    async def _fetch_news(self, limit: int = 10) -> list:
        cache_key = f"newsdata_crypto_{limit}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        news_list = []

        if NEWSDATA_API_KEY:
            try:
                params = {
                    "apikey": NEWSDATA_API_KEY,
                    "q": "bitcoin crypto",
                    "language": "en",
                    "size": min(limit, 10),
                    "category": "business,technology",
                }
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(NEWSDATA_API_URL, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("status") == "success":
                            for article in data.get("results", [])[:limit]:
                                news_list.append({
                                    "title": article.get("title", ""),
                                    "url": article.get("link", ""),
                                    "published_at": article.get("pubDate", ""),
                                    "source": article.get("source_name", ""),
                                    "source_url": article.get("source_url", ""),
                                    "source_icon": article.get("source_icon", ""),
                                    "description": article.get("description", "")[:300],
                                    "image_url": article.get("image_url", ""),
                                    "keywords": article.get("keywords", []) or [],
                                    "category": article.get("category", []),
                                    "sentiment": self._analyze_article_sentiment(
                                        article.get("title", ""),
                                        article.get("description", ""),
                                    ),
                                })
            except Exception as e:
                logger.error(f"NewsData.io fetch error: {e}")

        if not news_list:
            news_list = self._get_fallback_news()

        cache_set(cache_key, news_list, ttl=CACHE_TTL_NEWS)
        return news_list

    def _analyze_article_sentiment(self, title: str, description: str) -> str:
        text = f"{title} {description}".lower()
        bull_count = sum(1 for kw in BULLISH_KEYWORDS if kw in text)
        bear_count = sum(1 for kw in BEARISH_KEYWORDS if kw in text)

        if bull_count > bear_count:
            return "bullish"
        elif bear_count > bull_count:
            return "bearish"
        return "neutral"

    def _get_fallback_news(self) -> list:
        return [
            {
                "title": "Configure NEWSDATA_API_KEY in .env for live crypto news",
                "url": "https://newsdata.io",
                "published_at": datetime.utcnow().isoformat(),
                "source": "SatoshiSignal",
                "source_url": "",
                "source_icon": "",
                "description": "Get a free API key at newsdata.io and add it to your backend .env file.",
                "image_url": "",
                "keywords": ["bitcoin", "crypto"],
                "category": ["business"],
                "sentiment": "neutral",
            }
        ]

    def _compute_sentiment_score(self) -> dict:
        score = 0.5
        components = []

        fg_value = self.fear_greed_data.get("value", 50)
        fg_normalized = fg_value / 100.0
        score = score * 0.6 + fg_normalized * 0.4

        classification = self.fear_greed_data.get("classification", "Neutral")
        if "extreme fear" in classification.lower():
            components.append("Fear & Greed: Extreme Fear (contrarian bullish)")
        elif "fear" in classification.lower():
            components.append("Fear & Greed: Fear (cautious)")
        elif "greed" in classification.lower():
            components.append("Fear & Greed: Greed (bullish)")
        elif "extreme greed" in classification.lower():
            components.append("Fear & Greed: Extreme Greed (overheated)")

        if self.latest_news:
            bull_count = sum(1 for n in self.latest_news if n.get("sentiment") == "bullish")
            bear_count = sum(1 for n in self.latest_news if n.get("sentiment") == "bearish")
            total = len(self.latest_news)

            if total > 0:
                news_ratio = (bull_count - bear_count) / total
                news_normalized = 0.5 + (news_ratio * 0.5)
                score = score * 0.7 + news_normalized * 0.3

            components.append(f"News: {bull_count} bullish, {bear_count} bearish out of {total} articles")

        sentiment_label = "bearish" if score < 0.4 else ("bullish" if score > 0.6 else "neutral")

        return {
            "score": round(score, 3),
            "label": sentiment_label,
            "fear_greed": self.fear_greed_data,
            "components": components,
            "updated_at": datetime.utcnow().isoformat(),
        }

    def get_current(self) -> dict:
        return self.latest_sentiment

    def get_news(self, limit: int = 10) -> list:
        return self.latest_news[:limit]

    def get_fear_greed(self) -> dict:
        return self.fear_greed_data
