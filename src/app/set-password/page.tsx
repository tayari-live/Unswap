import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { SetPasswordForm } from "./set-password-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Set your password" }

// Final step of the waitlist setup flow: a passwordless member who has finished
// onboarding and added a property sets their password here. Lives outside the
// (member) layout so the setup-gating chain that redirects here can't loop.
export default async function SetPasswordPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")
  // Password already set — nothing to do here.
  if (user.passwordHash) redirect("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-wl-navy text-wl-ivory">
      <SetPasswordForm firstName={user.firstName} />
    </div>
  )
}
