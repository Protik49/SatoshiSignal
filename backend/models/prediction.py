from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    timeframe: str = Field(default="15m", description="Prediction timeframe: 5m, 15m, or 60m")


class PredictionResponse(BaseModel):
    bullish_pct: float = Field(description="Bullish probability 0-100")
    bearish_pct: float = Field(description="Bearish probability 0-100")
    confidence: str = Field(description="Confidence level: Low, Medium, High")
    reasoning: str = Field(description="Concise reasoning for prediction")
    key_drivers: List[str] = Field(description="Key drivers influencing the prediction")
    predicted_direction: str = Field(description="Predicted direction: bullish, bearish, or neutral")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    timeframe: str = "15m"
    price: Optional[float] = None


class PredictionRecord(BaseModel):
    id: int
    timestamp: str
    timeframe: str
    bullish_pct: float
    bearish_pct: float
    confidence: str
    predicted_direction: str
    reasoning: Optional[str] = None
    key_drivers: Optional[str] = None
    entry_price: Optional[float] = None
    actual_outcome: Optional[str] = None
    was_correct: Optional[bool] = None
    resolved_at: Optional[str] = None


class LivePredictionResponse(BaseModel):
    prediction: PredictionResponse
    market_snapshot: dict = Field(default_factory=dict)
    sentiment: Optional[dict] = None


class VerifyRequest(BaseModel):
    prediction_id: int
    actual_price: float
    entry_price: Optional[float] = None


class AccuracyStats(BaseModel):
    win_rate: float
    total_predictions: int
    wins: int
    by_timeframe: List[dict] = Field(default_factory=list)
