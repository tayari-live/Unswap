import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { MemberSidebar } from "@/components/layout/member-sidebar"
import { MemberTopbar } from "@/components/layout/member-topbar"
import { MobileNav } from "@/components/layout/mobile-nav"

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
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id as string },
    select: { onboardedAt: true, verificationStatus: true },
  })
  if (!dbUser?.onboardedAt) {
    redirect("/onboarding")
  }

  const initials = (u.name || "M")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
      <MemberTopbar name={u.name || ""} initials={initials} image={u.image || null} verificationStatus={dbUser.verificationStatus} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <MemberSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav variant="member" />
    </div>
  )
}
