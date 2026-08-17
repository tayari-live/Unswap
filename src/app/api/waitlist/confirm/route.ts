import { NextRequest, NextResponse } from "next/server"
import { confirmWaitlist } from "@/server/services/waitlist"

const base = () => process.env.AUTH_URL || "http://localhost:3000"

// GET /api/waitlist/confirm?token=… — the emailed "add your property" link.
// Finalizes the waitlist entry (credits the referrer, syncs Kit), then hands
// off to registration. The click proves the person owns this inbox, so it also
// mints a short-lived grant that lets /register skip its own email verification
// and drop them straight into onboarding → adding their property.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  try {
    const result = await confirmWaitlist(token)
    const url = new URL("/register", base())
    url.searchParams.set("email", result.email)
    url.searchParams.set("name", `${result.firstName} ${result.lastName}`.trim())
    url.searchParams.set("grant", result.registerGrant)
    url.searchParams.set("next", "/dashboard/listings/new")
    return NextResponse.redirect(url)
  } catch {
    const url = new URL("/waitlist", base())
    url.searchParams.set("error", "This confirmation link is invalid or has already been used.")
    return NextResponse.redirect(url)
  }
}
