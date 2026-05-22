import os
import logging
import re

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("SatoshiSignal.Config")


def _validate_key(key_name: str, value: str, required: bool = False, pattern: str | None = None) -> str:
    """Validate an API key is present and matches expected format."""
    if not value:
        if required:
            raise EnvironmentError(
                f"Required environment variable {key_name} is not set. "
                f"Add it to your backend/.env file. See backend/.env.example for reference."
            )
        logger.warning(f"Optional key {key_name} is not set — related features will be disabled")
        return ""

    masked = value[:4] + "..." + value[-4:] if len(value) > 12 else "***"
    if pattern and not re.match(pattern, value):
        raise ValueError(
            f"Environment variable {key_name} has invalid format (got {masked}). "
            f"Check your backend/.env file."
        )
    logger.info(f"{key_name} loaded ({masked})")
    return value


GEMINI_API_KEY = _validate_key(
    "GEMINI_API_KEY",
    os.getenv("GEMINI_API_KEY", ""),
    required=True,
    pattern=r"^AIza[A-Za-z0-9_-]{30,40}$",
)

OPENROUTER_API_KEY = _validate_key(
    "OPENROUTER_API_KEY",
    os.getenv("OPENROUTER_API_KEY", ""),
    required=False,
)

NEWSDATA_API_KEY = _validate_key(
    "NEWSDATA_API_KEY",
    os.getenv("NEWSDATA_API_KEY", ""),
    required=False,
    pattern=r"^pub_[a-f0-9]{24,32}$",
)

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

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
