import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Expose the current pathname to server components (the member layout reads it
// via `headers()`), so the setup-gating chain there can exempt the exact page it
// redirects to (e.g. /dashboard/listings/new) without redirect loops.
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
