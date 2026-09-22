import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { decryptField } from "@/server/crypto"
import { anthropic, AI_MODEL, textOf } from "@/server/ai"

const NAVY = rgb(0.043, 0.122, 0.227) // #0B1F3A
const GOLD = rgb(0.788, 0.659, 0.298) // #C9A84C
const INK = rgb(0.227, 0.263, 0.341) // #3A4357
const MUTED = rgb(0.42, 0.46, 0.54)

const EXCHANGE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

type Clause = { heading: string; text: string }

// Fallback terms used verbatim whenever the AI draft is unavailable (no API
// key, rate limit, outage, or a malformed response), so an agreement always
// renders with sound, if generic, terms.
const STATIC_CLAUSES: Clause[] = [
  { heading: "Verified Members", text: "Both members confirm their UN/IO professional status has been verified by UnSwap." },
  { heading: "Care of the Home", text: "Each party will treat the other's home with care, honour the agreed dates, and leave the property in the condition in which it was received." },
  { heading: "Cancellations", text: "Cancellations must be communicated promptly through the UnSwap platform." },
  { heading: "No Monetary Rent", text: "This agreement records a peer exchange of accommodation; no monetary rent is payable between the parties. Property protection applies in accordance with each member's UnSwap membership tier." },
]

type AgreementSwap = {
  mode: string
  guests: number
  startDate: Date
  endDate: Date
  pointsPerNight: number | null
  agreementClauses: string | null
  listing: { city: string | null; country: string | null; propertyType: string; houseRules: string | null }
}

/** Validate a stored/parsed value into a clean Clause[] (empty if unusable). */
function coerceClauses(value: unknown): Clause[] {
  if (!Array.isArray(value)) return []
  const out: Clause[] = []
  for (const it of value) {
    const c = it as { heading?: unknown; text?: unknown }
    if (!c || typeof c.heading !== "string" || typeof c.text !== "string") continue
    const heading = c.heading.trim().slice(0, 40)
    const text = c.text.trim().slice(0, 320)
    if (heading && text) out.push({ heading, text })
    if (out.length >= 5) break
  }
  return out
}

/** Draft exchange-specific terms with Claude. Throws on any failure/empty result. */
async function generateAgreementClauses(swap: AgreementSwap): Promise<Clause[]> {
  const nights = Math.max(0, Math.round((swap.endDate.getTime() - swap.startDate.getTime()) / 86_400_000))
  // Only non-sensitive exchange facts — never the address or emergency contact.
  const facts = {
    mode: swap.mode === "points" ? "non-simultaneous (settled in UnSwap Points)" : "simultaneous exchange",
    nights,
    guests: swap.guests,
    location: [swap.listing.city, swap.listing.country].filter(Boolean).join(", ") || "the host's city",
    propertyType: swap.listing.propertyType,
    pointsTotal: swap.mode === "points" && swap.pointsPerNight ? swap.pointsPerNight * nights : null,
    houseRules: swap.listing.houseRules ? swap.listing.houseRules.slice(0, 400) : null,
  }

  const system = `You draft the "Terms" clauses of a peer home-exchange agreement for UnSwap, a verified network for UN, World Bank, IMF and international-organisation professionals. Write concise, plain-English clauses tailored to the specific exchange described.

RULES:
- This is a peer exchange of accommodation: NO monetary rent passes between the parties.
- Both members are verified UN/IO professionals.
- Do NOT give legal, tax, visa, insurance, or financial advice. Do NOT invent guarantee amounts, fees, penalties, or dollar figures. Do NOT invent obligations a home swap would not imply.
- Refer to the UnSwap platform and membership-tier property protection only in general terms.
- If the mode is settled in UnSwap Points, include one clause stating the stay is settled in points (state the total if provided), not cash.
- If house rules are provided, include one clause on adhering to them.
- At most 5 clauses. Each heading is at most 4 words. Each clause text is 1-2 sentences and at most 240 characters.

Return ONLY a JSON array like [{"heading":"...","text":"..."}]. No prose, no code fences.`

  const message = await anthropic().messages.create({
    model: AI_MODEL,
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: `Exchange facts:\n${JSON.stringify(facts, null, 2)}` }],
  })

  const raw = textOf(message)
  const start = raw.indexOf("[")
  const end = raw.lastIndexOf("]")
  if (start === -1 || end === -1) throw new Error("no JSON array in AI response")
  const clauses = coerceClauses(JSON.parse(raw.slice(start, end + 1)))
  if (!clauses.length) throw new Error("AI returned no usable clauses")
  return clauses
}

/**
 * Resolve the agreement's terms: reuse the stored draft if present, otherwise
 * generate once with Claude and persist it (so the document is stable across
 * downloads). Any failure falls back to the static terms without persisting.
 */
async function resolveClauses(swap: AgreementSwap, swapId: string): Promise<Clause[]> {
  if (swap.agreementClauses) {
    try {
      const stored = coerceClauses(JSON.parse(swap.agreementClauses))
      if (stored.length) return stored
    } catch {
      /* fall through and regenerate */
    }
  }
  try {
    const generated = await generateAgreementClauses(swap)
    await prisma.swapRequest.update({ where: { id: swapId }, data: { agreementClauses: JSON.stringify(generated) } })
    return generated
  } catch (err) {
    console.error("Agreement clause generation failed; using static terms:", (err as Error)?.message ?? err)
    return STATIC_CLAUSES
  }
}

/**
 * Generate the Swap Agreement PDF for a confirmed exchange. Only a participant
 * (host or requester) may download it. Terms are drafted per-exchange by Claude
 * (with a static fallback) and reused once generated.
 */
export async function buildAgreementPdf(userId: string, swapId: string): Promise<Uint8Array> {
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    include: {
      listing: true,
      host: { select: { fullName: true, organisation: true, email: true } },
      requester: { select: { fullName: true, organisation: true, email: true } },
    },
  })
  if (!swap) throw new ApiError(404, "Exchange not found.")
  if (swap.hostId !== userId && swap.requesterId !== userId) throw new ApiError(403, "You are not part of this exchange.")
  if (!EXCHANGE_STATUSES.includes(swap.status)) throw new ApiError(409, "An agreement is available only for confirmed exchanges.")

  const nights = Math.max(0, Math.round((swap.endDate.getTime() - swap.startDate.getTime()) / 86_400_000))
  const clauses = await resolveClauses(swap, swapId)

  const doc = await PDFDocument.create()
  const A4: [number, number] = [595.28, 841.89]
  let page = doc.addPage(A4)
  const { width, height } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const M = 56

  // Header band (first page only)
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: NAVY })
  page.drawText("UnSwap", { x: M, y: height - 52, size: 22, font: bold, color: rgb(1, 1, 1) })
  page.drawText("Home Exchange Agreement", { x: M, y: height - 74, size: 12, font, color: GOLD })

  let y = height - 140

  // Start a fresh page and continue when the content would run off the bottom.
  const newPage = () => { page = doc.addPage(A4); y = height - 72 }
  const ensure = (need: number) => { if (y - need < 56) newPage() }

  const heading = (t: string) => {
    ensure(40)
    page.drawText(t.toUpperCase(), { x: M, y, size: 10, font: bold, color: GOLD })
    y -= 6
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.75, color: rgb(0.89, 0.91, 0.93) })
    y -= 18
  }
  const row = (label: string, value: string) => {
    ensure(24)
    page.drawText(label, { x: M, y, size: 10, font, color: MUTED })
    page.drawText(value || "—", { x: M + 150, y, size: 10.5, font: bold, color: INK })
    y -= 20
  }
  const para = (t: string) => {
    const words = t.split(" ")
    let line = ""
    const max = 78
    const flush = () => { ensure(16); page.drawText(line, { x: M, y, size: 9.5, font, color: INK }); y -= 14 }
    for (const w of words) {
      if ((line + " " + w).length > max) { flush(); line = w }
      else line = line ? `${line} ${w}` : w
    }
    if (line) flush()
  }

  heading("Parties")
  row("Host", `${swap.host.fullName}${swap.host.organisation ? ` (${swap.host.organisation})` : ""}`)
  row("Guest", `${swap.requester.fullName}${swap.requester.organisation ? ` (${swap.requester.organisation})` : ""}`)
  y -= 6

  heading("Property")
  row("Home", swap.listing.title)
  row("Location", [swap.listing.neighbourhood, swap.listing.city, swap.listing.country].filter(Boolean).join(", "))
  row("Type", `${swap.listing.propertyType} · ${swap.listing.bedrooms} bed · ${swap.listing.bathrooms} bath`)
  // Full address is decrypted and disclosed only in the confirmed agreement.
  const address = decryptField(swap.listing.fullAddressEnc)
  if (address) row("Full address", address)
  if (swap.listing.houseRules) { y -= 2; para(`House rules: ${swap.listing.houseRules}`) }
  y -= 6

  // Emergency contact — decrypted, disclosed only to the confirmed partner.
  const emName = decryptField(swap.listing.emergencyNameEnc)
  const emPhone = decryptField(swap.listing.emergencyPhoneEnc)
  const emRel = decryptField(swap.listing.emergencyRelationEnc)
  if (emName || emPhone) {
    heading("Emergency contact")
    if (emName) row("Name", emRel ? `${emName} (${emRel})` : emName)
    if (emPhone) row("Phone", emPhone)
    y -= 6
  }

  heading("Exchange details")
  row("Dates", `${fmt(swap.startDate)} – ${fmt(swap.endDate)}`)
  row("Duration", `${nights} night${nights === 1 ? "" : "s"}`)
  row("Guests", String(swap.guests))
  row("Mode", swap.mode === "points" ? "Non-simultaneous (UnSwap Points)" : "Simultaneous exchange")
  row("Status", swap.status.replace("_", " "))
  y -= 6

  heading("Terms")
  for (const c of clauses) {
    ensure(34)
    page.drawText(c.heading, { x: M, y, size: 10, font: bold, color: INK })
    y -= 14
    para(c.text)
    y -= 8
  }

  // Signatures
  ensure(60)
  y -= 16
  const colW = (width - M * 2 - 30) / 2
  const sig = (x: number, name: string) => {
    page.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 0.75, color: rgb(0.7, 0.73, 0.78) })
    page.drawText(name, { x, y: y - 14, size: 9, font, color: MUTED })
  }
  sig(M, `Host: ${swap.host.fullName}`)
  sig(M + colW + 30, `Guest: ${swap.requester.fullName}`)

  // Footer on the final page
  page.drawText(
    `Generated ${fmt(new Date())} · UnSwap is an independent, staff-led platform, not affiliated with the United Nations.`,
    { x: M, y: 40, size: 7.5, font, color: MUTED }
  )

  return doc.save()
}
