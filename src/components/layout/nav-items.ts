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
  type LucideIcon,
} from "lucide-react"

export type NavItem = { name: string; href: string; icon: LucideIcon }

// Shared navigation for the admin console, used by the sidebar and mobile nav.
export const adminNavigation: NavItem[] = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Verification", href: "/verification", icon: ShieldCheck },
  { name: "Members", href: "/members", icon: Users },
  { name: "Listings", href: "/listings", icon: Home },
  { name: "Swaps", href: "/swaps", icon: ArrowLeftRight },
  { name: "Moderation", href: "/moderation", icon: Flag },
  { name: "Waitlist", href: "/waitlist", icon: ListChecks },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: LineChart },
]
