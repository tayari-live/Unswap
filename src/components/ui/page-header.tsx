export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--navy)]">{title}</h1>
        {subtitle && <p className="text-neutral mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
