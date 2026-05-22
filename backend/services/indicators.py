import asyncio
import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("SatoshiSignal.Indicators")


class IndicatorEngine:
    def __init__(self):
        self.latest_indicators: dict = {}
        self._lock = asyncio.Lock()

    async def periodic_update(self, binance_ws):
        while True:
            await asyncio.sleep(5)
            candles = binance_ws.get_ohlcv(100)
            if len(candles) < 14:
                continue
            try:
                indicators = self.compute(candles)
                async with self._lock:
                    self.latest_indicators = indicators
            except Exception as e:
                logger.error(f"Indicator computation error: {e}")

    def compute(self, candles: list) -> dict:
        df = pd.DataFrame(candles)
        df.rename(
            columns={
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
            inplace=True,
        )

        result = {}

        # RSI (14)
        try:
            import pandas_ta as ta
            rsi = ta.rsi(df["close"], length=14)
            result["rsi"] = float(round(rsi.iloc[-1], 2)) if not pd.isna(rsi.iloc[-1]) else None

            # MACD
            macd_df = ta.macd(df["close"], fast=12, slow=26, signal=9)
            macd_line = macd_df.iloc[-1]
            result["macd"] = float(round(macd_line["MACD_12_26_9"], 4)) if not pd.isna(macd_line["MACD_12_26_9"]) else None
            result["macd_signal"] = float(round(macd_line["MACDs_12_26_9"], 4)) if not pd.isna(macd_line["MACDs_12_26_9"]) else None
            result["macd_histogram"] = float(round(macd_line["MACDh_12_26_9"], 4)) if not pd.isna(macd_line["MACDh_12_26_9"]) else None

            # EMAs
            for period in [9, 21, 50]:
                ema = ta.ema(df["close"], length=period)
                result[f"ema_{period}"] = float(round(ema.iloc[-1], 2)) if not pd.isna(ema.iloc[-1]) else None

            # Bollinger Bands
            bb = ta.bbands(df["close"], length=20, std=2)
            result["bb_upper"] = float(round(bb.iloc[-1]["BBU_20_2.0"], 2)) if not pd.isna(bb.iloc[-1]["BBU_20_2.0"]) else None
            result["bb_middle"] = float(round(bb.iloc[-1]["BBM_20_2.0"], 2)) if not pd.isna(bb.iloc[-1]["BBM_20_2.0"]) else None
            result["bb_lower"] = float(round(bb.iloc[-1]["BBL_20_2.0"], 2)) if not pd.isna(bb.iloc[-1]["BBL_20_2.0"]) else None

            # ATR (volatility)
            atr = ta.atr(df["high"], df["low"], df["close"], length=14)
            result["atr"] = float(round(atr.iloc[-1], 2)) if not pd.isna(atr.iloc[-1]) else None

            # Volume Delta
            result["volume_sma_20"] = float(round(df["volume"].rolling(20).mean().iloc[-1], 2))
            result["volume_ratio"] = float(round(df["volume"].iloc[-1] / result["volume_sma_20"], 2)) if result["volume_sma_20"] else None

        except ImportError:
            logger.warning("pandas-ta not available, falling back to manual RSI")
            result["rsi"] = self._compute_rsi_manual(df)
            ema_9 = df["close"].ewm(span=9, adjust=False).mean()
            result["ema_9"] = float(round(ema_9.iloc[-1], 2))
            ema_21 = df["close"].ewm(span=21, adjust=False).mean()
            result["ema_21"] = float(round(ema_21.iloc[-1], 2))
            ema_50 = df["close"].ewm(span=50, adjust=False).mean()
            result["ema_50"] = float(round(ema_50.iloc[-1], 2))
            result["volume_ratio"] = None

        # Price stats
        result["price"] = float(df["close"].iloc[-1])
        result["price_change_1m"] = float(round(
            (df["close"].iloc[-1] - df["close"].iloc[-2]) / df["close"].iloc[-2] * 100, 4
        ) if len(df) >= 2 else 0)
        result["price_change_5m"] = float(round(
            (df["close"].iloc[-1] - df["close"].iloc[-5]) / df["close"].iloc[-5] * 100, 4
        ) if len(df) >= 5 else 0)
        result["price_change_15m"] = float(round(
            (df["close"].iloc[-1] - df["close"].iloc[-min(15, len(df))]) / df["close"].iloc[-min(15, len(df))] * 100, 4
        ) if len(df) >= 3 else 0)

        # Condition descriptions
        result["conditions"] = self._describe_conditions(result)

        return result

    def _describe_conditions(self, indicators: dict) -> dict:
        conditions = {}

        rsi = indicators.get("rsi")
        if rsi is not None:
            if rsi > 70:
                conditions["rsi"] = "overbought"
            elif rsi < 30:
                conditions["rsi"] = "oversold"
            else:
                conditions["rsi"] = "neutral"

        macd = indicators.get("macd")
        macd_signal = indicators.get("macd_signal")
        if macd is not None and macd_signal is not None:
            conditions["macd"] = "bullish" if macd > macd_signal else "bearish"

        price = indicators.get("price")
        ema_9 = indicators.get("ema_9")
        ema_21 = indicators.get("ema_21")
        ema_50 = indicators.get("ema_50")

        if price and ema_50:
            if price > ema_50:
                conditions["trend_50"] = "above_ema_50 (bullish)"
            else:
                conditions["trend_50"] = "below_ema_50 (bearish)"

        if ema_9 and ema_21:
            conditions["ema_cross"] = "bullish" if ema_9 > ema_21 else "bearish"

        bb_upper = indicators.get("bb_upper")
        bb_lower = indicators.get("bb_lower")
        if price and bb_upper and bb_lower:
            if price >= bb_upper:
                conditions["bollinger"] = "above_upper (overbought)"
            elif price <= bb_lower:
                conditions["bollinger"] = "below_lower (oversold)"
            else:
                conditions["bollinger"] = "within_bands"

        vol_ratio = indicators.get("volume_ratio")
        if vol_ratio is not None:
            if vol_ratio > 1.5:
                conditions["volume"] = "high"
            elif vol_ratio < 0.5:
                conditions["volume"] = "low"
            else:
                conditions["volume"] = "normal"

        return conditions

    def _compute_rsi_manual(self, df: pd.DataFrame, period: int = 14) -> Optional[float]:
        close = df["close"]
        delta = close.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        val = rsi.iloc[-1]
        return float(round(val, 2)) if not pd.isna(val) else None
