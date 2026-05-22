"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`
  return `$${vol.toFixed(2)}`
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(2)}%`
}

export function PriceTicker() {
  const price = useMarketStore((s) => s.price)
  const prevPrice = useMarketStore((s) => s.prevPrice)
  const volume = useMarketStore((s) => s.volume)
  const [change24h, setChange24h] = useState<number | null>(null)

  useEffect(() => {
    if (price && prevPrice) {
      const pct = ((price - prevPrice) / prevPrice) * 100
      setChange24h(pct)
    }
  }, [price, prevPrice])

  const priceDirection = price && prevPrice
    ? price >= prevPrice
      ? "up"
      : "down"
    : null

  const changeColor = change24h !== null
    ? change24h >= 0
      ? "text-chartreuse-zap"
      : "text-alert-red"
    : "text-shadow-white"

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="size-2.5 rounded-full bg-chartreuse-zap animate-pulse-glow" />
        <span className="text-xs font-medium text-silken-whisper font-mono tracking-wider uppercase">
          BTC / USDT
        </span>
        <span className="text-[10px] font-medium text-shadow-white/60 bg-cool-stone/50 px-1.5 py-0.5 rounded">
          BINANCE
        </span>
      </div>

      <div className="flex items-baseline gap-3">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={price ?? "no-price"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "text-[48px] font-bold leading-none font-mono",
              priceDirection === "up" && "text-chartreuse-zap",
              priceDirection === "down" && "text-alert-red",
              !price && "text-cloud-white"
            )}
          >
            {price ? formatPrice(price) : "--.--"}
          </motion.div>
        </AnimatePresence>

        {change24h !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn("text-lg font-semibold", changeColor)}
          >
            {formatChange(change24h)}
          </motion.span>
        )}
      </div>

      {volume !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-shadow-white">24h Vol</span>
          <span className="text-sm font-medium text-silken-whisper font-mono">
            {formatVolume(volume)}
          </span>
        </div>
      )}

      {price === null && (
        <div className="h-[48px] rounded animate-shimmer" />
      )}
    </div>
  )
}
