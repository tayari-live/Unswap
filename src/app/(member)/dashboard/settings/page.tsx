import Link from "next/link"
import { redirect } from "next/navigation"
import { UserCircle, ShieldCheck, CreditCard, Bell, ChevronRight } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"

export const dynamic = "force-dynamic"

const VSTATUS: Record<string, string> = {
  PENDING_EMAIL: "Confirm your email",
  EMAIL_VERIFIED: "Not verified — needed to swap",
  PENDING_ID_REVIEW: "Under review",
  FULLY_VERIFIED: "Verified",
  REJECTED: "Action needed",
}

export default async function SettingsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })
  if (!user) redirect("/login")

  const rows = [
    {
      icon: UserCircle,
      title: "Profile",
      desc: `${user.profileCompletion}% complete`,
      href: "/dashboard/profile",
    },
    {
      icon: ShieldCheck,
      title: "Identity verification",
      desc: VSTATUS[user.verificationStatus] ?? user.verificationStatus,
      href: "/verify-identity",
    },
    {
      icon: CreditCard,
      title: "Subscription",
      desc: user.subscription?.status === "active" ? "Active plan" : "No active plan",
      href: "/dashboard/subscription",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Email preferences",
      href: "/dashboard/notifications",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Settings" subtitle="Manage your account, verification, and preferences." />
      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border)] overflow-hidden">
        {rows.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="flex items-center gap-4 p-5 hover:bg-[var(--background)] transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-[var(--navy)]/10 text-[var(--navy)] flex items-center justify-center flex-shrink-0">
              <r.icon size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--navy)]">{r.title}</div>
              <div className="text-xs text-neutral mt-0.5">{r.desc}</div>
            </div>
            <ChevronRight size={18} className="text-neutral flex-shrink-0" />
          </Link>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-neutral">
        Sign out from the account menu in the top-right corner.
      </p>
    </div>
  )
}
