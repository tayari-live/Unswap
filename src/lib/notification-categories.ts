/*
 * Notification kinds and their page-filter categories.
 *
 * Deliberately separate from `server/services/member-notifications`: the
 * notifications list is a client component and needs these at runtime, so they
 * cannot live in a module that imports Prisma.
 */

export type NotificationKind =
  | "swap" | "counter" | "confirmed" | "message" | "review"
  | "verification" | "verified" | "rejected" | "credit" | "profile" | "membership"

/*
 * "Account" rather than the "System" a platform notice would need: every item
 * here is about the member's own account state, and there is no
 * system-announcement source, so a System tab would sit permanently empty.
 */
export const NOTIFICATION_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "requests", label: "Requests" },
  { key: "exchanges", label: "Exchanges" },
  { key: "messages", label: "Messages" },
  { key: "membership", label: "Membership" },
  { key: "account", label: "Account" },
] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["key"]

const KIND_CATEGORY: Record<NotificationKind, Exclude<NotificationCategory, "all">> = {
  swap: "requests",
  counter: "requests",
  confirmed: "exchanges",
  review: "exchanges",
  message: "messages",
  membership: "membership",
  credit: "membership",
  verification: "account",
  verified: "account",
  rejected: "account",
  profile: "account",
}

export const categoryOf = (kind: NotificationKind): NotificationCategory => KIND_CATEGORY[kind]
