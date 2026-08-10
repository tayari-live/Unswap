import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminTopbar } from "@/components/layout/admin-topbar"
import { AdminMobileHeader } from "@/components/layout/admin-mobile-header"
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

  // The console is admin-only. A signed-in member is already authenticated,
  // so this is a permissions problem, not a login one.
  const u = session.user as any
  if (u.role !== "admin") {
    redirect("/forbidden")
  }

  const initials = (u.name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--canvas)]">
      <AdminTopbar name={u.name || ""} initials={initials} image={u.image || null} />
      <AdminMobileHeader name={u.name || ""} initials={initials} image={u.image || null} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        {/* Lets keyboard users jump the nav rail on every navigation. */}
        <a href="#main" className="sr-only skip-link">Skip to content</a>
        <main id="main" className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--canvas)]">
          {children}
        </main>
      </div>
    </div>
  )
}
