from typing import Optional

from pydantic import BaseModel, Field


class IndicatorSet(BaseModel):
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    ema_9: Optional[float] = None
    ema_21: Optional[float] = None
    ema_50: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    atr: Optional[float] = None
    volume_ratio: Optional[float] = None
    price_change_1m: Optional[float] = None
    price_change_5m: Optional[float] = None
    price_change_15m: Optional[float] = None
    conditions: dict = Field(default_factory=dict)


class CandleData(BaseModel):
    open_time: Optional[int] = None
    close_time: Optional[int] = None
    open: float
    high: float
    low: float
    close: float
    volume: float
    is_closed: bool = False


class Ticker24h(BaseModel):
    price_change_pct: float = 0
    high_24h: float = 0
    low_24h: float = 0
    volume_24h: float = 0
    quote_volume_24h: float = 0
    trades_24h: int = 0
    open_24h: float = 0


class MarketSnapshot(BaseModel):
    price: float
    volume: Optional[float] = None
    timestamp: Optional[int] = None
    indicators: Optional[IndicatorSet] = None
    is_buyer_maker: Optional[bool] = None
    ticker_24h: Optional[Ticker24h] = None
