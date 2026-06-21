import { cn } from "@/lib/utils"

/** A single shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-neutral-light", className)} />
}

/** A generic page skeleton: title, a row of stat cards, and a list. */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-12" aria-hidden="true">
      <div className="mb-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-3" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-5 border border-[var(--border)] shadow-sm">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-7 w-16 mt-4" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm mt-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
