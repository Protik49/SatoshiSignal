import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Not Found — SatoshiSignal",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-6xl font-bold text-chartreuse-zap font-mono">404</h1>
      <p className="text-shadow-white">Page not found</p>
      <a
        href="/dashboard"
        className="rounded-full border border-chartreuse-zap px-4 py-2 text-sm text-cloud-white hover:bg-veridian-stroke transition-colors"
      >
        Back to Terminal
      </a>
    </div>
  )
}
