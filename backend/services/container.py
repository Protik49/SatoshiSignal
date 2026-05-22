from services.binance_ws import BinanceWebSocket
from services.indicators import IndicatorEngine
from services.sentiment import SentimentFetcher
from services.ai_engine import AIEngine
from services.prediction_tracker import PredictionTracker

binance_ws: BinanceWebSocket = None
indicator_engine: IndicatorEngine = None
sentiment_fetcher: SentimentFetcher = None
ai_engine: AIEngine = None
prediction_tracker: PredictionTracker = None
