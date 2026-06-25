import { prisma } from "@/server/prisma"
import { sendEmail, renderEmail } from "@/server/email"
import { notifyAllowed } from "@/server/services/notify"

const APP = () => process.env.AUTH_URL || "http://localhost:3000"
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))
const fmtD = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d)

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Email both parties ~48h before a confirmed exchange starts. Idempotent via
 * `reminderSentAt` so repeated cron runs never double-send.
 */
export async function sendSwapReminders(): Promise<number> {
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * HOUR)

  const swaps = await prisma.swapRequest.findMany({
    where: {
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      reminderSentAt: null,
      startDate: { gt: now, lte: cutoff },
    },
    include: {
      listing: { select: { title: true, city: true, country: true } },
      host: { select: { email: true, firstName: true } },
      requester: { select: { email: true, firstName: true } },
    },
  })

  let sent = 0
  for (const s of swaps) {
    const when = fmtD(s.startDate)
    const place = `${esc(s.listing.city)}, ${esc(s.listing.country)}`
    const parties = [
      { id: s.hostId, p: s.host },
      { id: s.requesterId, p: s.requester },
    ]
    for (const { id, p } of parties) {
      if (!(await notifyAllowed(id, "reminders"))) continue
      await sendEmail({
        to: p.email,
        subject: "Your UnSwap exchange starts soon",
        html: renderEmail({
          heading: "Your exchange is almost here",
          body: `<p>Hello ${esc(p.firstName)},</p><p>Your exchange at <strong>${esc(s.listing.title)}</strong> (${place}) begins on <strong>${when}</strong> — just a couple of days from now. Confirm access details, keys, and travel plans with your counterpart.</p>`,
          ctaLabel: "View exchange",
          ctaUrl: `${APP()}/dashboard/exchanges`,
        }),
      }).catch((e) => console.error("Swap reminder email failed:", e))
    }
    await prisma.swapRequest.update({ where: { id: s.id }, data: { reminderSentAt: new Date() } })
    sent++
  }
  return sent
}

/**
 * Email members ~7 days before an annual subscription renews. Idempotent via
 * `renewalReminderSentAt`.
 */
export async function sendRenewalReminders(): Promise<number> {
  const now = new Date()
  const cutoff = new Date(now.getTime() + 7 * DAY)

  const subs = await prisma.subscription.findMany({
    where: {
      status: "active",
      tier: { not: "lifetime" },
      renewalReminderSentAt: null,
      renewsAt: { gt: now, lte: cutoff },
    },
    include: { user: { select: { email: true, firstName: true } } },
  })

  let sent = 0
  for (const sub of subs) {
    if (await notifyAllowed(sub.userId, "reminders")) {
    await sendEmail({
      to: sub.user.email,
      subject: "Your UnSwap membership renews soon",
      html: renderEmail({
        heading: "Your membership renews soon",
        body: `<p>Hello ${esc(sub.user.firstName)},</p><p>Your membership renews on <strong>${fmtD(sub.renewsAt!)}</strong> for <strong>$${sub.priceAnnual}</strong>. No action is needed to keep your access. You can manage or cancel any time before then.</p>`,
        ctaLabel: "Manage membership",
        ctaUrl: `${APP()}/dashboard/subscription`,
      }),
    }).catch((e) => console.error("Renewal reminder email failed:", e))
      await prisma.subscription.update({ where: { id: sub.id }, data: { renewalReminderSentAt: new Date() } })
      sent++
    }
  }
  return sent
}

/** Run all scheduled reminders. Called by the cron endpoint. */
export async function runReminders() {
  const [swapReminders, renewalReminders] = await Promise.all([
    sendSwapReminders(),
    sendRenewalReminders(),
  ])
  return { swapReminders, renewalReminders }
}
