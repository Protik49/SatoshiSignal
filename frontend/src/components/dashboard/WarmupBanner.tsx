"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useMarketStore } from "@/store/marketStore"

export function WarmupBanner() {
  const predictions = useMarketStore((s) => s.predictions)
  const sentiment = useMarketStore((s) => s.sentiment)
  const accuracy = useMarketStore((s) => s.accuracy)

  const hasPredictions = Object.values(predictions).some(Boolean)
  const hasSentiment = Boolean(sentiment)
  const hasAccuracy = Boolean(accuracy)

  const totalReady = [hasPredictions, hasSentiment, hasAccuracy].filter(Boolean).length
  const allReady = totalReady === 3

  if (allReady) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-deep-graphite border border-cool-stone rounded-lg px-4 py-2.5 flex items-center gap-3"
      >
        <Loader2 className="size-3.5 text-chartreuse-zap animate-spin" />
        <span className="text-xs text-silken-whisper">
          Warming up data pipelines...{" "}
          <span className="text-chartreuse-zap font-mono">{totalReady}/3</span> services ready
          {!hasPredictions && " (predictions)"}
          {!hasSentiment && " (sentiment)"}
          {!hasAccuracy && " (accuracy)"}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
