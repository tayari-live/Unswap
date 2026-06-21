import { prisma } from "@/server/prisma"

export type NotifyCategory = "swaps" | "messages" | "reviews" | "reminders" | "marketing"

const FIELD: Record<NotifyCategory, string> = {
  swaps: "notifySwaps",
  messages: "notifyMessages",
  reviews: "notifyReviews",
  reminders: "notifyReminders",
  marketing: "notifyMarketing",
}

/**
 * Whether a member has opted in to a given email category. Transactional emails
 * (verification, password reset, billing) bypass this and are always sent.
 */
export async function notifyAllowed(userId: string, category: NotifyCategory): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { [FIELD[category]]: true } as any,
  })
  return u ? (u as any)[FIELD[category]] !== false : false
}
