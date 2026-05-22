"use client"

import { motion } from "framer-motion"
import { Target, CheckCircle2, XCircle, BarChart3 } from "lucide-react"
import { useMarketStore } from "@/store/marketStore"
import { cn } from "@/lib/utils"

function winRateColor(rate: number): string {
  if (rate > 60) return "text-chartreuse-zap"
  if (rate >= 40) return "text-emerald-glint"
  return "text-alert-red"
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-shadow-white/40">
      <Target className="size-10" />
      <span className="text-xs font-mono text-center">
        Awaiting prediction resolution...
      </span>
    </div>
  )
}

export function AccuracyTracker() {
  const accuracy = useMarketStore((s) => s.accuracy)

  if (!accuracy) {
    return (
      <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-chartreuse-zap" />
          <h3 className="font-semibold text-sm text-cloud-white uppercase tracking-wider">
            Prediction Accuracy
          </h3>
        </div>
        <EmptyState />
      </div>
    )
  }

  if (accuracy.total_predictions === 0) {
    return (
      <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-chartreuse-zap" />
          <h3 className="font-semibold text-sm text-cloud-white uppercase tracking-wider">
            Prediction Accuracy
          </h3>
        </div>
        <EmptyState />
      </div>
    )
  }

  const { win_rate, total_predictions, wins, by_timeframe } = accuracy
  const losses = total_predictions - wins

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-chartreuse-zap" />
        <h3 className="font-semibold text-sm text-cloud-white uppercase tracking-wider">
          Prediction Accuracy
        </h3>
      </div>

      <div className="flex items-baseline gap-3">
        <motion.span
          key={win_rate}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={cn("text-4xl font-bold font-mono", winRateColor(win_rate))}
        >
          {win_rate.toFixed(1)}%
        </motion.span>
        <span className="text-sm text-shadow-white">win rate</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-chartreuse-zap" />
          <span className="text-xs text-silken-whisper">
            <span className="font-semibold text-chartreuse-zap font-mono">{wins}</span> wins
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="size-3.5 text-alert-red" />
          <span className="text-xs text-silken-whisper">
            <span className="font-semibold text-alert-red font-mono">{losses}</span> losses
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <BarChart3 className="size-3.5 text-shadow-white" />
          <span className="text-xs text-silken-whisper">
            <span className="font-semibold text-cloud-white font-mono">
              {total_predictions}
            </span>{" "}
            total
          </span>
        </div>
      </div>

      {by_timeframe.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-cool-stone/50">
          <span className="text-[11px] uppercase tracking-wider text-shadow-white/60 font-semibold">
            By Timeframe
          </span>
          {by_timeframe.map((tf) => (
            <div
              key={tf.timeframe}
              className="flex items-center gap-2 text-xs"
            >
              <span className="w-10 font-mono text-shadow-white font-semibold">
                {tf.timeframe}
              </span>
              <div className="flex-1 h-2 rounded-full bg-deep-graphite overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", winRateColor(tf.win_rate))}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(tf.win_rate, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span
                className={cn(
                  "font-mono font-semibold w-12 text-right",
                  winRateColor(tf.win_rate)
                )}
              >
                {tf.win_rate.toFixed(0)}%
              </span>
              <span className="text-shadow-white/50 font-mono w-12 text-right">
                {tf.wins}/{tf.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
