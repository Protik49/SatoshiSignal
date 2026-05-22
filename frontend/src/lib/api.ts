import { API_BASE_URL } from "./constants"
import type {
  PredictionResult,
  PredictionRecord,
  AccuracyData,
  SentimentData,
  FearGreedData,
  NewsItem,
  Candle,
  IndicatorData,
} from "@/store/marketStore"

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (res.status === 503) return null
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)

  return res.json() as Promise<T>
}

interface LivePredictionResponse {
  prediction: PredictionResult
  market_snapshot: Record<string, unknown>
  sentiment: Record<string, unknown>
}

interface PredictionHistoryResponse {
  count: number
  predictions: PredictionRecord[]
}

interface NewsResponse {
  count: number
  news: NewsItem[]
  updated_at: string
}

interface CandlesResponse {
  timeframe: string
  count: number
  candles: Candle[]
  updated_at: string
}

export async function fetchLatestPrediction(
  timeframe: string
): Promise<PredictionResult | null> {
  const response = await request<LivePredictionResponse>(
    `/api/predictions/latest?timeframe=${encodeURIComponent(timeframe)}`
  )
  return response?.prediction ?? null
}

export async function fetchPredictionHistory(
  limit?: number
): Promise<PredictionRecord[] | null> {
  const params = limit ? `?limit=${limit}` : ""
  const response = await request<PredictionHistoryResponse>(
    `/api/predictions/history${params}`
  )
  return response?.predictions ?? null
}

export async function fetchAccuracy(): Promise<AccuracyData | null> {
  return request<AccuracyData>("/api/predictions/accuracy")
}

export async function fetchSentiment(): Promise<SentimentData | null> {
  return request<SentimentData>("/api/sentiment/current")
}

export async function fetchNews(limit?: number): Promise<NewsItem[] | null> {
  const params = limit ? `?limit=${limit}` : ""
  const response = await request<NewsResponse>(
    `/api/sentiment/news${params}`
  )
  return response?.news ?? null
}

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  return request<FearGreedData>("/api/sentiment/fear-greed")
}

export async function fetchCandles(
  timeframe?: string,
  limit?: number
): Promise<Candle[] | null> {
  const params = new URLSearchParams()
  if (timeframe) params.set("timeframe", timeframe)
  if (limit) params.set("limit", String(limit))
  const qs = params.toString()
  const response = await request<CandlesResponse>(
    `/api/market/candles${qs ? `?${qs}` : ""}`
  )
  return response?.candles ?? null
}

export async function fetchMarketCurrent(): Promise<{
  price: number
  volume: number
  timestamp: number
  indicators: IndicatorData
} | null> {
  return request<{
    price: number
    volume: number
    timestamp: number
    indicators: IndicatorData
  }>("/api/market/current")
}
