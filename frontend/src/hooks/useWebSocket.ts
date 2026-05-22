import { useEffect, useRef, useCallback } from "react"
import { useMarketStore } from "@/store/marketStore"
import { WS_URL } from "@/lib/constants"
import type { Candle, IndicatorData, Ticker24h } from "@/store/marketStore"

const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const setPrice = useMarketStore((s) => s.setPrice)
  const setIndicators = useMarketStore((s) => s.setIndicators)
  const setCandles = useMarketStore((s) => s.setCandles)
  const setWsConnected = useMarketStore((s) => s.setWsConnected)
  const setWsReconnecting = useMarketStore((s) => s.setWsReconnecting)
  const setError = useMarketStore((s) => s.setError)
  const candles = useMarketStore((s) => s.candles)

  const candlesRef = useRef(candles)
  candlesRef.current = candles

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
      setWsConnected(true)
    }

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return

      try {
        const data = JSON.parse(event.data)

        if (data.price !== undefined) {
          setPrice(data.price)
        }

        if (data.volume !== undefined) {
          useMarketStore.setState({ volume: data.volume })
        }

        if (data.timestamp !== undefined) {
          useMarketStore.setState({ timestamp: data.timestamp })
        }

        if (data.ticker_24h) {
          useMarketStore.setState({ ticker24h: data.ticker_24h as Ticker24h })
        }

        if (data.indicators) {
          setIndicators(data.indicators as IndicatorData)
        }

        if (data.current_candle) {
          const candle = data.current_candle as Candle
          const currentCandles = candlesRef.current

          const existingIndex = currentCandles.findIndex(
            (c) => c.open_time === candle.open_time
          )

          if (existingIndex >= 0) {
            const updated = [...currentCandles]
            updated[existingIndex] = candle
            setCandles(updated)
          } else {
            setCandles([...currentCandles, candle])
          }
        }
      } catch {
        // skip malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setWsConnected(false)
      attemptReconnect()
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      ws.close()
    }
  }, [setPrice, setIndicators, setCandles, setWsConnected])

  // eslint-disable-line react-hooks/exhaustive-deps

  const attemptReconnect = useCallback(() => {
    if (!mountedRef.current) return

    setWsReconnecting(true)

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY
      )
      connect()
    }, reconnectDelayRef.current)
  }, [connect, setWsReconnecting])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.onmessage = null
        wsRef.current.onopen = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return null
}
