"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"
import { useMarketStore, PredictionResult } from "@/store/marketStore"
import { cn } from "@/lib/utils"

interface PredictionCardProps {
  timeframe: string
}

const CONFIDENCE_COLORS: Record<string, string> = {
  High: "text-chartreuse-zap",
  Medium: "text-emerald-glint",
  Low: "text-shadow-white",
}

const CONFIDENCE_DOTS: Record<string, string> = {
  High: "bg-chartreuse-zap",
  Medium: "bg-emerald-glint",
  Low: "bg-shadow-white",
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-6 w-3/4 rounded animate-shimmer" />
      <div className="flex gap-6">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-20 rounded animate-shimmer" />
          <div className="h-12 w-28 rounded animate-shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-8 w-20 rounded animate-shimmer" />
          <div className="h-12 w-28 rounded animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded animate-shimmer" />
        <div className="h-4 w-5/6 rounded animate-shimmer" />
        <div className="h-4 w-4/6 rounded animate-shimmer" />
      </div>
    </div>
  )
}

export function PredictionCard({ timeframe }: PredictionCardProps) {
  const prediction = useMarketStore(
    (s) => s.predictions[timeframe] ?? null
  )

  if (!prediction) {
    return (
      <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6">
        <div className="flex items-center gap-2 pb-4">
          <Clock className="size-4 text-shadow-white" />
          <h3 className="font-semibold text-sm text-shadow-white uppercase tracking-wider">
            BTC Forecast ({timeframe})
          </h3>
        </div>
        <SkeletonLoader />
      </div>
    )
  }

  return <PredictionCardContent prediction={prediction} timeframe={timeframe} />
}

function PredictionCardContent({
  prediction,
  timeframe,
}: {
  prediction: PredictionResult
  timeframe: string
}) {
  const isBullish = prediction.predicted_direction === "bullish"

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-shadow-white" />
        <h3 className="font-semibold text-sm text-shadow-white uppercase tracking-wider">
          BTC Forecast ({timeframe})
        </h3>
      </div>

      <div className="flex items-end gap-6">
        <div className="flex flex-col">
          <span className="text-xs text-shadow-white/60 uppercase tracking-wider font-mono mb-1">
            Bullish
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`bull-${prediction.bullish_pct}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-bold text-chartreuse-zap font-mono"
            >
              {prediction.bullish_pct}%
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-shadow-white/60 uppercase tracking-wider font-mono mb-1">
            Bearish
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`bear-${prediction.bearish_pct}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-bold text-shadow-white font-mono"
            >
              {prediction.bearish_pct}%
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-deep-graphite overflow-hidden flex">
        <motion.div
          className="h-full bg-chartreuse-zap"
          initial={{ width: 0 }}
          animate={{ width: `${prediction.bullish_pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-shadow-white/30"
          initial={{ width: 0 }}
          animate={{ width: `${prediction.bearish_pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-2 rounded-full",
            CONFIDENCE_DOTS[prediction.confidence] ?? "bg-shadow-white"
          )}
        />
        <span className="text-xs font-medium text-shadow-white">
          Confidence:{" "}
          <span
            className={cn(
              "font-semibold",
              CONFIDENCE_COLORS[prediction.confidence] ?? "text-shadow-white"
            )}
          >
            {prediction.confidence}
          </span>
        </span>
        <span className="text-xs text-shadow-white/50 ml-auto">
          {new Date(prediction.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {isBullish ? (
          <TrendingUp className="size-3.5 text-chartreuse-zap" />
        ) : (
          <TrendingDown className="size-3.5 text-alert-red" />
        )}
        <span
          className={cn(
            "text-xs font-mono uppercase font-semibold",
            isBullish ? "text-chartreuse-zap" : "text-alert-red"
          )}
        >
          {prediction.predicted_direction}
        </span>
      </div>

      <p className="text-sm text-shadow-white leading-relaxed">
        {prediction.reasoning}
      </p>

      {prediction.key_drivers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider text-shadow-white/60 font-semibold">
            Key Drivers
          </span>
          <ul className="space-y-1">
            {prediction.key_drivers.slice(0, 5).map((driver, i) => (
              <motion.li
                key={`${timeframe}-driver-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs text-silken-whisper"
              >
                <span className="mt-1 size-1.5 rounded-full bg-chartreuse-zap shrink-0" />
                {driver}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[10px] text-shadow-white/40 font-mono pt-1 border-t border-cool-stone/50">
        Generated at {new Date(prediction.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
