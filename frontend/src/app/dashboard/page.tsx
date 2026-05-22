"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { WarmupBanner } from "@/components/dashboard/WarmupBanner"

const TIMEFRAMES = ["5m", "15m", "60m"] as const

export default function DashboardPage() {
  const [selectedTf, setSelectedTf] = useState("15m")
  const [warmedUp, setWarmedUp] = useState(false)

  const price = useMarketStore((s) => s.price)
  const wsConnected = useMarketStore((s) => s.wsConnected)

  useWebSocket()

  useEffect(() => {
    fetchCandles("1m", 100).then((candles) => {
      if (candles && candles.length > 0) {
        useMarketStore.getState().setCandles(candles)
      }
    }).catch(console.error)

    const timer = setTimeout(() => setWarmedUp(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  const pollPredictions = useCallback(async () => {
    for (const tf of TIMEFRAMES) {
      const result = await fetchLatestPrediction(tf)
      if (result) {
        useMarketStore.getState().setPrediction(tf, result)
        useMarketStore.getState().addAIFeedItem({
          id: `${Date.now()}-${tf}`,
          timestamp: new Date().toISOString(),
          message: `${tf}: ${result.predicted_direction} bias ${result.bullish_pct}% (${result.confidence}). ${result.reasoning}`,
          type: "prediction",
        })
      }
    }
  }, [])

  usePolling(pollPredictions, 20000, warmedUp)

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

  usePolling(pollSentiment, 60000, warmedUp)

  const pollAccuracy = useCallback(async () => {
    const [acc, hist] = await Promise.all([
      fetchAccuracy(),
      fetchPredictionHistory(20),
    ])
    if (acc) useMarketStore.getState().setAccuracy(acc)
    if (hist) useMarketStore.getState().setHistory(hist)
  }, [])

  usePolling(pollAccuracy, 45000, warmedUp)

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
        <TradingChart />
      </DashboardTwoCol>

      <DashboardFullWidth className="mb-4">
        <WarmupBanner />
      </DashboardFullWidth>

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
