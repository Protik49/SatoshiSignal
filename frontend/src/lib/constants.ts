export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const

export type Timeframe = (typeof TIMEFRAMES)[number]

export const BASE_CURRENCY = "BTC"

export const POLLING_INTERVALS = {
  price: 5000,
  sentiment: 30000,
  news: 60000,
} as const

export const CHART_COLORS = {
  up: "#faff69",
  down: "#ff7575",
  volume: "#a0a0a0",
  grid: "#282828",
  text: "#bcbcbb",
} as const

export const APP_NAME = "SatoshiSignal"

export const APP_DESCRIPTION =
  "AI-powered Bitcoin prediction market intelligence platform"

export const DEFAULT_PAGE_SIZE = 20
