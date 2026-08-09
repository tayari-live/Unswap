import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { AppNavbar } from "@/components/layout/app-navbar"
import { AppAssistant } from "@/components/assistant/app-assistant"
import { CreditCelebration } from "@/components/credits/credit-celebration"
import { VerificationCelebration } from "@/components/verification/verification-celebration"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const u = session.user as any
  // This area is for members. Admins belong in the ops console.
  if (u.role === "admin") {
    redirect("/overview")
  }

  // New members complete the onboarding wizard before reaching the dashboard.
  // Both fields come from the session, which already reads them in one query —
  // a second round-trip here would delay every navigation, skeleton included.
  if (!u.onboardedAt) {
    redirect("/onboarding")
  }

  const initials = (u.name || "M")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      {/* Two dropdowns rather than eleven rail items, so this is a short hop —
         but still worth offering on every navigation. */}
      <a href="#main" className="sr-only skip-link">Skip to content</a>
      <AppNavbar name={u.name || ""} initials={initials} image={u.image || null} verificationStatus={u.verificationStatus} />
      <main id="main" className="max-w-[1440px] mx-auto p-4 md:p-8">
        {children}
      </main>
      <AppAssistant />
      <VerificationCelebration />
      <CreditCelebration />
    </div>
  )
}
