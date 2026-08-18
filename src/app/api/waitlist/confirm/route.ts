import { NextRequest, NextResponse } from "next/server"
import { confirmWaitlist } from "@/server/services/waitlist"
import { beginPasswordlessMember } from "@/server/services/registration"

const base = () => process.env.AUTH_URL || "http://localhost:3000"

// GET /api/waitlist/confirm?token=… — the emailed "add your property" link.
// Finalizes the waitlist entry (credits the referrer, syncs Kit). The click
// proves the person owns this inbox, so we create their account already
// email-verified but WITHOUT a password, mint a one-time sign-in token, and hand
// off to /continue → onboarding → adding a property. The password comes later.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  try {
    const result = await confirmWaitlist(token)

    // Re-click on an already-used link: the account exists, so don't error and
    // don't silently re-issue a sign-in link (a magic link shouldn't work
    // forever). Send them to sign in, email prefilled, with a gentle notice.
    if (result.alreadyConfirmed) {
      const url = new URL("/login", base())
      url.searchParams.set("email", result.email)
      url.searchParams.set("notice", "already-confirmed")
      return NextResponse.redirect(url)
    }

    const loginToken = await beginPasswordlessMember({
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    })
    const url = new URL("/continue", base())
    url.searchParams.set("token", loginToken)
    return NextResponse.redirect(url)
  } catch {
    const url = new URL("/waitlist", base())
    url.searchParams.set("error", "This confirmation link is invalid or has already been used.")
    return NextResponse.redirect(url)
  }
}
