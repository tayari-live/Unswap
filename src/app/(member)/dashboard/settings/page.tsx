import Link from "next/link"
import { redirect } from "next/navigation"
import { UserCircle, ShieldCheck, CreditCard, Bell, ChevronRight } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { LuxPageHeader } from "@/components/ui/lux"
import { ChangePasswordForm } from "@/components/account/change-password-form"

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
      href: "/dashboard/settings/notifications",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Account" title="Settings" subtitle="Manage your account, verification, and preferences." />
      <div className="bg-surface rounded-md border border-[var(--hair)] divide-y divide-[var(--hair)] overflow-hidden">
        {rows.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="flex items-center gap-4 p-5 hover:bg-[var(--background)] transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-[var(--navy)]/10 text-[var(--fg)] flex items-center justify-center flex-shrink-0">
              <r.icon size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--fg)]">{r.title}</div>
              <div className="text-xs text-neutral mt-0.5">{r.desc}</div>
            </div>
            <ChevronRight size={18} className="text-neutral flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="bg-surface rounded-md border border-[var(--hair)] p-6 sm:p-8 mt-6">
        <h2 className="font-sans font-bold text-lg text-[var(--fg)] mb-1.5">Password</h2>
        <p className="text-sm text-neutral mb-5">Change the password you use to sign in.</p>
        <ChangePasswordForm />
      </div>

      <p className="mt-4 text-center text-xs text-neutral">
        Sign out from the account menu in the sidebar.
      </p>
    </div>
  )
}
