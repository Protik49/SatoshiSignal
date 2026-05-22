"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  createChart,
  AreaSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts"
import { useMarketStore, type Candle } from "@/store/marketStore"

function toLineData(c: Candle) {
  return {
    time: (c.open_time / 1000) as Time,
    value: c.close,
  }
}

const CHART_COLORS = {
  areaTop: "rgba(250, 255, 105, 0.25)",
  areaBottom: "rgba(250, 255, 105, 0.02)",
  line: "#faff69",
}

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const candles = useMarketStore((s) => s.candles)
  const price = useMarketStore((s) => s.price)

  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      chartRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      )
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
        vertLines: { color: "#282828", style: 2 },
        horzLines: { color: "#282828", style: 2 },
      },
      crosshair: { mode: 1 },
      timeScale: {
        borderColor: "#343434",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#343434",
        autoScale: true,
      },
      handleScroll: false,
      handleScale: false,
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: CHART_COLORS.line,
      topColor: CHART_COLORS.areaTop,
      bottomColor: CHART_COLORS.areaBottom,
      lineWidth: 2,
      priceLineVisible: true,
      priceLineColor: "rgba(250, 255, 105, 0.4)",
      priceLineWidth: 1,
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: CHART_COLORS.line,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    chart.timeScale().fitContent()

    chartRef.current = chart
    areaSeriesRef.current = areaSeries
    lineSeriesRef.current = lineSeries

    const observer = new ResizeObserver(handleResize)
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      areaSeriesRef.current = null
      lineSeriesRef.current = null
    }
  }, [handleResize])

  useEffect(() => {
    if (!areaSeriesRef.current || !lineSeriesRef.current) return
    if (candles.length === 0) return

    const sorted = [...candles].sort((a, b) => a.open_time - b.open_time)
    const lineData = sorted.map(toLineData)

    areaSeriesRef.current.setData(lineData)
    lineSeriesRef.current.setData(lineData)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return (
    <div className="bg-smokey-carbon rounded-lg border border-cool-stone overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cool-stone/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chartreuse-zap animate-pulse-glow" />
          <span className="text-xs font-semibold text-cloud-white uppercase tracking-wider font-mono">
            BTC / USDT
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-shadow-white/50">
          {price && (
            <span className="text-chartreuse-zap font-semibold text-xs">
              ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <span>1M</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-[350px]" />
    </div>
  )
}
