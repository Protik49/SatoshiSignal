"use client"

import { useMarketStore, IndicatorData } from "@/store/marketStore"
import { cn } from "@/lib/utils"

function indicatorColor(value: number | null, threshold: { high: number; low: number }): string {
  if (value === null) return "text-shadow-white"
  if (value >= threshold.high) return "text-alert-red"
  if (value <= threshold.low) return "text-chartreuse-zap"
  return "text-cloud-white"
}

function macdColor(indicator: IndicatorData): string {
  if (indicator.macd === null || indicator.macd_signal === null) return "text-shadow-white"
  if (indicator.macd > indicator.macd_signal) return "text-chartreuse-zap"
  return "text-alert-red"
}

interface IndicatorSlotProps {
  label: string
  value: string | null
  colorClass?: string
}

function IndicatorSlot({ label, value, colorClass = "text-cloud-white" }: IndicatorSlotProps) {
  return (
    <div className="flex items-center gap-1.5 px-3">
      <span className="text-[10px] uppercase tracking-wider text-shadow-white/60">
        {label}
      </span>
      <span className={cn("text-xs font-mono font-semibold", colorClass)}>
        {value ?? "--"}
      </span>
    </div>
  )
}

export function IndicatorBar() {
  const indicators = useMarketStore((s) => s.indicators)

  const fmt = (v: number | null, decimals = 2): string | null =>
    v !== null ? v.toFixed(decimals) : null

  const rsiColor = indicatorColor(indicators?.rsi ?? null, { high: 70, low: 30 })

  return (
    <div className="bg-deep-graphite/60 rounded-lg border border-cool-stone/50 py-2 px-1 flex items-center overflow-x-auto">
      <IndicatorSlot
        label="RSI"
        value={fmt(indicators?.rsi ?? null, 1)}
        colorClass={rsiColor}
      />

      <div className="w-px h-4 bg-iron-oxide shrink-0" />

      <IndicatorSlot
        label="MACD"
        value={fmt(indicators?.macd ?? null, 4)}
        colorClass={indicators ? macdColor(indicators) : "text-shadow-white"}
      />

      <div className="w-px h-4 bg-iron-oxide shrink-0" />

      <IndicatorSlot label="EMA 9" value={fmt(indicators?.ema_9 ?? null, 0)} />
      <div className="w-px h-4 bg-iron-oxide shrink-0" />
      <IndicatorSlot label="EMA 21" value={fmt(indicators?.ema_21 ?? null, 0)} />
      <div className="w-px h-4 bg-iron-oxide shrink-0" />
      <IndicatorSlot label="EMA 50" value={fmt(indicators?.ema_50 ?? null, 0)} />

      <div className="w-px h-4 bg-iron-oxide shrink-0" />

      <IndicatorSlot label="ATR" value={fmt(indicators?.atr ?? null, 2)} />

      <div className="w-px h-4 bg-iron-oxide shrink-0" />

      <IndicatorSlot label="VOL RATIO" value={fmt(indicators?.volume_ratio ?? null, 2)} />

      <div className="w-px h-4 bg-iron-oxide shrink-0" />

      <IndicatorSlot label="Δ 5M" value={fmt(indicators?.price_change_5m ?? null, 2)} />
    </div>
  )
}
