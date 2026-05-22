"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Brain, TrendingUp, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Brain,
    title: "AI Probability Engine",
    description:
      "Ultra-short-term directional forecasts (5m, 15m, 60m) with probabilistic reasoning and confidence scoring.",
  },
  {
    icon: TrendingUp,
    title: "Live Market Intelligence",
    description:
      "Real-time BTC price streaming, technical indicators, and candlestick charting via Binance WebSocket.",
  },
  {
    icon: BarChart3,
    title: "Sentiment & Accuracy",
    description:
      "Fear & Greed Index, news aggregation, and prediction accuracy tracking with rolling win rate calibration.",
  },
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

function LivePrice() {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/market/current`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.price) setPrice(data.price)
        if (data?.ticker_24h?.price_change_pct !== undefined) {
          setChange(data.ticker_24h.price_change_pct)
        }
      })
      .catch(() => {})

    let ws: WebSocket | null = null

    const connect = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"
      ws = new WebSocket(`${wsUrl}/market`)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.price !== undefined) {
            setPrice(data.price)
            if (data.ticker_24h?.price_change_pct !== undefined) {
              setChange(data.ticker_24h.price_change_pct)
            }
          }
        } catch {
          // skip
        }
      }

      ws.onerror = () => ws?.close()
      ws.onclose = () => {
        setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [])

  if (price === null) {
    return (
      <div className="flex items-center gap-4 mt-2">
        <div className="h-14 w-44 rounded-lg animate-shimmer" />
      </div>
    )
  }

  const isUp = (change ?? 0) >= 0

  return (
    <div className="flex items-baseline gap-4 mt-2">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-cloud-white"
      >
        {formatPrice(price)}
      </motion.span>
      {change !== null && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center gap-1 text-xl font-semibold font-mono",
            isUp ? "text-chartreuse-zap" : "text-alert-red"
          )}
        >
          {isUp ? <TrendingUp className="size-5" /> : <TrendingUp className="size-5 rotate-180" />}
          {isUp ? "+" : ""}{change.toFixed(2)}%
        </motion.span>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-24">
        <div className="relative flex w-full max-w-4xl flex-col items-center gap-6 sm:gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl opacity-20 bg-chartreuse-zap rounded-full" />
            <div className="relative flex items-center gap-3 mb-2 justify-center">
              <Zap className="size-6 text-chartreuse-zap" />
              <span className="text-sm font-mono text-silken-whisper tracking-widest uppercase">
                AI Market Intelligence Terminal
              </span>
            </div>
            <h1 className="relative text-5xl sm:text-7xl font-black leading-none tracking-tight text-cloud-white">
              SatoshiSignal
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-shadow-white"
          >
            AI-powered Bitcoin prediction market intelligence. Real-time signals,
            probability forecasts, and institutional-grade market analysis for
            prediction markets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full max-w-md"
          >
            <div className="bg-smokey-carbon/80 border border-cool-stone/60 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-3.5 text-chartreuse-zap" />
                <span className="text-[11px] font-mono text-silken-whisper uppercase tracking-wider">
                  BTC / USDT — Live
                </span>
              </div>
              <LivePrice />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Link href="/dashboard">
              <Button variant="hero" className="gap-2">
                <Zap className="size-4" />
                Launch Terminal
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 sm:mt-16 grid w-full gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3"
          >
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <Icon className="mb-2 size-5 text-chartreuse-zap" />
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-iron-oxide py-6 sm:py-8 text-center px-4">
        <p className="text-xs text-shadow-white">
          SatoshiSignal &mdash; Not financial advice. AI-assisted market intelligence only.
        </p>
      </footer>
    </div>
  )
}