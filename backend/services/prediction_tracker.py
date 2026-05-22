import asyncio
import logging
from datetime import datetime

from database import Database

logger = logging.getLogger("SatoshiSignal.PredictionTracker")

SUPPORTED_TIMEFRAMES = {"5m": 5, "15m": 15, "60m": 60}


class PredictionTracker:
    def __init__(self):
        self.pending_predictions: list = []
        self._lock = asyncio.Lock()

    async def periodic_verify(self, binance_ws, indicator_engine):
        while True:
            await asyncio.sleep(60)
            try:
                await self._verify_pending(binance_ws)
            except Exception as e:
                logger.error(f"Prediction verification error: {e}")

    async def record_prediction(self, prediction: dict, entry_price: float) -> int:
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": prediction.get("timeframe", "15m"),
            "bullish_pct": prediction.get("bullish_pct", 50),
            "bearish_pct": prediction.get("bearish_pct", 50),
            "confidence": prediction.get("confidence", "Medium"),
            "predicted_direction": prediction.get("predicted_direction", "neutral"),
            "reasoning": prediction.get("reasoning", ""),
            "key_drivers": prediction.get("key_drivers", []),
            "entry_price": entry_price,
        }
        pred_id = Database.save_prediction(record)
        record["id"] = pred_id

        async with self._lock:
            self.pending_predictions.append(record)

        return pred_id

    async def _verify_pending(self, binance_ws):
        current_price = binance_ws.latest_data.get("price") if binance_ws and binance_ws.latest_data else None
        if not current_price:
            return

        now = datetime.utcnow()
        resolved = []

        async with self._lock:
            remaining = []
            for pred in self.pending_predictions:
                pred_time = datetime.fromisoformat(pred["timestamp"])
                tf_minutes = SUPPORTED_TIMEFRAMES.get(pred["timeframe"], 15)
                elapsed = (now - pred_time).total_seconds() / 60.0

                if elapsed >= tf_minutes:
                    entry = pred.get("entry_price", 0)
                    actual_direction = "bullish" if current_price > entry else "bearish" if current_price < entry else "neutral"
                    was_correct = actual_direction == pred.get("predicted_direction", "neutral")
                    Database.resolve_prediction(pred["id"], actual_direction, was_correct)
                    resolved.append({**pred, "actual_outcome": actual_direction, "was_correct": was_correct})
                else:
                    remaining.append(pred)
            self.pending_predictions = remaining

        for r in resolved:
            logger.info(
                f"Prediction #{r['id']} resolved: predicted={r['predicted_direction']}, "
                f"actual={r['actual_outcome']}, correct={r['was_correct']}"
            )

    async def verify_manual(self, prediction_id: int, actual_price: float, entry_price: float) -> dict:
        actual_direction = "bullish" if actual_price > entry_price else "bearish" if actual_price < entry_price else "neutral"

        was_correct = False
        async with self._lock:
            for pred in self.pending_predictions:
                if pred["id"] == prediction_id:
                    was_correct = actual_direction == pred.get("predicted_direction", "neutral")
                    break
            self.pending_predictions = [
                p for p in self.pending_predictions if p["id"] != prediction_id
            ]

        Database.resolve_prediction(prediction_id, actual_direction, was_correct)

        return {
            "prediction_id": prediction_id,
            "actual_direction": actual_direction,
            "was_correct": was_correct,
            "verified_at": datetime.utcnow().isoformat(),
        }

    def get_accuracy_stats(self) -> dict:
        return Database.get_accuracy_stats()

    def get_history(self, limit: int = 50) -> list:
        return Database.get_predictions(limit)
