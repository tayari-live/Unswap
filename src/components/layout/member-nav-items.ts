import {
  LayoutDashboard,
  Compass,
  Home,
  ArrowLeftRight,
  CalendarCheck,
  MessageSquare,
  Coins,
  UserCircle,
  CreditCard,
  Bell,
  type LucideIcon,
} from "lucide-react"

export type MemberNavItem = {
  name: string
  href: string
  icon: LucideIcon
  // `live: false` items are part of the intended IA but not built yet — they
  // render as disabled in the sidebar so they never 404.
  live?: boolean
}

// Member dashboard navigation (PRD 5.8). Only Home is implemented so far; the
// rest are shown disabled until their pages are built.
export const memberNavigation: MemberNavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard, live: true },
  { name: "Discover", href: "/dashboard/browse", icon: Compass, live: true },
  { name: "My Listings", href: "/dashboard/listings", icon: Home, live: true },
  { name: "Swap Requests", href: "/dashboard/swaps", icon: ArrowLeftRight, live: true },
  { name: "My Exchanges", href: "/dashboard/exchanges", icon: CalendarCheck, live: true },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, live: true },
  { name: "Credits", href: "/dashboard/credits", icon: Coins, live: true },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle, live: true },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard, live: true },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, live: true },
]
