import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ProfileProvider } from "@/context/profile-context"
import { auth } from "@/server/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // The console is admin-only. Non-admin accounts are signed out at the door.
  const u = session.user as any
  if (u.role !== "admin") {
    redirect("/login?error=forbidden")
  }

  const initials = (u.name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <ProfileProvider
      initial={{
        name: u.name || "",
        image: u.image || null,
        initials,
      }}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </ProfileProvider>
  )
}
