// Feature flags.
//
// Membership / billing is hidden from members until Stripe payments are wired
// up. Flip MEMBERSHIP_ENABLED back to true to restore the subscription nav
// entries and the "activate your membership" onboarding step.
// Tracking: https://github.com/tayari-live/Unswap/issues/2
export const MEMBERSHIP_ENABLED = false
