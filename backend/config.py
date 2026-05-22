import os

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY", "")

BINANCE_WS_TRADE_URL = os.getenv(
    "BINANCE_WS_TRADE_URL", "wss://stream.binance.com:9443/ws/btcusdt@trade"
)
BINANCE_WS_KLINE_URL = os.getenv(
    "BINANCE_WS_KLINE_URL", "wss://stream.binance.com:9443/ws/btcusdt@kline_1m"
)

BINANCE_REST_URL = "https://api.binance.com/api/v3"
ALTERNATIVE_ME_FNG_URL = "https://api.alternative.me/fng/"
NEWSDATA_API_URL = "https://newsdata.io/api/1/latest"

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

CACHE_TTL_MARKET = int(os.getenv("CACHE_TTL_MARKET", "10"))
CACHE_TTL_SENTIMENT = int(os.getenv("CACHE_TTL_SENTIMENT", "120"))
CACHE_TTL_AI = int(os.getenv("CACHE_TTL_AI", "30"))
CACHE_TTL_NEWS = int(os.getenv("CACHE_TTL_NEWS", "300"))

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

GEMINI_MODEL = "gemma-4-31b-it"
