# SatoshiSignal

AI-powered Bitcoin prediction market intelligence platform. Real-time BTC data, probability forecasts with reasoning, sentiment analysis, and accuracy tracking — built for hackathon demos.

> **Not financial advice.** This is an AI-assisted market intelligence tool that produces probability-based forecasts. It does not execute trades or manage funds.

---

## Architecture

```
SatoshiSignal/
├── backend/                  # Python FastAPI server
│   ├── main.py               # App entry, WebSocket endpoint, lifespan
│   ├── config.py             # Environment & API key configuration
│   ├── database.py            # SQLite persistence for predictions
│   ├── models/
│   │   ├── market.py          # Pydantic models (MarketSnapshot, IndicatorSet, Ticker24h, CandleData)
│   │   └── prediction.py      # Pydantic models (PredictionResponse, etc.)
│   ├── routers/
│   │   ├── market.py          # GET /api/market/current, /candles, /indicators
│   │   ├── predictions.py     # GET /api/predictions/latest, /history, /accuracy; POST /verify
│   │   └── sentiment.py       # GET /api/sentiment/current, /news, /fear-greed
│   ├── services/
│   │   ├── container.py       # Module-level service instances (avoids circular imports)
│   │   ├── binance_ws.py      # Binance WebSocket + REST (trade/kline streams, 24h ticker, historical seeding)
│   │   ├── indicators.py      # pandas-ta indicator computation (RSI, MACD, EMA, BB, ATR, volume)
│   │   ├── ai_engine.py       # Gemini AI + deterministic fallback prediction engine
│   │   ├── sentiment.py       # NewsData.io news + Fear & Greed Index + keyword sentiment analysis
│   │   └── prediction_tracker.py  # SQLite prediction recording + periodic verification
│   └── utils/
│       └── caching.py         # Thread-safe in-memory TTL cache
│
├── frontend/                  # Next.js 16 + TypeScript
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout (Inter + Inconsolata fonts)
│       │   ├── page.tsx        # Landing page → /dashboard
│       │   └── dashboard/
│       │       └── page.tsx   # Main dashboard (polling, layout orchestration)
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── PriceTicker.tsx      # Live price + 24h stats + indicator summary
│       │   │   ├── TradingChart.tsx     # lightweight-charts area chart
│       │   │   ├── PredictionCard.tsx   # 5m/15m/60m AI probability forecast cards
│       │   │   ├── SentimentPanel.tsx   # Fear & Greed gauge + sentiment components
│       │   │   ├── NewsPanel.tsx        # Crypto news with sentiment badges
│       │   │   ├── AIFeed.tsx           # Scrollable AI intelligence feed
│       │   │   ├── AccuracyTracker.tsx  # Prediction win rate + per-timeframe bars
│       │   │   ├── DashboardShell.tsx   # Layout shell (header, connection status)
│       │   │   ├── WarmupBanner.tsx     # 0/3 → 3/3 warmup progress indicator
│       │   │   ├── ConnectionStatus.tsx  # LIVE / RECONNECTING / DISCONNECTED
│       │   │   ├── IndicatorBar.tsx     # Compact indicator summary strip
│       │   │   └── TimeframeSelector.tsx # 5M / 15M / 60M pill selector
│       │   └── ui/             # Shared UI primitives (Button, Card)
│       ├── hooks/
│       │   ├── useWebSocket.ts  # WebSocket client with exponential backoff reconnect
│       │   └── usePolling.ts    # Generic async polling hook
│       ├── lib/
│       │   ├── api.ts           # Typed REST API client
│       │   ├── constants.ts      # App config, URLs, colors, intervals
│       │   └── utils.ts         # cn() utility (clsx + tailwind-merge)
│       └── store/
│           └── marketStore.ts   # Zustand global state (all market data)
```

---

## Data Flow

```
Binance WebSocket ─────┐
   (trade + kline)     │
                       ▼
                ┌──────────────┐
                │  BinanceWS   │─── REST seed (200 candles + 24h ticker)
                └──────┬───────┘
                       │ latest_data, candles, ticker_24h
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────────────┐
   │ Indicators  │ │  Sentiment│ │ PredictionTracker│
   │  (pandas-ta)│ │ Fetcher  │ │  (verify + record)│
   └──────┬──────┘ └────┬─────┘ └────────┬─────────┘
          │              │                │
          └──────┬───────┘                │
                 ▼                        │
          ┌─────────────┐                 │
          │  AI Engine  │◄────────────────┘
          │  (Gemini +  │
          │  fallback)  │
          └──────┬──────┘
                 │
                 ▼
        ┌────────────────┐        ┌──────────────┐
        │  FastAPI REST  │◄──────►│   SQLite DB   │
        │  + WebSocket   │        │  (predictions)│
        └───────┬────────┘        └──────────────┘
                │
                ▼
        ┌────────────────┐
        │  Next.js 16    │
        │  Frontend      │
        │  (Zustand +    │
        │   lightweight-  │
        │   charts)      │
        └────────────────┘
```

**Real-time path**: Binance WebSocket → `latest_data` dict → FastAPI WebSocket endpoint → browser WebSocket → Zustand store → React components (price ticker, chart).

**Polling path**: Frontend polls `/api/predictions/*`, `/api/sentiment/*`, `/api/market/*` at staggered intervals (20s predictions, 60s sentiment, 45s accuracy).

**AI prediction path**: Indicator data + sentiment → Gemini 2.5 Flash prompt → structured JSON response → cached with MD5-based TTL cache → fallback to deterministic rule-based prediction if Gemini unavailable.

---

## API Reference

### Market

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/market/current` | Current price, volume, indicators, 24h ticker |
| `GET` | `/api/market/candles?timeframe=1m&limit=100` | OHLCV candle history |
| `GET` | `/api/market/indicators` | Latest computed indicators |

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/predictions/latest?timeframe=15m` | AI prediction for timeframe (5m/15m/60m) |
| `GET` | `/api/predictions/history?limit=50` | Past predictions with resolution status |
| `GET` | `/api/predictions/accuracy` | Win rate stats (overall + per-timeframe) |
| `POST` | `/api/predictions/verify` | Manually verify a prediction outcome |

### Sentiment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sentiment/current` | Composite sentiment score, label, Fear & Greed, components |
| `GET` | `/api/sentiment/news?limit=10` | Crypto news articles with sentiment classification |
| `GET` | `/api/sentiment/fear-greed` | Fear & Greed Index value and classification |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/market` | Real-time price, volume, indicators, 24h ticker updates every 500ms |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service status, WebSocket connection, latest price |

---

## Design System

**Theme**: ClickHouse Terminal Console with Chartreuse Zap accent. Dark-mode Bloomberg-Terminal-meets-Polymarket aesthetic.

| Token | Value | Usage |
|-------|-------|-------|
| `midnight-oil` | `#151515` | Page background |
| `smokey-carbon` | `#1f1f1c` | Card backgrounds |
| `deep-graphite` | `#282828` | Nested card backgrounds |
| `iron-oxide` | `#343434` | Progress bar tracks |
| `cool-stone` | `#3a3a3a` | Borders |
| `shadow-white` | `#a0a0a0` | Secondary text |
| `silken-whisper` | `#bcbcbb` | Body text |
| `cloud-white` | `#ffffff` | Headings, primary text |
| `chartreuse-zap` | `#faff69` | Primary accent, bullish indicators |
| `emerald-glint` | `#fbff46` | Secondary accent, medium confidence |
| `alert-red` | `#ff7575` | Bearish, errors, negative values |

**Typography**: Inter (body), Inconsolata (monospace, numbers, stats).

**Animations**: Framer Motion for page transitions, card entries, number animations; CSS `animate-pulse-glow` for live status dot; CSS `animate-shimmer` for loading skeletons.

---

## Prediction Engine

### Gemini AI (primary)

Sends a structured prompt containing all computed indicators (RSI, MACD, EMA 9/21/50, Bollinger Bands, ATR, volume ratio, price changes), Fear & Greed Index, and news sentiment. Requests a JSON response with `bullish_pct`, `bearish_pct`, `confidence`, `reasoning`, and `key_drivers`.

Responses are cached using an MD5 hash of the indicator + sentiment snapshot, so identical market conditions don't burn API credits.

### Deterministic Fallback

When Gemini is unavailable or fails:

| Signal | Bullish Condition | Bearish Condition |
|--------|------------------|-------------------|
| MACD | Bullish crossover | Bearish crossover |
| EMA Cross | EMA 9 > EMA 21 | EMA 9 < EMA 21 |
| EMA 50 | Price above EMA 50 | Price below EMA 50 |
| RSI | RSI < 30 (oversold) | RSI > 70 (overbought) |
| Bollinger | Below lower band | Above upper band |
| Momentum | +0.3% in 5m | −0.3% in 5m |

Each matching signal shifts the probability by `35 / total_signals` percentage points from the 50/50 baseline, clamped to 10–90%. Confidence scales with the margin: >30% = High, >15% = Medium, else Low.

---

## Sentiment Analysis

### Composite Score

```
score = fear_greed_normalized * 0.6 + base_0.5
score = score * 0.7 + news_normalized * 0.3
```

Where `fear_greed_normalized = fear_greed_value / 100` and `news_normalized = 0.5 + (bullish_count - bearish_count) / total * 0.5`.

Labels: `< 0.4` = bearish, `> 0.6` = bullish, else neutral.

### News Sentiment

Each article is classified by keyword matching against bullish/bearish word sets:

- **Bullish**: surge, rally, bullish, breakout, moon, ath, adoption, etf inflow, institutional, upgrade, buy, long, green, pump, uptrend, support, rebound, recovery, halving, accumulation, whale buying, positive, growth
- **Bearish**: crash, dump, bearish, breakdown, sell-off, selloff, panic, ban, hack, exploit, scam, fraud, downgrade, sell, short, red, downtrend, resistance, liquidation, fud, fear, negative, decline, drop, plunge, loss, risk

---

## Environment Setup

### Prerequisites

- Python 3.12+
- Node.js 20+ / npm 10+
- API keys: Gemini (required), NewsData.io (optional)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys:
#   GEMINI_API_KEY=your_key_here
#   NEWSDATA_API_KEY=your_key_here  (optional, free tier at newsdata.io)

pip install -r requirements.txt
python main.py
```

The server starts on `http://0.0.0.0:8000`. On startup it:

1. Seeds 200 historical 1m candles from Binance REST API
2. Computes initial indicator values (RSI, MACD, EMA, BB, ATR)
3. Connects to Binance WebSocket for real-time trade + kline streams
4. Fetches 24h ticker stats (volume, high/low, change %)
5. Starts periodic sentiment + news updates (every 120s)
6. Starts prediction tracker verification loop (every 60s)
7. Auto-kills any process already using port 8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:3000`. The dashboard is at `/dashboard`.

> **Note**: `next build` has a known prerender issue with `/_global-error` in Next.js 16.2.6. Use `npm run dev` for the hackathon demo.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | `""` | Google Gemini API key for AI predictions |
| `NEWSDATA_API_KEY` | `""` | NewsData.io API key for crypto news |
| `BINANCE_WS_TRADE_URL` | `wss://stream.binance.com:9443/ws/btcusdt@trade` | Binance trade stream |
| `BINANCE_WS_KLINE_URL` | `wss://stream.binance.com:9443/ws/btcusdt@kline_1m` | Binance kline stream |
| `CACHE_TTL_AI` | `30` | AI prediction cache TTL (seconds) |
| `CACHE_TTL_SENTIMENT` | `120` | Sentiment cache TTL (seconds) |
| `CACHE_TTL_NEWS` | `300` | News cache TTL (seconds) |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `false` | Enable uvicorn reload |

Frontend env vars (in `.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend REST API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws` | Backend WebSocket URL |

---

## Frontend State Management

All state lives in a single Zustand store (`marketStore.ts`):

| Key | Type | Source |
|-----|------|--------|
| `price`, `prevPrice`, `volume`, `timestamp` | `number \| null` | WebSocket (real-time) |
| `ticker24h` | `Ticker24h \| null` | WebSocket (real-time) |
| `candles` | `Candle[]` | REST `/api/market/candles` (on mount) + WebSocket updates |
| `indicators` | `IndicatorData \| null` | WebSocket (real-time, computed every 5s on backend) |
| `predictions` | `Record<string, PredictionResult \| null>` | REST poll (20s, per timeframe) |
| `sentiment`, `fearGreed`, `news` | Various | REST poll (60s) |
| `accuracy`, `history` | Various | REST poll (45s) |
| `aiFeed` | `AIFeedItem[]` | Client-generated from prediction updates |
| `wsConnected`, `wsReconnecting` | `boolean` | WebSocket state |

An 8-second warmup delay prevents premature API calls before backend indicators compute.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Split architecture (Python backend + Next.js frontend) | Python for pandas-ta/Gemini/AI; JS for reactive UI |
| Zustand single store | Lightweight, no boilerplate, single source of truth |
| lightweight-charts v5 AreaSeries | Simpler and more visually striking than candlestick for BTC price |
| `services/container.py` module pattern | Avoids circular imports between `main.py` and routers |
| Historical kline seeding on startup | Indicators compute immediately (no 14-minute warmup) |
| `import services.container as svc` in routers | Python `from X import Y` captures value at import time — module access sees live updates |
| MD5 snapshot hashing for AI cache | Same market conditions → cached response → fewer Gemini API calls |
| Thread-safe TTL cache (`utils/caching.py`) | Simple, no Redis dependency, works for single-process deployment |
| Deterministic fallback for AI | Platform degrades gracefully when Gemini is unavailable |
| NewsData.io over CryptoPanic | Better free tier, keyword-based bullish/bearish classification on titles |
| Next.js dev mode only | Next 16.2.6 has a `/_global-error` prerender build bug; dev mode works perfectly |
| Auto-kill on port conflict | Windows `netstat` + `taskkill` in `main.py` — no manual port cleanup needed |

---

## Project Structure Notes

### Service Container Pattern

All routers import `services.container as svc` rather than individual service instances. The lifespan handler in `main.py` creates services and assigns them to the module:

```python
# main.py
svc.binance_ws = BinanceWebSocket()
svc.ai_engine = AIEngine()
# ...

# routers/market.py
import services.container as svc

async def get_current_market():
    if not svc.binance_ws:
        raise HTTPException(503, ...)
```

This avoids the Python gotcha where `from X import Y` captures `None` at import time and never sees the later assignment.

### Prediction Verification

Predictions are stored in SQLite with `entry_price`, `predicted_direction`, and `timeframe`. The `PredictionTracker` runs a background loop every 60s checking if a prediction's timeframe has elapsed. When it has, it compares the current BTC price against the entry price to determine `was_correct`.

### Chart Data Deduplication

The Binance kline WebSocket can send duplicate timestamps (e.g., when a candle closes and reopens at the same second). `TradingChart.tsx` filters duplicates before passing data to lightweight-charts, which requires strictly ascending timestamps.

---

## Dependencies

### Backend (Python)

| Package | Purpose |
|---------|---------|
| `fastapi` | REST API framework |
| `uvicorn[standard]` | ASGI server with WebSocket support |
| `websockets` | Binance WebSocket client |
| `httpx` | Async HTTP client (Binance REST, NewsData, Alternative.me) |
| `pandas`, `pandas-ta`, `numpy` | Technical indicator computation |
| `google-genai` | Gemini 2.5 Flash AI predictions |
| `python-dotenv` | Environment variable loading |
| `cachetools` | TTL cache (used by sentiment/AI) |
| `requests`, `urllib3` | Secondary HTTP (dependency of pandas-ta) |

### Frontend (Node.js)

| Package | Purpose |
|---------|---------|
| `next` 16.2.6 | React framework |
| `react` 19.2 | UI runtime |
| `zustand` 5 | Global state management |
| `lightweight-charts` 5 | TradingView chart library |
| `framer-motion` 12 | Animation library |
| `lucide-react` | Icon set |
| `tailwindcss` 4 | Utility-first CSS (CSS-based config) |
| `clsx` + `tailwind-merge` | Class composition utilities |
| `@radix-ui/react-slot` | Accessible component primitives |
| `class-variance-authority` | Variant-style component utilities |

---

## License

MIT