import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { MemberSidebar } from "@/components/layout/member-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
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
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      <div className="hidden md:block">
        <MemberSidebar name={u.name || ""} initials={initials} image={u.image || null} verificationStatus={u.verificationStatus} />
      </div>
      {/* Lets keyboard users jump the nav rail, which is otherwise ~11 stops
          before the page content on every single navigation. */}
      <a href="#main" className="sr-only skip-link">Skip to content</a>
      <main id="main" className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-[var(--canvas)]">
        {children}
      </main>
      <MobileNav variant="member" />
      <AppAssistant />
      <VerificationCelebration />
      <CreditCelebration />
    </div>
  )
}
