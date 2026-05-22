"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react"
import { useMarketStore, type NewsItem } from "@/store/marketStore"
import { cn } from "@/lib/utils"

export function NewsTicker() {
  const news = useMarketStore((s) => s.news)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  if (news.length === 0) return null

  const tickerContent = [...news, ...news]

  return (
    <div className="bg-smokey-carbon border-b border-cool-stone overflow-hidden">
      <div className="flex items-center h-8">
        <div className="shrink-0 flex items-center gap-1.5 px-4 border-r border-cool-stone h-full bg-deep-graphite">
          <Newspaper className="size-3 text-chartreuse-zap" />
          <span className="text-[10px] font-semibold text-cloud-white uppercase tracking-widest">
            News
          </span>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: isPaused ? "none" : "scroll-ticker 60s linear infinite",
            }}
          >
            {tickerContent.map((item, i) => (
              <TickerItem key={`${item.url}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function TickerItem({ item }: { item: NewsItem }) {
  const sentimentIcon =
    item.sentiment === "bullish" ? (
      <TrendingUp className="size-2.5 text-chartreuse-zap" />
    ) : item.sentiment === "bearish" ? (
      <TrendingDown className="size-2.5 text-alert-red" />
    ) : (
      <Minus className="size-2.5 text-shadow-white/50" />
    )

  const sentimentColor =
    item.sentiment === "bullish"
      ? "text-chartreuse-zap"
      : item.sentiment === "bearish"
        ? "text-alert-red"
        : "text-shadow-white"

  return (
    <div className="flex items-center gap-2 px-4 shrink-0">
      <span className={cn("text-[9px] font-semibold uppercase tracking-wider", sentimentColor)}>
        {sentimentIcon}
      </span>
      <span className="text-[11px] text-silken-whisper truncate max-w-[400px]">
        {item.title}
      </span>
      <span className="text-[10px] text-shadow-white/40 font-mono shrink-0">
        {item.source}
      </span>
      <span className="text-shadow-white/20 mx-1">|</span>
    </div>
  )
}
