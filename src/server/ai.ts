import Anthropic from "@anthropic-ai/sdk"
import { ApiError } from "@/server/http"

// Claude Haiku powers the in-app AI features: fast and cost-effective for
// short copywriting and app-guide answers.
export const AI_MODEL = "claude-haiku-4-5"

let client: Anthropic | null = null

/** Shared Anthropic client. Throws a friendly 503 when no key is configured. */
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ApiError(503, "AI features are not configured yet. Set ANTHROPIC_API_KEY to enable them.")
  }
  if (!client) client = new Anthropic()
  return client
}

/** First text block of a response, trimmed. */
export function textOf(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text")
  return block && block.type === "text" ? block.text.trim() : ""
}

/**
 * Map Anthropic API failures (billing, auth, rate limits, outages) to a
 * friendly client-facing error instead of a raw 500. The real cause is logged
 * server-side for the operator.
 */
export function toFriendlyAIError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (err instanceof Anthropic.APIError) {
    console.error(`Anthropic API error (${err.status}):`, err.message)
    if (err.status === 429) {
      return new ApiError(503, "The assistant is a little busy right now — please try again in a moment.")
    }
    // 400 insufficient credits, 401/403 bad key, 5xx outages — all read the
    // same to a member: the feature is temporarily unavailable.
    return new ApiError(503, "AI features are temporarily unavailable. Please try again later.")
  }
  console.error("Unexpected AI error:", err)
  return new ApiError(503, "AI features are temporarily unavailable. Please try again later.")
}
