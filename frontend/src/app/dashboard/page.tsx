"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"
import { useMarketStore } from "@/store/marketStore"
import { useWebSocket } from "@/hooks/useWebSocket"
import { usePolling } from "@/hooks/usePolling"
import {
  fetchLatestPrediction,
  fetchPredictionHistory,
  fetchAccuracy,
  fetchSentiment,
  fetchFearGreed,
  fetchNews,
  fetchCandles,
} from "@/lib/api"
import {
  DashboardShell,
  DashboardTwoCol,
  DashboardRow,
  DashboardFullWidth,
} from "@/components/dashboard/DashboardShell"
import { PriceTicker } from "@/components/dashboard/PriceTicker"
import { TradingChart } from "@/components/dashboard/TradingChart"
import { TimeframeSelector } from "@/components/dashboard/TimeframeSelector"
import { PredictionCard } from "@/components/dashboard/PredictionCard"
import { AIFeed } from "@/components/dashboard/AIFeed"
import { SentimentPanel } from "@/components/dashboard/SentimentPanel"
import { AccuracyTracker } from "@/components/dashboard/AccuracyTracker"
import { IndicatorBar } from "@/components/dashboard/IndicatorBar"

const TIMEFRAMES = ["5m", "15m", "60m"] as const

export default function DashboardPage() {
  const [selectedTf, setSelectedTf] = useState("15m")

  const price = useMarketStore((s) => s.price)
  const wsConnected = useMarketStore((s) => s.wsConnected)
  const indicators = useMarketStore((s) => s.indicators)

  useWebSocket()

  const pollPredictions = useCallback(async () => {
    for (const tf of TIMEFRAMES) {
      const result = await fetchLatestPrediction(tf)
      if (result) {
        useMarketStore.getState().setPrediction(tf, result)
        useMarketStore.getState().addAIFeedItem({
          id: `${Date.now()}-${tf}`,
          timestamp: new Date().toISOString(),
          message: `${tf}: ${result.predicted_direction} bias ${result.bullish_pct}% — ${result.reasoning}`,
          type: "prediction",
        })
      }
    }
  }, [])

  usePolling(pollPredictions, 15000, true)

  const pollSentiment = useCallback(async () => {
    const [sentiment, fg, news] = await Promise.all([
      fetchSentiment(),
      fetchFearGreed(),
      fetchNews(5),
    ])
    if (sentiment) useMarketStore.getState().setSentiment(sentiment)
    if (fg) useMarketStore.getState().setFearGreed(fg)
    if (news) useMarketStore.getState().setNews(news)
  }, [])

  usePolling(pollSentiment, 60000, true)

  const pollAccuracy = useCallback(async () => {
    const [acc, hist] = await Promise.all([
      fetchAccuracy(),
      fetchPredictionHistory(20),
    ])
    if (acc) useMarketStore.getState().setAccuracy(acc)
    if (hist) useMarketStore.getState().setHistory(hist)
  }, [])

  usePolling(pollAccuracy, 30000, true)

  useEffect(() => {
    fetchCandles("1m", 100).then((candles) => {
      if (candles) useMarketStore.getState().setCandles(candles)
    }).catch(() => {})
  }, [])

  if (price === null && !wsConnected) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-shadow-white text-lg"
          >
            Connecting to market data...
          </motion.div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardTwoCol className="mb-4">
        <PriceTicker />
        <div className="flex flex-col gap-3">
          <TradingChart />
          <IndicatorBar />
        </div>
      </DashboardTwoCol>

      <DashboardFullWidth className="mb-4 flex items-center justify-between">
        <h2 className="text-heading-sm font-semibold text-cloud-white flex items-center gap-2">
          <Brain className="size-5 text-chartreuse-zap" />
          AI Probability Forecasts
        </h2>
        <TimeframeSelector defaultValue={selectedTf} onChange={setSelectedTf} />
      </DashboardFullWidth>

      <DashboardRow className="mb-4">
        <PredictionCard timeframe="5m" />
        <PredictionCard timeframe="15m" />
        <PredictionCard timeframe="60m" />
      </DashboardRow>

      <DashboardRow>
        <SentimentPanel />
        <AIFeed />
        <AccuracyTracker />
      </DashboardRow>
    </DashboardShell>
  )
}
