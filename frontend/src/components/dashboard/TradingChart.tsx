"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type CandlestickData,
  type HistogramData,
} from "lightweight-charts"
import { useMarketStore, type Candle } from "@/store/marketStore"

function toCandlestickData(c: Candle) {
  return {
    time: (c.open_time / 1000) as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }
}

function toVolumeData(c: Candle) {
  const isUp = c.close >= c.open
  return {
    time: (c.open_time / 1000) as Time,
    value: c.volume,
    color: isUp ? "rgba(250, 255, 105, 0.3)" : "rgba(255, 117, 117, 0.3)",
  }
}

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const candles = useMarketStore((s) => s.candles)

  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      chartRef.current.resize(width, height)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#151515" },
        textColor: "#bcbcbb",
      },
      grid: {
        vertLines: { color: "#282828" },
        horzLines: { color: "#282828" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#343434",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#343434",
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#faff69",
      downColor: "#ff7575",
      borderUpColor: "#faff69",
      borderDownColor: "#ff7575",
      wickUpColor: "#a0a0a0",
      wickDownColor: "#a0a0a0",
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [handleResize])

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return
    if (candles.length === 0) return

    const sorted = [...candles].sort((a, b) => a.open_time - b.open_time)

    candleSeriesRef.current.setData(sorted.map(toCandlestickData))
    volumeSeriesRef.current.setData(sorted.map(toVolumeData))
  }, [candles])

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cool-stone/50">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chartreuse-zap" />
          <span className="text-xs font-semibold text-silken-whisper uppercase tracking-wider font-mono">
            BTC/USDT
          </span>
        </div>
        <span className="text-[10px] text-shadow-white/50 font-mono ml-auto">
          1m candles
        </span>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-[400px]" />
    </div>
  )
}
