import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Home,
  ArrowLeftRight,
  ListChecks,
  Globe,
  LineChart,
  Flag,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { name: string; href: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }

// Grouped navigation for the admin console, used by the sidebar and the
// mobile drawer. Labels are operational vocabulary (Properties, Swap
// Requests, Reports) — the underlying routes are unchanged so nothing else
// in the app needs to know about the rename.
export const adminNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Members",
    items: [
      { name: "Members", href: "/members", icon: Users },
      { name: "Verification", href: "/verification", icon: ShieldCheck },
      { name: "Waitlist", href: "/waitlist-admin", icon: ListChecks },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { name: "Properties", href: "/listings", icon: Home },
      { name: "Swap Requests", href: "/swaps", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Reports", href: "/moderation", icon: Flag },
      { name: "Analytics", href: "/analytics", icon: LineChart },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Domains", href: "/domains", icon: Globe },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

// Flat view — kept for call sites that just need "is this route in the admin
// console" without caring about grouping (active-state checks, search, etc).
export const adminNavigationFlat: NavItem[] = adminNavigation.flatMap((g) => g.items)
