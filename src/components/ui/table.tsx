import { cn } from "@/lib/utils"

/**
 * Desktop table chrome shared by the admin table pages. Deliberately not a
 * column-config `DataTable` — each page's rows/actions differ enough that a
 * generic renderer would be harder to read than plain JSX. Callers pass
 * `<th>`s as `head` and `<tr>`s as children; wrap this in `hidden md:block`
 * and pair it with a page-local card list for the mobile view.
 */
export function AdminTable({
  head,
  children,
  className,
}: {
  head: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-surface rounded-md border border-[var(--navy)]/10 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-neutral border-b border-[var(--hair)]">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hair)]">{children}</tbody>
        </table>
      </div>
    </div>
  )
}
