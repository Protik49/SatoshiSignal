"use client"

import { useMarketStore } from "@/store/marketStore"
import { cn } from "@/lib/utils"
import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const wsConnected = useMarketStore((s) => s.wsConnected)
  const wsReconnecting = useMarketStore((s) => s.wsReconnecting)

  if (wsConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chartreuse-zap animate-pulse-glow" />
          <span className="text-xs font-semibold text-chartreuse-zap font-mono tracking-wider">
            LIVE
          </span>
        </div>
        <Wifi className="size-3.5 text-silken-whisper" />
      </div>
    )
  }

  if (wsReconnecting) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-emerald-glint animate-pulse" />
          <span className="text-xs font-semibold text-emerald-glint font-mono tracking-wider">
            RECONNECTING
          </span>
        </div>
        <Wifi className="size-3.5 text-emerald-glint" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="size-2 rounded-full bg-alert-red" />
        <span className="text-xs font-semibold text-alert-red font-mono tracking-wider">
          DISCONNECTED
        </span>
      </div>
      <WifiOff className="size-3.5 text-alert-red" />
    </div>
  )
}
