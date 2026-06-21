import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlert, Check, X } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { ListingWizard } from "../listing-wizard"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } })
  if (!user) redirect("/login")

  const checks = [
    { ok: user.verificationStatus === "FULLY_VERIFIED", label: "Be fully verified", href: "/verify-identity" },
    { ok: user.profileCompletion >= 80, label: `Complete your profile (${user.profileCompletion}% of 80%)`, href: "/dashboard/profile" },
    { ok: !!user.subscription && user.subscription.status === "active", label: "Hold an active subscription", href: "/dashboard/subscription" },
  ]
  const canList = checks.every((c) => c.ok)

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Add a listing" subtitle="List a home for exchange across the network." />
      {canList ? (
        <ListingWizard mode="create" />
      ) : (
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-8">
          <div className="flex items-center gap-3 mb-5">
            <ShieldAlert size={22} className="text-[var(--gold-dark)]" />
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">A few steps before you can list</h2>
          </div>
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-neutral-dark">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${c.ok ? "bg-[var(--teal)]/15 text-[var(--teal)]" : "bg-[var(--crimson)]/10 text-[var(--crimson)]"}`}>
                    {c.ok ? <Check size={13} /> : <X size={13} />}
                  </span>
                  {c.label}
                </span>
                {!c.ok && <Link href={c.href} className="text-xs font-semibold text-[var(--gold-dark)] hover:text-[var(--gold-hover)]">Fix</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
