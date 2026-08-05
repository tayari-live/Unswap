import { cn } from "@/lib/utils"

/** A single shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-[var(--hair)]", className)} />
}

/**
 * Generic page skeleton, shown while a dynamic page renders on the server.
 * Mirrors the editorial layout (eyebrow, large title, hairline tiles) so the
 * wait reads as the page arriving rather than a different design flashing up.
 */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-12" aria-hidden="true">
      {/* Header: eyebrow + display title */}
      <div className="mb-8">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-9 w-64 mt-4" />
        <Skeleton className="h-3.5 w-80 mt-3" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] rounded-md p-6 border border-[var(--hair)]">
            <Skeleton className="w-11 h-11" />
            <Skeleton className="h-8 w-16 mt-5" />
            <Skeleton className="h-2.5 w-24 mt-3" />
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] rounded-md border border-[var(--hair)] mt-5 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[var(--hair)]">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-6 w-48 mt-3" />
        </div>
        <div className="divide-y divide-[var(--hair)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-6 py-4">
              <Skeleton className="w-10 h-10 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
