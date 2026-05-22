"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TimeframeSelectorProps {
  onChange?: (timeframe: string) => void
  defaultValue?: string
}

const TIMEFRAMES = [
  { value: "5m", label: "5M" },
  { value: "15m", label: "15M" },
  { value: "60m", label: "60M" },
]

export function TimeframeSelector({
  onChange,
  defaultValue = "15m",
}: TimeframeSelectorProps) {
  const [selected, setSelected] = useState(defaultValue)

  const handleSelect = useCallback(
    (value: string) => {
      setSelected(value)
      onChange?.(value)
    },
    [onChange]
  )

  return (
    <div className="flex items-center gap-2">
      {TIMEFRAMES.map((tf) => {
        const isActive = selected === tf.value
        return (
          <motion.button
            key={tf.value}
            type="button"
            onClick={() => handleSelect(tf.value)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className={cn(
              "relative px-5 py-1.5 text-sm font-semibold font-mono rounded-full transition-colors duration-200 border",
              isActive
                ? "bg-chartreuse-zap text-midnight-oil border-chartreuse-zap"
                : "text-shadow-white border-cool-stone hover:border-shadow-white hover:text-cloud-white bg-transparent"
            )}
          >
            {tf.label}
            {isActive && (
              <motion.div
                layoutId="timeframe-active-pill"
                className="absolute inset-0 bg-chartreuse-zap rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
