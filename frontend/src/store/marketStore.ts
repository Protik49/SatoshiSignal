import { create } from "zustand"

export interface Candle {
  open_time: number
  close_time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  is_closed: boolean
}

export interface IndicatorData {
  rsi: number | null
  macd: number | null
  macd_signal: number | null
  macd_histogram: number | null
  ema_9: number | null
  ema_21: number | null
  ema_50: number | null
  bb_upper: number | null
  bb_middle: number | null
  bb_lower: number | null
  atr: number | null
  volume_ratio: number | null
  price_change_1m: number | null
  price_change_5m: number | null
  price_change_15m: number | null
  price: number | null
  conditions: Record<string, string>
}

export interface PredictionResult {
  bullish_pct: number
  bearish_pct: number
  confidence: string
  reasoning: string
  key_drivers: string[]
  predicted_direction: string
  timestamp: string
  timeframe: string
  price: number | null
}

export interface SentimentData {
  score: number
  label: string
  fear_greed: FearGreedData | null
  components: string[]
  updated_at: string
}

export interface FearGreedData {
  value: number
  classification: string
  timestamp: string
  updated_at: string
}

export interface NewsItem {
  title: string
  url: string
  published_at: string
  source: string
  source_url: string
  source_icon: string
  description: string
  image_url: string
  keywords: string[]
  category: string[]
  sentiment: "bullish" | "bearish" | "neutral"
}

export interface AccuracyData {
  win_rate: number
  total_predictions: number
  wins: number
  by_timeframe: Array<{
    timeframe: string
    total: number
    wins: number
    win_rate: number
  }>
}

export interface PredictionRecord {
  id: number
  timestamp: string
  timeframe: string
  bullish_pct: number
  bearish_pct: number
  confidence: string
  predicted_direction: string
  reasoning: string
  key_drivers: string[]
  entry_price: number
  actual_outcome: string | null
  was_correct: boolean | null
  resolved_at: string | null
}

export interface AIFeedItem {
  id: string
  timestamp: string
  message: string
  type: "prediction" | "indicator" | "sentiment" | "market"
}

interface MarketState {
  price: number | null
  prevPrice: number | null
  volume: number | null
  timestamp: number | null

  candles: Candle[]

  indicators: IndicatorData | null

  predictions: Record<string, PredictionResult | null>

  sentiment: SentimentData | null
  fearGreed: FearGreedData | null
  news: NewsItem[]

  accuracy: AccuracyData | null
  history: PredictionRecord[]

  aiFeed: AIFeedItem[]

  wsConnected: boolean
  wsReconnecting: boolean
  error: string | null

  setPrice: (price: number) => void
  setCandles: (candles: Candle[]) => void
  setIndicators: (indicators: IndicatorData) => void
  setPrediction: (timeframe: string, prediction: PredictionResult) => void
  setSentiment: (sentiment: SentimentData) => void
  setFearGreed: (fg: FearGreedData) => void
  setNews: (news: NewsItem[]) => void
  setAccuracy: (accuracy: AccuracyData) => void
  setHistory: (history: PredictionRecord[]) => void
  addAIFeedItem: (item: AIFeedItem) => void
  setWsConnected: (connected: boolean) => void
  setWsReconnecting: (reconnecting: boolean) => void
  setError: (error: string | null) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  price: null,
  prevPrice: null,
  volume: null,
  timestamp: null,

  candles: [],

  indicators: null,

  predictions: {},

  sentiment: null,
  fearGreed: null,
  news: [],

  accuracy: null,
  history: [],

  aiFeed: [],

  wsConnected: false,
  wsReconnecting: false,
  error: null,

  setPrice: (price: number) =>
    set((state) => ({
      prevPrice: state.price,
      price,
    })),

  setCandles: (candles: Candle[]) => set({ candles }),

  setIndicators: (indicators: IndicatorData) => set({ indicators }),

  setPrediction: (timeframe: string, prediction: PredictionResult) =>
    set((state) => ({
      predictions: { ...state.predictions, [timeframe]: prediction },
    })),

  setSentiment: (sentiment: SentimentData) => set({ sentiment }),

  setFearGreed: (fg: FearGreedData) => set({ fearGreed: fg }),

  setNews: (news: NewsItem[]) => set({ news }),

  setAccuracy: (accuracy: AccuracyData) => set({ accuracy }),

  setHistory: (history: PredictionRecord[]) => set({ history }),

  addAIFeedItem: (item: AIFeedItem) =>
    set((state) => ({
      aiFeed: [item, ...state.aiFeed].slice(0, 100),
    })),

  setWsConnected: (connected: boolean) =>
    set({ wsConnected: connected, wsReconnecting: false, error: null }),

  setWsReconnecting: (reconnecting: boolean) =>
    set({ wsReconnecting: reconnecting }),

  setError: (error: string | null) => set({ error }),
}))
