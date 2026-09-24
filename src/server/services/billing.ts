import Stripe from "stripe"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { grantPointsOnce, POINT_GRANTS } from "@/server/services/points"
import { sendEmail, renderEmail, esc } from "@/server/email"

// Tier catalogue — the single source of truth for entitlements and pricing.
export const TIERS = {
  limited_1x:      { name: "Limited 1X",       exchangesPerYear: 1,  priceAnnual: 129,  propertyGuarantee: 500_000,   mode: "subscription", priceEnv: "STRIPE_PRICE_LIMITED_1X" },
  standard_2x:     { name: "Standard 2X",      exchangesPerYear: 2,  priceAnnual: 219,  propertyGuarantee: 1_000_000, mode: "subscription", priceEnv: "STRIPE_PRICE_STANDARD_2X" },
  professional_4x: { name: "Professional 4X",  exchangesPerYear: 4,  priceAnnual: 349,  propertyGuarantee: 1_500_000, mode: "subscription", priceEnv: "STRIPE_PRICE_PROFESSIONAL_4X" },
  unlimited_pro:   { name: "Unlimited Pro",    exchangesPerYear: -1, priceAnnual: 449,  propertyGuarantee: 2_000_000, mode: "subscription", priceEnv: "STRIPE_PRICE_UNLIMITED_PRO" },
  lifetime:        { name: "Lifetime Access",  exchangesPerYear: -1, priceAnnual: 3143, propertyGuarantee: 2_000_000, mode: "payment",      priceEnv: "STRIPE_PRICE_LIFETIME" },
} as const

export type TierKey = keyof typeof TIERS
export function isTierKey(v: unknown): v is TierKey {
  return typeof v === "string" && v in TIERS
}

const key = process.env.STRIPE_SECRET_KEY
export const stripe = key ? new Stripe(key) : null
const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

/** On subscription lapse: pause the member's ACTIVE listings (flagged auto-paused). */
async function pauseListingsForLapse(userId: string) {
  await prisma.listing.updateMany({
    where: { ownerId: userId, status: "ACTIVE" },
    data: { status: "PAUSED", autoPaused: true },
  })
}

/** On resubscription: restore listings that were auto-paused by a lapse. */
async function restoreAutoPausedListings(userId: string) {
  await prisma.listing.updateMany({
    where: { ownerId: userId, autoPaused: true },
    data: { status: "ACTIVE", autoPaused: false },
  })
}

/** Create/activate the member's subscription record for a tier. */
export async function activateSubscription(
  userId: string,
  tierKey: TierKey,
  stripeSubscriptionId?: string | null,
) {
  const t = TIERS[tierKey]
  const renewsAt = tierKey === "lifetime" ? null : new Date(Date.now() + YEAR_MS)

  // Detect whether this is a genuine new activation. Both the Stripe webhook and
  // the success-return confirmation can call this for the same checkout, so the
  // one-time side effects (welcome email, audit, points) must not fire twice.
  const existing = await prisma.subscription.findUnique({ where: { userId } })
  const alreadyActive = existing?.status === "active" && existing?.tier === tierKey

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId, tier: tierKey, status: "active",
      exchangesPerYear: t.exchangesPerYear, priceAnnual: t.priceAnnual,
      propertyGuarantee: t.propertyGuarantee, renewsAt,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
    },
    update: {
      tier: tierKey, status: "active",
      exchangesPerYear: t.exchangesPerYear, priceAnnual: t.priceAnnual,
      propertyGuarantee: t.propertyGuarantee, renewsAt,
      ...(stripeSubscriptionId !== undefined ? { stripeSubscriptionId } : {}),
    },
  })

  // Restore any listings that a previous lapse auto-paused.
  await restoreAutoPausedListings(userId)

  // Already-active → the plan record is refreshed above, but skip the one-time
  // side effects so a duplicate call (webhook + return confirmation) is silent.
  if (alreadyActive) return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    await sendEmail({
      to: user.email,
      subject: `Your UnSwap ${t.name} membership is active`,
      html: renderEmail({
        heading: `Welcome aboard, ${esc(user.firstName)}.`,
        preheader: `Your ${t.name} membership is now active.`,
        body: `<p style="margin:0 0 14px">Your <strong>${t.name}</strong> membership is now active. You have full access to the network and its verified homes.</p>
               <p style="margin:0">${POINT_GRANTS.first_subscription.amount} points have been added to your balance as a subscription bonus.</p>`,
        ctaLabel: "Browse homes",
        ctaUrl: `${process.env.AUTH_URL || "http://localhost:3000"}/dashboard/browse`,
      }),
      text: `Your UnSwap ${t.name} membership is now active.`,
    }).catch((e) => console.error("Activation email failed:", e))
  }
  await logAudit({ actorId: userId, action: "SUBSCRIPTION_ACTIVATED", subject: `Activated ${t.name}`, metadata: { tier: tierKey } })
  // First paid subscription grants a point bonus (idempotent — renewals don't re-pay).
  await grantPointsOnce(userId, "first_subscription")
}

async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, "Account not found.")
  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe!.customers.create({
    email: user.email,
    name: user.fullName,
    metadata: { userId },
  })
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
  return customer.id
}

/**
 * Begin checkout for a tier. With Stripe configured this returns a hosted
 * Checkout URL. Without keys (local dev) it activates the tier directly so the
 * flow stays exercisable — mirroring the email service's dev fallback.
 */
export async function createCheckout(userId: string, tierKey: TierKey) {
  const t = TIERS[tierKey]

  if (!stripe) {
    // Dev-only convenience: activate directly so the flow stays exercisable
    // without Stripe. In production this must never grant a free subscription.
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(503, "Payments aren't available right now. Please try again shortly.")
    }
    await activateSubscription(userId, tierKey)
    return { url: `${baseUrl()}/dashboard/subscription?activated=${tierKey}`, dev: true }
  }

  const priceId = process.env[t.priceEnv]
  if (!priceId) throw new ApiError(500, `Stripe price not configured for ${t.name}.`)
  const customer = await getOrCreateCustomer(userId)

  const session = await stripe.checkout.sessions.create({
    mode: t.mode,
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    // {CHECKOUT_SESSION_ID} lets the success page confirm the payment directly,
    // as a fallback in case the webhook is delayed or not delivered.
    success_url: `${baseUrl()}/dashboard/subscription?activated=${tierKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/dashboard/subscription?cancelled=1`,
    metadata: { userId, tier: tierKey },
    ...(t.mode === "subscription" ? { subscription_data: { metadata: { userId, tier: tierKey } } } : {}),
  })
  return { url: session.url, dev: false }
}

/**
 * Confirm a completed Checkout Session on the success return — a fallback so a
 * paid member is activated even if the Stripe webhook is delayed or
 * misconfigured. Idempotent and safe to run alongside the webhook. Guards on
 * ownership (the session's metadata userId must match) and real payment, so a
 * forged or foreign session id can't grant a membership.
 */
export async function confirmCheckoutSession(userId: string, sessionId: string): Promise<boolean> {
  if (!stripe) return false
  let s: Stripe.Checkout.Session
  try {
    s = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return false
  }
  if (s.metadata?.userId !== userId) return false
  const tier = s.metadata?.tier
  if (!isTierKey(tier)) return false
  const paid =
    s.status === "complete" &&
    (s.payment_status === "paid" || s.payment_status === "no_payment_required")
  if (!paid) return false
  await activateSubscription(userId, tier, typeof s.subscription === "string" ? s.subscription : null)
  return true
}

/** Cancel an active subscription (at period end in Stripe; immediate in DB state). */
export async function cancelSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) throw new ApiError(404, "No active subscription.")
  if (sub.tier === "lifetime") throw new ApiError(400, "Lifetime access cannot be cancelled.")

  if (stripe && sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true })
  }
  await prisma.subscription.update({ where: { userId }, data: { status: "cancelled" } })
  await pauseListingsForLapse(userId)
  await logAudit({ actorId: userId, action: "SUBSCRIPTION_CANCELLED", subject: "Cancelled subscription" })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } })
  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Your UnSwap membership is cancelled",
      html: renderEmail({
        heading: "Membership cancelled",
        body: `<p>Hello ${esc(user.firstName)},</p><p>Your membership won't renew. You'll keep access until the end of the current period. You can resubscribe any time.</p>`,
        ctaLabel: "View membership",
        ctaUrl: `${baseUrl()}/dashboard/subscription`,
      }),
    }).catch((e) => console.error("Cancel email failed:", e))
  }
  return { ok: true }
}

/** Apply a verified Stripe webhook event to our subscription state. */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as any
      const userId = s.metadata?.userId
      const tier = s.metadata?.tier
      if (userId && isTierKey(tier)) {
        await activateSubscription(userId, tier, typeof s.subscription === "string" ? s.subscription : null)
      }
      break
    }
    case "invoice.payment_succeeded": {
      const inv = event.data.object as any
      const subId = inv.subscription
      if (typeof subId === "string") {
        const sub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } })
        if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: "active", renewsAt: new Date(Date.now() + YEAR_MS) } })
      }
      break
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as any
      const subId = inv.subscription
      if (typeof subId === "string") {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
          include: { user: { select: { email: true, firstName: true } } },
        })
        if (sub) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: "past_due" } })
          await pauseListingsForLapse(sub.userId)
          await sendEmail({
            to: sub.user.email,
            subject: "Action needed: your UnSwap payment didn't go through",
            html: renderEmail({
              heading: "Payment unsuccessful",
              body: `<p>Hello ${esc(sub.user.firstName)},</p><p>We couldn't process your latest membership payment. Please update your payment method to keep your access. Your membership stays active during a short grace period.</p>`,
              ctaLabel: "Update billing",
              ctaUrl: `${baseUrl()}/dashboard/subscription`,
            }),
          }).catch((e) => console.error("Dunning email failed:", e))
        }
      }
      break
    }
    case "customer.subscription.deleted": {
      const s = event.data.object as any
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: s.id },
        include: { user: { select: { email: true, firstName: true } } },
      })
      if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: "cancelled" } })
        await pauseListingsForLapse(sub.userId)
        await sendEmail({
          to: sub.user.email,
          subject: "Your UnSwap membership has been cancelled",
          html: renderEmail({
            heading: "Membership cancelled",
            body: `<p>Hello ${esc(sub.user.firstName)},</p><p>Your membership has been cancelled and won't renew. You're always welcome back to the network.</p>`,
            ctaLabel: "Rejoin UnSwap",
            ctaUrl: `${baseUrl()}/dashboard/subscription`,
          }),
        }).catch((e) => console.error("Cancellation email failed:", e))
      }
      break
    }
  }
}
