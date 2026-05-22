import { useEffect, useRef, useCallback } from "react"

export function usePolling(
  callback: () => Promise<void>,
  interval: number,
  enabled: boolean
) {
  const savedCallback = useRef(callback)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const tick = () => {
      savedCallback.current().catch(() => {})
    }

    tick()

    intervalRef.current = setInterval(tick, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, enabled])
}
