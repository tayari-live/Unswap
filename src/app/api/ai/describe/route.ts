import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { anthropic, AI_MODEL, textOf, toFriendlyAIError } from "@/server/ai"

const SYSTEM = `You write listing descriptions for UnSwap, a verified home-exchange network for UN and international organisation professionals on rotation.

Write a warm, factual description of the member's home in the host's first-person voice ("our apartment", "you'll find").

Rules:
- 120–180 words, two or three short paragraphs, no headings, no emoji, no markdown.
- Use ONLY the facts provided. Never invent amenities, views, distances, or neighbourhood details that were not given.
- If the member wrote notes or a draft, honour their content and tone; polish rather than replace.
- Mention what makes the home practical for professionals on assignment (workspace, transport, longer stays) only when the facts support it.
- Return the description text only — no preamble.`

// POST /api/ai/describe — draft a listing description from wizard facts.
export async function POST(req: NextRequest) {
  try {
    await requireSession()
    const b = await req.json()

    const facts = [
      b.title && `Title: ${b.title}`,
      b.propertyType && `Property type: ${b.propertyType}`,
      (b.city || b.country) && `Location: ${[b.neighbourhood, b.city, b.country].filter(Boolean).join(", ")}`,
      b.bedrooms && `Bedrooms: ${b.bedrooms}`,
      b.bathrooms && `Bathrooms: ${b.bathrooms}`,
      b.maxGuests && `Sleeps up to: ${b.maxGuests}`,
      Array.isArray(b.amenities) && b.amenities.length > 0 && `Amenities: ${b.amenities.join(", ")}`,
      typeof b.notes === "string" && b.notes.trim() && `Host's notes / draft:\n${b.notes.trim().slice(0, 2000)}`,
    ]
      .filter(Boolean)
      .join("\n")

    if (!facts) throw new ApiError(400, "Add a few details first so the AI has something to work with.")

    let message
    try {
      message = await anthropic().messages.create({
        model: AI_MODEL,
        max_tokens: 512,
        system: SYSTEM,
        messages: [{ role: "user", content: `Write the listing description.\n\n${facts}` }],
      })
    } catch (err) {
      throw toFriendlyAIError(err)
    }

    const description = textOf(message)
    if (!description) throw new ApiError(502, "The AI couldn't draft a description. Please try again.")
    return NextResponse.json({ description })
  } catch (err) {
    return toErrorResponse(err)
  }
}
