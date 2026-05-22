"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <h2 className="text-xl font-semibold text-cloud-white">Something went wrong</h2>
      <p className="text-sm text-shadow-white max-w-md text-center">
        Could not load market data. The backend may be unavailable.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-full border border-chartreuse-zap px-4 py-2 text-sm text-cloud-white hover:bg-veridian-stroke transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
