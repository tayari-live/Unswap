import { NextResponse } from "next/server"
import { auth } from "@/server/auth"

/**
 * Thrown by service-layer code for expected, client-facing failures.
 * Route handlers convert these to JSON responses via `toErrorResponse`.
 */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

/** Map any thrown value to a NextResponse. ApiError keeps its status/message. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error("Unhandled API error:", err)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

/** Require any authenticated user. Returns the session; throws 401 otherwise. */
export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized")
  }
  return session
}

/** Require an admin user. Returns the session; throws 401/403 otherwise. */
export async function requireAdmin() {
  const session = await requireSession()
  if ((session.user as any).role !== "admin") {
    throw new ApiError(403, "Forbidden")
  }
  return session
}
