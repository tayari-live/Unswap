import { NextRequest, NextResponse } from "next/server"
import { confirmWaitlist } from "@/server/services/waitlist"
import { beginPasswordlessMember } from "@/server/services/registration"

const base = () => process.env.AUTH_URL || "http://localhost:3000"

// The emailed "add your property" link. Clicking it proves the person owns the
// inbox, which is what lets us create their account already email-verified,
// without a password, and drop them into onboarding.
//
// The state changes (confirming the entry, crediting the referrer, creating the
// member, minting a sign-in token) happen on POST only — triggered by a human
// tapping the button on /continue. A plain GET, which mail apps and security
// scanners (Safe Links, Proofpoint, Mimecast) fire to vet the link, must never
// mutate: it would confirm the entry and burn the single-use flow before the
// person ever clicks. So GET just hands off to the read-only interstitial.

// GET /api/waitlist/confirm?token=… — kept for links already sitting in inboxes.
// Newer invite emails point straight at /continue?ct=…; either way, nothing
// changes here.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  const url = new URL("/continue", base())
  if (token) url.searchParams.set("ct", token)
  return NextResponse.redirect(url)
}

// POST /api/waitlist/confirm { token } — the actual confirmation, run from the
// /continue button. Returns JSON so the page can sign the member in (new
// confirm) or send them to log in (already confirmed) without a full reload.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token : ""
    const result = await confirmWaitlist(token)

    // Re-click on an already-used link: the account exists, so don't error and
    // don't silently re-issue a sign-in link (a magic link shouldn't work
    // forever). Send them to sign in, email prefilled.
    if (result.alreadyConfirmed) {
      return NextResponse.json({ status: "already-confirmed", email: result.email })
    }

    const loginToken = await beginPasswordlessMember({
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    })
    return NextResponse.json({ status: "ready", loginToken })
  } catch {
    return NextResponse.json(
      { error: "This confirmation link is invalid or has already been used." },
      { status: 400 },
    )
  }
}
