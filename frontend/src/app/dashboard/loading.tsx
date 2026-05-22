export default function DashboardLoading() {
  return (
    <div className="h-screen flex flex-col bg-midnight-oil">
      <div className="h-14 shrink-0 flex items-center px-6 bg-midnight-oil/95 border-b border-iron-oxide gap-2">
        <div className="size-5 rounded animate-shimmer" />
        <div className="h-5 w-32 rounded animate-shimmer" />
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
          <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full animate-shimmer" />
              <div className="h-3 w-20 rounded animate-shimmer" />
            </div>
            <div className="h-12 w-48 rounded animate-shimmer" />
            <div className="h-4 w-32 rounded animate-shimmer" />
          </div>
          <div className="bg-smokey-carbon rounded-lg border border-cool-stone p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </div>
            <div className="h-[400px] rounded animate-shimmer" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="h-6 w-64 rounded animate-shimmer" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-16 rounded-full animate-shimmer" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded animate-shimmer" />
                <div className="h-4 w-32 rounded animate-shimmer" />
              </div>
              <div className="flex gap-6">
                <div className="h-16 w-24 rounded animate-shimmer" />
                <div className="h-16 w-24 rounded animate-shimmer" />
              </div>
              <div className="h-2 w-full rounded-full animate-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded animate-shimmer" />
                <div className="h-3 w-5/6 rounded animate-shimmer" />
                <div className="h-3 w-4/6 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-smokey-carbon rounded-lg border border-cool-stone p-6 space-y-3">
              <div className="h-5 w-40 rounded animate-shimmer" />
              <div className="h-32 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
