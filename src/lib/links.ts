/*
 * Every outbound destination in one place.
 *
 * The marketing site is a front door onto the application, and the routes it
 * points at live there (/register, /about, /login). Keeping them here means
 * porting this page into the app — or moving the app behind a different path —
 * is a single edit rather than a search across fourteen sections.
 *
 * "Request access", never "Join" or "Sign up": the network is closed and
 * verified, and the label should say so before anyone reaches the form.
 */
export const REQUEST_ACCESS = "/register";
export const LOGIN = "/login";
export const ABOUT = "/about";
export const PRIVACY = "/privacy";
export const TERMS = "/terms";
export const EXCHANGE_AGREEMENT = "/terms#exchange-agreement";

/** In-page anchors, so the nav and footer cannot drift apart. */
export const SECTIONS = {
  howItWorks: "#how-it-works",
  explore: "#explore",
  membership: "#membership",
  trust: "#trust",
  faq: "#faq",
} as const;
