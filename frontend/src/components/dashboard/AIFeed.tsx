"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Newspaper,
  Zap,
} from "lucide-react"
import { useMarketStore, AIFeedItem } from "@/store/marketStore"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<AIFeedItem["type"], React.ReactNode> = {
  prediction: <Zap className="size-3 text-chartreuse-zap" />,
  indicator: <Activity className="size-3 text-blue-400" />,
  sentiment: <TrendingUp className="size-3 text-emerald-glint" />,
  market: <Newspaper className="size-3 text-shadow-white" />,
}

const TYPE_DOTS: Record<AIFeedItem["type"], string> = {
  prediction: "bg-chartreuse-zap",
  indicator: "bg-blue-400",
  sentiment: "bg-emerald-glint",
  market: "bg-shadow-white",
}

export function AIFeed() {
  const feed = useMarketStore((s) => s.aiFeed)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [feed])

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-chartreuse-zap" />
        <h3 className="font-semibold text-sm text-cloud-white uppercase tracking-wider">
          AI Market Intelligence
        </h3>
        <span className="text-[10px] text-shadow-white/60 font-mono ml-auto">
          {feed.length} entries
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-[360px] space-y-1 pr-1"
      >
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-shadow-white/40 py-12">
            <Brain className="size-8" />
            <span className="text-xs font-mono">Awaiting intelligence...</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {feed.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2.5 py-2 border-b border-cool-stone/40 last:border-0"
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={cn(
                      "size-2 rounded-full",
                      TYPE_DOTS[item.type]
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-silken-whisper leading-relaxed break-words">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-shadow-white/40 font-mono mt-0.5 block">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="shrink-0 mt-0.5">
                  {TYPE_ICONS[item.type]}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export function generateFeedItem(
  prediction: {
    bullish_pct: number
    predicted_direction: string
    confidence: string
    reasoning: string
  }
): AIFeedItem {
  const direction =
    prediction.predicted_direction === "bullish" ? "upward" : "downward"
  const action = direction === "upward" ? "Bullish" : "Bearish"
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    message: `${action} bias at ${prediction.bullish_pct}% confidence (${prediction.confidence}). ${prediction.reasoning}`,
    type: "prediction",
  }
}
