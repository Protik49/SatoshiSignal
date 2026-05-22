"use client"

import { motion } from "framer-motion"
import { Thermometer, TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react"
import { useMarketStore } from "@/store/marketStore"
import { cn } from "@/lib/utils"

interface GaugeSegment {
  label: string
  range: [number, number]
  color: string
  textColor: string
}

const GAUGE_SEGMENTS: GaugeSegment[] = [
  { label: "Extreme Fear", range: [0, 25], color: "bg-alert-red", textColor: "text-alert-red" },
  { label: "Fear", range: [25, 45], color: "bg-orange-400", textColor: "text-orange-400" },
  { label: "Neutral", range: [45, 55], color: "bg-shadow-white", textColor: "text-shadow-white" },
  { label: "Greed", range: [55, 75], color: "bg-emerald-glint", textColor: "text-emerald-glint" },
  { label: "Extreme Greed", range: [75, 100], color: "bg-chartreuse-zap", textColor: "text-chartreuse-zap" },
]

function getGaugeSegment(value: number): GaugeSegment {
  for (const seg of GAUGE_SEGMENTS) {
    if (value >= seg.range[0] && value <= seg.range[1]) return seg
  }
  return GAUGE_SEGMENTS[2]
}

function SentimentIcon({ label }: { label: string }) {
  if (label === "bullish") return <TrendingUp className="size-4 text-chartreuse-zap" />
  if (label === "bearish") return <TrendingDown className="size-4 text-alert-red" />
  return <Minus className="size-4 text-shadow-white" />
}

function Skeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-4 w-1/2 rounded animate-shimmer" />
      <div className="h-10 w-full rounded animate-shimmer" />
      <div className="h-4 w-full rounded animate-shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="h-3 w-5/6 rounded animate-shimmer" />
        <div className="h-3 w-4/6 rounded animate-shimmer" />
      </div>
    </div>
  )
}

export function SentimentPanel() {
  const sentiment = useMarketStore((s) => s.sentiment)
  const fearGreed = useMarketStore((s) => s.fearGreed)
  const news = useMarketStore((s) => s.news)

  const isLoading = !sentiment

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Thermometer className="size-4 text-chartreuse-zap" />
        <h3 className="font-semibold text-sm text-cloud-white uppercase tracking-wider">
          Market Sentiment
        </h3>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-shadow-white/60 uppercase tracking-wider">
                Fear & Greed Index
              </span>
              {fearGreed && (
                <span className="text-[10px] text-shadow-white/40 font-mono">
                  {new Date(fearGreed.updated_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="relative h-3 rounded-full bg-deep-graphite overflow-hidden">
              {GAUGE_SEGMENTS.map((seg) => (
                <div
                  key={seg.label}
                  className={cn("absolute h-full", seg.color)}
                  style={{
                    left: `${seg.range[0]}%`,
                    width: `${seg.range[1] - seg.range[0]}%`,
                  }}
                />
              ))}
              {fearGreed && (
                <motion.div
                  className="absolute top-0 w-1 h-full bg-cloud-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)] z-10"
                  initial={{ left: "50%" }}
                  animate={{ left: `${Math.min(Math.max(fearGreed.value, 0), 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                />
              )}
            </div>

            {fearGreed && (
              <div className="flex items-baseline gap-3">
                <motion.span
                  key={fearGreed.value}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-3xl font-bold font-mono",
                    getGaugeSegment(fearGreed.value).textColor
                  )}
                >
                  {fearGreed.value}
                </motion.span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    getGaugeSegment(fearGreed.value).textColor
                  )}
                >
                  {fearGreed.classification}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-cool-stone/50">
            <SentimentIcon label={sentiment.label} />
            <span className="text-sm font-semibold text-cloud-white capitalize">
              {sentiment.label}
            </span>
            <span className="text-xs text-shadow-white font-mono ml-auto">
              Score: {sentiment.score.toFixed(1)}
            </span>
          </div>

          {sentiment.components.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-shadow-white/60 font-semibold flex items-center gap-1">
                <MessageSquare className="size-3" />
                Components
              </span>
              <ul className="space-y-1">
                {sentiment.components.slice(0, 5).map((component, i) => (
                  <motion.li
                    key={`comp-${i}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-1.5 text-xs text-silken-whisper"
                  >
                    <span className="mt-1 size-1 rounded-full bg-chartreuse-zap/60 shrink-0" />
                    {component}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {news.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-cool-stone/50">
              <span className="text-[11px] uppercase tracking-wider text-shadow-white/60 font-semibold">
                Latest Headlines
              </span>
              <ul className="space-y-2">
                {news.slice(0, 5).map((item, i) => {
                  const sentimentColor =
                    item.sentiment === "bullish"
                      ? "bg-chartreuse-zap/20 text-chartreuse-zap"
                      : item.sentiment === "bearish"
                        ? "bg-alert-red/20 text-alert-red"
                        : "bg-shadow-white/10 text-shadow-white"
                  return (
                    <li
                      key={`${item.url}-${i}`}
                      className="flex items-start gap-2"
                    >
                      <span
                        className={`mt-0.5 shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${sentimentColor}`}
                      >
                        {item.sentiment === "bullish" ? "▲" : item.sentiment === "bearish" ? "▼" : "—"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-silken-whisper truncate hover:text-cloud-white transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-shadow-white/40 font-mono mt-0.5">
                          {item.source}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
