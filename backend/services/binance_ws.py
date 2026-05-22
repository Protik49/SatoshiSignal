import asyncio
import json
import logging
import random
from datetime import datetime

import httpx
import websockets

from config import BINANCE_WS_TRADE_URL, BINANCE_WS_KLINE_URL, BINANCE_REST_URL
from services.mock_data import MockDataGenerator

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
        self._using_mock = False
        self._mock_gen = None
        self._connection_attempt_time = None
        self._fallback_activated = False

    @property
    def is_connected(self):
        return self._connected

    async def connect(self):
        self._running = True
        self._connection_attempt_time = asyncio.get_event_loop().time()
        self._mock_gen = MockDataGenerator(base_price=77500)
        asyncio.create_task(self._trade_stream())
        asyncio.create_task(self._kline_stream())
        asyncio.create_task(self._check_connection_fallback())
        
        # Seed historical candles
        try:
            await self.seed_historical_klines(200)
        except Exception as e:
            logger.warning(f"Failed to seed historical candles: {e}")

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

    async def _check_connection_fallback(self):
        """Check if connection is stuck and activate mock data after 5 seconds."""
        await asyncio.sleep(5)
        
        if not self._connected and not self._fallback_activated:
            logger.warning("Binance WebSocket connection failed to establish. Activating mock data mode.")
            self._fallback_activated = True
            self._using_mock = True
            
            # Seed mock candles
            if self._mock_gen:
                async with self._lock:
                    self.candles = self._mock_gen.generate_historical_candles(200)
            
            # Start mock data stream
            asyncio.create_task(self._mock_data_stream())

    async def _mock_data_stream(self):
        """Generate mock data for development/testing when Binance is unreachable."""
        logger.info("Starting mock data stream (development mode)")
        
        while self._running and self._using_mock:
            try:
                await asyncio.sleep(random.uniform(0.5, 1.5))
                
                if self._mock_gen:
                    # Generate trade tick every 500-1500ms
                    trade_data = self._mock_gen.generate_trade_tick()
                    async with self._lock:
                        self.latest_data["price"] = float(trade_data["p"])
                        self.latest_data["volume"] = float(trade_data["q"])
                        self.latest_data["timestamp"] = trade_data["T"]
                        self.latest_data["is_buyer_maker"] = trade_data["m"]
                    
                    # Generate kline every 60 seconds
                    if random.random() < 0.02:  # ~2% chance per iteration
                        kline_data = self._mock_gen.generate_kline()
                        kline = kline_data.get("k", {})
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
                                
                    # Mark as connected for mock mode
                    self._connected = True
                    
            except Exception as e:
                logger.error(f"Mock data stream error: {e}")
                await asyncio.sleep(1)

    def get_ohlcv(self, limit: int = 100):
        candles = self.candles[-limit:] if self.candles else []
        if len(candles) < limit:
            current = self.latest_data.get("current_candle")
            if current:
                candles = candles + [current]
        return candles
