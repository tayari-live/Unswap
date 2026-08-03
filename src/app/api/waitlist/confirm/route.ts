import { NextRequest, NextResponse } from "next/server"
import { confirmWaitlist } from "@/server/services/waitlist"

const base = () => process.env.AUTH_URL || "http://localhost:3000"

// GET /api/waitlist/confirm?token=… — step 2 of double opt-in. Finalizes the
// entry, then redirects to the share page with the member's referral code.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  try {
    const result = await confirmWaitlist(token)
    const url = new URL("/waitlist/success", base())
    url.searchParams.set("ref", result.referralCode)
    return NextResponse.redirect(url)
  } catch {
    const url = new URL("/waitlist", base())
    url.searchParams.set("error", "This confirmation link is invalid or has already been used.")
    return NextResponse.redirect(url)
  }
}
