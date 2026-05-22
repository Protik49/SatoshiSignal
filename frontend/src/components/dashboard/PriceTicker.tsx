"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, Activity, BarChart3, Zap } from "lucide-react"
import { useMarketStore } from "@/store/marketStore"
import { cn } from "@/lib/utils"

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
  return `$${num.toFixed(2)}`
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(2)}%`
}

function StatBlock({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  color?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        {icon && <span className="text-shadow-white/40">{icon}</span>}
        <span className="text-[10px] text-shadow-white/50 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <span className={cn("text-sm font-bold font-mono", color ?? "text-cloud-white")}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-shadow-white/40 font-mono">{sub}</span>}
    </div>
  )
}

export function PriceTicker() {
  const price = useMarketStore((s) => s.price)
  const prevPrice = useMarketStore((s) => s.prevPrice)
  const ticker24h = useMarketStore((s) => s.ticker24h)
  const indicators = useMarketStore((s) => s.indicators)

  const change24h = ticker24h?.price_change_pct ?? 0
  const isPositive = change24h >= 0

  const priceDirection = price && prevPrice
    ? price >= prevPrice
      ? "up"
      : "down"
    : null

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5">
        <div className="size-2.5 rounded-full bg-chartreuse-zap animate-pulse-glow" />
        <span className="text-xs font-medium text-silken-whisper font-mono tracking-wider uppercase">
          BTC / USDT
        </span>
        <span className="text-[10px] font-medium text-shadow-white/60 bg-cool-stone/50 px-1.5 py-0.5 rounded">
          BINANCE
        </span>
      </div>

      <div className="flex items-baseline gap-2 sm:gap-3">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={price ?? "no-price"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "text-3xl sm:text-[48px] font-bold leading-none font-mono tracking-tight",
              priceDirection === "up" && "text-chartreuse-zap",
              priceDirection === "down" && "text-alert-red",
              !price && "text-cloud-white"
            )}
          >
            {price ? formatPrice(price) : "--.--"}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-1 text-base sm:text-lg font-semibold",
            isPositive ? "text-chartreuse-zap" : "text-alert-red"
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <ArrowDownRight className="size-4" />
          )}
          {formatChange(change24h)}
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-cool-stone/50">
        <StatBlock
          label="24h High"
          value={ticker24h ? formatPrice(ticker24h.high_24h) : "--"}
          color="text-chartreuse-zap"
          icon={<ArrowUpRight className="size-2.5" />}
        />
        <StatBlock
          label="24h Low"
          value={ticker24h ? formatPrice(ticker24h.low_24h) : "--"}
          color="text-alert-red"
          icon={<ArrowDownRight className="size-2.5" />}
        />
        <StatBlock
          label="24h Volume"
          value={ticker24h ? formatCompact(ticker24h.quote_volume_24h) : "--"}
          sub={ticker24h ? `${ticker24h.trades_24h.toLocaleString()} trades` : undefined}
          icon={<BarChart3 className="size-2.5" />}
        />
      </div>

      {indicators && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-cool-stone/50">
          <StatBlock
            label="RSI (14)"
            value={indicators.rsi !== null ? indicators.rsi.toFixed(1) : "--"}
            color={
              indicators.rsi !== null
                ? indicators.rsi > 70
                  ? "text-alert-red"
                  : indicators.rsi < 30
                    ? "text-chartreuse-zap"
                    : "text-emerald-glint"
                : "text-cloud-white"
            }
            icon={<Activity className="size-2.5" />}
          />
          <StatBlock
            label="EMA 9/21"
            value={
              indicators.ema_9 !== null && indicators.ema_21 !== null
                ? indicators.ema_9 > indicators.ema_21
                  ? "Bullish"
                  : "Bearish"
                : "--"
            }
            color={
              indicators.ema_9 !== null && indicators.ema_21 !== null
                ? indicators.ema_9 > indicators.ema_21
                  ? "text-chartreuse-zap"
                  : "text-alert-red"
                : "text-cloud-white"
            }
            icon={<Zap className="size-2.5" />}
          />
          <StatBlock
            label="MACD"
            value={
              indicators.macd_histogram !== null
                ? indicators.macd_histogram > 0
                  ? "Bullish"
                  : "Bearish"
                : "--"
            }
            color={
              indicators.macd_histogram !== null
                ? indicators.macd_histogram > 0
                  ? "text-chartreuse-zap"
                  : "text-alert-red"
                : "text-cloud-white"
            }
            icon={<Activity className="size-2.5" />}
          />
        </div>
      )}

      {price === null && (
        <div className="h-[48px] rounded animate-shimmer" />
      )}
    </div>
  )
}