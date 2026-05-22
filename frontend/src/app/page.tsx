"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Brain, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="relative flex w-full max-w-4xl flex-col items-center gap-8 text-center">
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
            <h1 className="relative text-7xl font-black leading-none tracking-tight text-cloud-white">
              SatoshiSignal
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xl text-lg leading-relaxed text-shadow-white"
          >
            AI-powered Bitcoin prediction market intelligence. Real-time signals,
            probability forecasts, and institutional-grade market analysis for
            prediction markets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <Link href="/dashboard">
              <Button variant="hero" className="gap-2">
                <Zap className="size-4" />
                Launch Terminal
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Button variant="secondary">View Docs</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-16 grid w-full gap-6 sm:grid-cols-3"
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

      <footer className="border-t border-iron-oxide py-8 text-center">
        <p className="text-xs text-shadow-white">
          SatoshiSignal &mdash; Not financial advice. AI-assisted market intelligence only.
        </p>
      </footer>
    </div>
  )
}
