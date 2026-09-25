import { NextResponse } from "next/server"
import { auth } from "@/server/auth"

/**
 * Thrown by service-layer code for expected, client-facing failures.
 * Route handlers convert these to JSON responses via `toErrorResponse`.
 */
export class ApiError extends Error {
  status: number
  /** Optional machine-readable code so the client can branch (e.g. show a modal). */
  code?: string
  /** Optional structured payload for the client (e.g. tier + limit for an upsell). */
  data?: Record<string, unknown>
  constructor(status: number, message: string, code?: string, data?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
    this.name = "ApiError"
  }
}

/** Map any thrown value to a NextResponse. ApiError keeps its status/message. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.data ? { data: err.data } : {}) },
      { status: err.status },
    )
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
