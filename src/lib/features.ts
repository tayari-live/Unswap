// Feature flags.
//
// Membership / billing goes live when NEXT_PUBLIC_MEMBERSHIP_ENABLED is set to
// "true" (do this once Stripe keys + the 5 price IDs are configured). It gates
// both the UI (subscription nav, the "activate membership" onboarding step) and
// the server-side requirement that a swap confirmation needs an active
// subscription. Off by default so nothing is charged until you flip it.
// NEXT_PUBLIC_* is inlined at build time, so changing it needs a redeploy.
export const MEMBERSHIP_ENABLED = process.env.NEXT_PUBLIC_MEMBERSHIP_ENABLED === "true"
