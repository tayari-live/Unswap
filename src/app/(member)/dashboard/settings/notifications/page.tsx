import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { NotificationPrefs } from "../../notifications/notification-prefs"

export const dynamic = "force-dynamic"

export default async function NotificationSettingsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifySwaps: true, notifyMessages: true, notifyReviews: true, notifyReminders: true, notifyMarketing: true },
  })
  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral hover:text-[var(--navy)] mb-4 transition-colors"
      >
        <ChevronLeft size={16} /> Settings
      </Link>
      <PageHeader title="Notification preferences" subtitle="Choose which emails you receive from UnSwap." />
      <NotificationPrefs initial={user} />
    </div>
  )
}
