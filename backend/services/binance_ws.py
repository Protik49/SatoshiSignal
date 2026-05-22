import asyncio
import json
import logging
from datetime import datetime

import httpx
import websockets

from config import BINANCE_WS_TRADE_URL, BINANCE_WS_KLINE_URL, BINANCE_REST_URL

logger = logging.getLogger("SatoshiSignal.BinanceWS")


class BinanceWebSocket:
    def __init__(self):
        self._trade_ws = None
        self._kline_ws = None
        self._connected = False
        self._running = False
        self.latest_data = {}
        self.candles = []
        self._lock = asyncio.Lock()

    @property
    def is_connected(self):
        return self._connected

    async def connect(self):
        self._running = True
        asyncio.create_task(self._trade_stream())
        asyncio.create_task(self._kline_stream())

    async def disconnect(self):
        self._running = False
        self._connected = False
        for ws in [self._trade_ws, self._kline_ws]:
            if ws:
                try:
                    await ws.close()
                except Exception:
                    pass

    async def seed_historical_klines(self, limit: int = 200):
        """Fetch historical 1m klines from Binance REST API to populate initial candle buffer."""
        try:
            url = f"{BINANCE_REST_URL}/klines"
            params = {"symbol": "BTCUSDT", "interval": "1m", "limit": limit}
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    async with self._lock:
                        for k in data:
                            candle = {
                                "open_time": k[0],
                                "close_time": k[6],
                                "open": float(k[1]),
                                "high": float(k[2]),
                                "low": float(k[3]),
                                "close": float(k[4]),
                                "volume": float(k[5]),
                                "is_closed": True,
                            }
                            self.candles.append(candle)
                        logger.info(f"Seeded {len(self.candles)} historical candles")
                else:
                    logger.warning(f"Failed to fetch historical klines: {resp.status_code}")
        except Exception as e:
            logger.error(f"Error seeding historical klines: {e}")

    async def _trade_stream(self):
        retry_delay = 1
        max_delay = 60
        while self._running:
            try:
                async with websockets.connect(BINANCE_WS_TRADE_URL) as ws:
                    self._trade_ws = ws
                    self._connected = True
                    retry_delay = 1
                    logger.info("Trade stream connected")
                    async for message in ws:
                        data = json.loads(message)
                        async with self._lock:
                            self.latest_data["price"] = float(data["p"])
                            self.latest_data["volume"] = float(data["q"])
                            self.latest_data["timestamp"] = data["T"]
                            self.latest_data["is_buyer_maker"] = data["m"]
            except Exception as e:
                self._connected = False
                logger.warning(f"Trade stream disconnected: {e}. Reconnecting in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, max_delay)

    async def _kline_stream(self):
        retry_delay = 1
        max_delay = 60
        while self._running:
            try:
                async with websockets.connect(BINANCE_WS_KLINE_URL) as ws:
                    self._kline_ws = ws
                    retry_delay = 1
                    logger.info("Kline stream connected")
                    async for message in ws:
                        data = json.loads(message)
                        kline = data.get("k", {})
                        candle = {
                            "open_time": kline.get("t"),
                            "close_time": kline.get("T"),
                            "open": float(kline.get("o", 0)),
                            "high": float(kline.get("h", 0)),
                            "low": float(kline.get("l", 0)),
                            "close": float(kline.get("c", 0)),
                            "volume": float(kline.get("v", 0)),
                            "is_closed": kline.get("x", False),
                        }
                        async with self._lock:
                            if candle["is_closed"]:
                                self.candles.append(candle)
                                if len(self.candles) > 500:
                                    self.candles = self.candles[-500:]
                            else:
                                self.latest_data["current_candle"] = candle
            except Exception as e:
                self._connected = False
                logger.warning(f"Kline stream disconnected: {e}. Reconnecting in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, max_delay)

    def get_ohlcv(self, limit: int = 100):
        candles = self.candles[-limit:] if self.candles else []
        if len(candles) < limit:
            current = self.latest_data.get("current_candle")
            if current:
                candles = candles + [current]
        return candles
