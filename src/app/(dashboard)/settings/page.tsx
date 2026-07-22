import { redirect } from "next/navigation"
import { ShieldCheck, Mail, User as UserIcon, CalendarDays } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { SignOutButton } from "@/components/layout/sign-out-button"
import { ChangePasswordForm } from "@/components/account/change-password-form"

export const dynamic = "force-dynamic"

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export default async function AdminSettingsPage() {
  const session = await auth()
  const u = session?.user as any
  if (!u?.id) redirect("/login")
  if (u.role !== "admin") redirect("/login?error=forbidden")

  const user = await prisma.user.findUnique({
    where: { id: u.id as string },
    select: { fullName: true, email: true, role: true, createdAt: true },
  })
  if (!user) redirect("/login")

  const rows = [
    { icon: UserIcon, label: "Name", value: user.fullName },
    { icon: Mail, label: "Email", value: user.email },
    { icon: ShieldCheck, label: "Role", value: "Administrator" },
    { icon: CalendarDays, label: "Member since", value: fmtDate(user.createdAt) },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader title="Settings" subtitle="Your administrator account." />

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8">
        <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-5">Account</h2>
        <dl className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <dt className="flex items-center gap-2.5 text-sm text-neutral">
                <r.icon size={16} className="text-[var(--gold-dark)]" />
                {r.label}
              </dt>
              <dd className="text-sm font-semibold text-[var(--navy)] text-right truncate">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8 mt-6">
        <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-1.5">Password</h2>
        <p className="text-sm text-neutral mb-5">Change the password for your admin account.</p>
        <ChangePasswordForm />
      </div>

      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8 mt-6">
        <h2 className="font-display font-bold text-lg text-[var(--navy)] mb-1.5">Session</h2>
        <p className="text-sm text-neutral mb-5">Sign out of the admin console on this device.</p>
        <SignOutButton />
      </div>
    </div>
  )
}
