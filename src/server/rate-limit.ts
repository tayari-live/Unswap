import { NextRequest } from "next/server"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"

/**
 * Fixed-window rate limiting for the public endpoints that send email.
 *
 * These routes are unauthenticated and each one dispatches mail, so without a
 * limit anyone can loop them to bomb a member's inbox, burn the Resend quota,
 * and damage sender reputation — which in turn pushes legitimate mail to spam.
 *
 * Backed by Postgres rather than an external store: the routes already query
 * the database, the count is a single indexed statement, and a rejected request
 * ends up cheaper than an accepted one because it never reaches the send. It
 * also stays correct across serverless instances, which in-memory counters do
 * not — each instance would keep its own tally and the real limit would be
 * whatever the limit is multiplied by however many instances are warm.
 */

/**
 * Best-effort client IP. On Vercel the platform sets x-forwarded-for and the
 * left-most entry is the client; the header is spoofable in general, so this is
 * paired with a per-identifier limit rather than relied on alone.
 */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Count one hit against `key`. Returns ok:false once `limit` is exceeded
 * within `windowSeconds`.
 *
 * The insert and the increment are one statement so two concurrent requests
 * cannot both read the same count and each write limit+1.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, now() + ${`${windowSeconds} seconds`}::interval)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."expiresAt" < now() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "RateLimit"."expiresAt" < now()
            THEN now() + ${`${windowSeconds} seconds`}::interval
          ELSE "RateLimit"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `
    const row = rows[0]
    if (!row) return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 1000),
    )
    return {
      ok: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      retryAfterSeconds,
    }
  } catch (err) {
    // Fail open: a limiter outage must not take signup and password reset down
    // with it. The endpoints remain guarded by their own validation.
    console.error("Rate limit check failed, allowing request:", err)
    return { ok: true, remaining: limit, retryAfterSeconds: 0 }
  }
}

/**
 * Apply a limit and throw 429 when it is exceeded.
 *
 * `scope` names the endpoint, `identifier` is what is being limited (an IP, or
 * an email so one address cannot be targeted from many IPs).
 */
export async function enforceRateLimit(opts: {
  scope: string
  identifier: string
  limit: number
  windowSeconds: number
  message?: string
}) {
  const { scope, identifier, limit, windowSeconds, message } = opts
  const result = await rateLimit(`${scope}:${identifier.toLowerCase()}`, limit, windowSeconds)
  if (!result.ok) {
    const mins = Math.ceil(result.retryAfterSeconds / 60)
    throw new ApiError(
      429,
      message ??
        `Too many attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
    )
  }
  return result
}

/** Drop expired windows. Called from the cron job so the table stays small. */
export async function pruneRateLimits() {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return { rateLimitsPruned: count }
}
