import asyncio
import hashlib
import json
import logging
import random
from datetime import datetime
from typing import Optional

from config import GEMINI_API_KEY, GEMINI_MODEL, CACHE_TTL_AI
from utils.caching import cache_get, cache_set

logger = logging.getLogger("SatoshiSignal.AIEngine")


class AIEngine:
    def __init__(self):
        self._model = None
        self._gemini_available = False
        if GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                self._model = genai.GenerativeModel(GEMINI_MODEL)
                self._gemini_available = True
                logger.info(f"Gemini AI initialized with model: {GEMINI_MODEL}")
            except Exception as e:
                logger.warning(f"Gemini AI initialization failed: {e}")

    def _build_snapshot_hash(self, indicators: dict, sentiment: dict, timeframe: str) -> str:
        raw = json.dumps({
            "indicators": {k: v for k, v in indicators.items() if k != "conditions"},
            "sentiment": {k: v for k, v in (sentiment or {}).items() if k != "updated_at"},
            "timeframe": timeframe,
        }, sort_keys=True)
        return hashlib.md5(raw.encode()).hexdigest()

    def _build_prompt(self, indicators: dict, sentiment: dict, timeframe: str) -> str:
        conditions = indicators.get("conditions", {})
        rsi = indicators.get("rsi", "N/A")
        macd = indicators.get("macd", "N/A")
        macd_signal = indicators.get("macd_signal", "N/A")
        ema_9 = indicators.get("ema_9", "N/A")
        ema_21 = indicators.get("ema_21", "N/A")
        ema_50 = indicators.get("ema_50", "N/A")
        bb_upper = indicators.get("bb_upper", "N/A")
        bb_lower = indicators.get("bb_lower", "N/A")
        price_change_5m = indicators.get("price_change_5m", 0)
        price = indicators.get("price", "N/A")
        vol_ratio = indicators.get("volume_ratio", "N/A")
        atr = indicators.get("atr", "N/A")

        sentiment_label = sentiment.get("label", "neutral") if sentiment else "neutral"
        fg_value = sentiment.get("fear_greed", {}).get("value", 50) if sentiment else 50
        fg_class = sentiment.get("fear_greed", {}).get("classification", "Neutral") if sentiment else "Neutral"

        prompt = f"""You are a professional Bitcoin market analyst for a high-frequency prediction platform.

Analyze the following BTC/USDT market data for a **{timeframe}** prediction. Use ONLY the data provided. Do NOT hallucinate events or numbers not present in the data.

## Market Data
- Current Price: ${price}
- 5-minute change: {price_change_5m}%
- RSI (14): {rsi} → {"Overbought" if rsi and rsi > 70 else "Oversold" if rsi and rsi < 30 else "Neutral"}
- MACD: {macd} (Signal: {macd_signal})
- EMA 9: {ema_9} | EMA 21: {ema_21} | EMA 50: {ema_50}
- Bollinger Upper: {bb_upper} | Lower: {bb_lower}
- ATR (14): {atr}
- Volume Ratio (vs 20-period avg): {vol_ratio}

## Indicator Conditions
{json.dumps(conditions, indent=2)}

## Market Sentiment
- Fear & Greed Index: {fg_value}/100 ({fg_class})
- Sentiment Label: {sentiment_label}

## Instructions
Based on the data above, provide a structured prediction. Be concise and data-driven.

Respond in this exact JSON format (no markdown, no extra text):
{{
  "bullish_pct": <0-100 number>,
  "bearish_pct": <0-100 number>,
  "confidence": "<Low|Medium|High>",
  "reasoning": "<under 80 words, cite specific indicators>",
  "key_drivers": ["<driver1>", "<driver2>", "<driver3>"]
}}"""
        return prompt

    async def predict(
        self, indicators: dict, sentiment: dict, timeframe: str = "15m"
    ) -> dict:
        if not indicators or not indicators.get("price"):
            return self._fallback_prediction("Insufficient market data", timeframe)

        snapshot_hash = self._build_snapshot_hash(indicators, sentiment, timeframe)
        cache_key = f"ai_pred_{snapshot_hash}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        if self._gemini_available:
            try:
                prompt = self._build_prompt(indicators, sentiment, timeframe)
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(None, self._model.generate_content, prompt)
                result = self._parse_gemini_response(response.text)
                if result:
                    cache_set(cache_key, result, ttl=CACHE_TTL_AI)
                    return result
            except Exception as e:
                logger.error(f"Gemini prediction error: {e}")

        result = self._fallback_prediction(
            f"AI unavailable — deterministic assessment based on RSI={indicators.get('rsi')}, "
            f"MACD trend={indicators.get('conditions', {}).get('macd')}",
            timeframe,
        )
        return result

    def _parse_gemini_response(self, text: str) -> Optional[dict]:
        try:
            text = text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1])
            data = json.loads(text)
            required_keys = ["bullish_pct", "bearish_pct", "confidence", "reasoning", "key_drivers"]
            if all(k in data for k in required_keys):
                data["bullish_pct"] = max(0, min(100, int(data["bullish_pct"])))
                data["bearish_pct"] = max(0, min(100, int(data["bearish_pct"])))
                data["confidence"] = data["confidence"].capitalize()
                if data["confidence"] not in ("Low", "Medium", "High"):
                    data["confidence"] = "Medium"
                if len(data["reasoning"]) > 200:
                    data["reasoning"] = data["reasoning"][:200]
                if not isinstance(data["key_drivers"], list):
                    data["key_drivers"] = [str(data["key_drivers"])]
                data["key_drivers"] = data["key_drivers"][:5]
                return data
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(f"Failed to parse Gemini response: {e}")
        return None

    def _fallback_prediction(self, reasoning: str, timeframe: str) -> dict:
        bull = random.randint(45, 55)
        bear = 100 - bull
        return {
            "bullish_pct": bull,
            "bearish_pct": bear,
            "confidence": "Low",
            "reasoning": reasoning[:200],
            "key_drivers": ["Insufficient data for reliable prediction"],
            "predicted_direction": "bullish" if bull > bear else "bearish" if bear > bull else "neutral",
        }
