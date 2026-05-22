"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Clock,
} from "lucide-react"
import { useMarketStore, type NewsItem } from "@/store/marketStore"
import { cn } from "@/lib/utils"

const SENTIMENT_CONFIG = {
  bullish: {
    badge: "bg-chartreuse-zap/20 text-chartreuse-zap border-chartreuse-zap/40",
    icon: TrendingUp,
    dot: "bg-chartreuse-zap",
  },
  bearish: {
    badge: "bg-alert-red/20 text-alert-red border-alert-red/40",
    icon: TrendingDown,
    dot: "bg-alert-red",
  },
  neutral: {
    badge: "bg-shadow-white/15 text-shadow-white border-shadow-white/30",
    icon: Minus,
    dot: "bg-shadow-white",
  },
} as const

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d ago`
  } catch {
    return ""
  }
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const config = SENTIMENT_CONFIG[item.sentiment] ?? SENTIMENT_CONFIG.neutral
  const SentimentIcon = config.icon

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group block bg-deep-graphite/60 hover:bg-deep-graphite border border-cool-stone/50 hover:border-cool-stone rounded-lg p-4 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
              config.badge
            )}
          >
            <SentimentIcon className="size-3" />
            {item.sentiment}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base text-cloud-white/90 group-hover:text-cloud-white leading-snug font-medium line-clamp-2 transition-colors">
            {item.title}
          </p>

          {item.description && (
            <p className="text-sm text-shadow-white/70 mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-2.5 mt-2.5">
            <span className="text-xs text-shadow-white/60 font-semibold">
              {item.source}
            </span>
            {item.published_at && (
              <>
                <span className="text-shadow-white/30">·</span>
                <span className="text-xs text-shadow-white/50 font-mono flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTimeAgo(item.published_at)}
                </span>
              </>
            )}
          </div>
        </div>

        <ExternalLink className="size-4 text-shadow-white/25 group-hover:text-shadow-white/60 shrink-0 mt-1 transition-colors" />
      </div>
    </motion.a>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 p-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-deep-graphite/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="h-6 w-20 rounded-md animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded animate-shimmer" />
              <div className="h-4 w-1/2 rounded animate-shimmer" />
              <div className="h-4 w-24 rounded animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function NewsPanel() {
  const news = useMarketStore((s) => s.news)
  const sentiment = useMarketStore((s) => s.sentiment)

  const bullCount = news.filter((n) => n.sentiment === "bullish").length
  const bearCount = news.filter((n) => n.sentiment === "bearish").length
  const neutralCount = news.length - bullCount - bearCount

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Newspaper className="size-5 text-chartreuse-zap" />
          <h3 className="font-semibold text-base text-cloud-white uppercase tracking-wider">
            Crypto News
          </h3>
        </div>

        {news.length > 0 && (
          <div className="flex items-center gap-4 text-xs font-mono font-semibold">
            {bullCount > 0 && (
              <span className="flex items-center gap-1.5 text-chartreuse-zap">
                <TrendingUp className="size-3.5" /> {bullCount}
              </span>
            )}
            {neutralCount > 0 && (
              <span className="flex items-center gap-1.5 text-shadow-white">
                <Minus className="size-3.5" /> {neutralCount}
              </span>
            )}
            {bearCount > 0 && (
              <span className="flex items-center gap-1.5 text-alert-red">
                <TrendingDown className="size-3.5" /> {bearCount}
              </span>
            )}
          </div>
        )}
      </div>

      {sentiment && (
        <div className="flex items-center gap-3 px-3 py-2 bg-deep-graphite/50 rounded-lg">
          <span className="text-xs text-shadow-white/60 uppercase tracking-wider font-semibold whitespace-nowrap">
            News Sentiment
          </span>
          <div className="flex-1 h-2 rounded-full bg-iron-oxide overflow-hidden flex">
            <div
              className="h-full bg-chartreuse-zap transition-all duration-500"
              style={{ width: `${(bullCount / Math.max(news.length, 1)) * 100}%` }}
            />
            <div
              className="h-full bg-shadow-white/40 transition-all duration-500"
              style={{
                width: `${(neutralCount / Math.max(news.length, 1)) * 100}%`,
              }}
            />
            <div
              className="h-full bg-alert-red transition-all duration-500"
              style={{ width: `${(bearCount / Math.max(news.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[520px] space-y-3 pr-1 -mr-1">
        {news.length === 0 ? (
          <Skeleton />
        ) : (
          <AnimatePresence initial={false}>
            {news.map((item, i) => (
              <NewsCard key={`${item.url}-${i}`} item={item} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {news.length > 0 && (
        <div className="text-xs text-shadow-white/40 font-mono text-center pt-2 border-t border-cool-stone/40">
          {news.length} articles · Updates every 60s
        </div>
      )}
    </div>
  )
}