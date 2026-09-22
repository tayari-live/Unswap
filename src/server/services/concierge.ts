import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail, esc } from "@/server/email"
import { logAudit } from "@/server/services/audit"
import { anthropic, AI_MODEL, textOf } from "@/server/ai"
import { conciergeEligibility } from "@/server/services/trust"
import { MIN_SCORE_CONCIERGE } from "@/lib/trust"

const TEAM_EMAIL = process.env.SUPPORT_EMAIL || "hello@unswap.net"
const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"

const CATEGORIES = ["Housing", "Schools & Family", "Logistics", "Local Setup", "General"] as const
const PRIORITIES = ["high", "medium", "low"] as const

export type ConciergeInput = { destination: string; timeframe?: string; needs: string }
type Triage = { category: string; priority: string; summary: string; nextSteps: string }

/** Deterministic triage used whenever the AI agent is unavailable. */
function fallbackTriage(input: ConciergeInput): Triage {
  return {
    category: "General",
    priority: "medium",
    summary: input.needs.replace(/\s+/g, " ").trim().slice(0, 140),
    nextSteps: "A relocation concierge will review this request and follow up with tailored options.",
  }
}

/** Ask Claude to triage the lead into category/priority/summary/next steps. */
async function triageConciergeLead(input: ConciergeInput, member: { fullName: string; organisation: string | null }): Promise<Triage> {
  const system = `You triage Relocation Concierge requests for UnSwap, a verified home-exchange network for UN/IO professionals. Classify the request and draft a short internal brief for the concierge team.

RULES:
- category: exactly one of ${CATEGORIES.join(", ")}.
- priority: one of high, medium, low. High = imminent move (weeks) or family/schooling with a hard deadline; medium = a planned move in the coming months; low = exploratory or far off.
- summary: one sentence (<= 160 chars) capturing the ask.
- nextSteps: one or two concrete first actions for the concierge (<= 200 chars).
- Do NOT invent facts, prices, providers, or legal/visa/tax advice.

Return ONLY JSON: {"category":"...","priority":"...","summary":"...","nextSteps":"..."}. No prose, no code fences.`

  const facts = {
    member: member.fullName,
    organisation: member.organisation ?? null,
    destination: input.destination,
    timeframe: input.timeframe ?? null,
    needs: input.needs.slice(0, 1200),
  }

  const message = await anthropic().messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: `Request:\n${JSON.stringify(facts, null, 2)}` }],
  })

  const raw = textOf(message)
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("no JSON object in AI response")
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<Triage>

  const category = CATEGORIES.includes(parsed.category as (typeof CATEGORIES)[number]) ? parsed.category! : "General"
  const priority = PRIORITIES.includes(parsed.priority as (typeof PRIORITIES)[number]) ? parsed.priority! : "medium"
  const summary = (typeof parsed.summary === "string" && parsed.summary.trim()) || fallbackTriage(input).summary
  const nextSteps = (typeof parsed.nextSteps === "string" && parsed.nextSteps.trim()) || fallbackTriage(input).nextSteps
  return { category, priority, summary: summary.slice(0, 200), nextSteps: nextSteps.slice(0, 240) }
}

/**
 * Create a Relocation Concierge request: gate on eligibility, triage it (AI with
 * a static fallback), store it, and route it to the team by email.
 */
export async function requestConcierge(userId: string, input: ConciergeInput) {
  const destination = input.destination?.trim()
  const needs = input.needs?.trim()
  if (!destination) throw new ApiError(400, "Where are you relocating to?")
  if (!needs || needs.length < 10) throw new ApiError(400, "Tell us a little about what you need help with.")

  const { eligible, score } = await conciergeEligibility(userId)
  if (!eligible) {
    throw new ApiError(403, `Relocation Concierge unlocks at a trust score of ${MIN_SCORE_CONCIERGE}. You're at ${score} — get fully verified and complete a few exchanges to reach it.`)
  }

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, firstName: true, email: true, organisation: true },
  })
  if (!member) throw new ApiError(404, "Account not found.")

  const clean: ConciergeInput = { destination, timeframe: input.timeframe?.trim() || undefined, needs }

  let triage: Triage
  try {
    triage = await triageConciergeLead(clean, member)
  } catch (err) {
    console.error("Concierge triage failed; using fallback:", (err as Error)?.message ?? err)
    triage = fallbackTriage(clean)
  }

  const lead = await prisma.conciergeLead.create({
    data: {
      memberId: userId,
      destination,
      timeframe: clean.timeframe,
      needs,
      category: triage.category,
      priority: triage.priority,
      summary: triage.summary,
      nextSteps: triage.nextSteps,
      trustScore: score,
    },
  })

  // Route the triaged lead to the team.
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `Concierge lead [${triage.priority.toUpperCase()} · ${triage.category}] — ${member.fullName}`,
    html: renderEmail({
      heading: "New Relocation Concierge request",
      preheader: triage.summary,
      body: `<p style="margin:0 0 12px"><strong>${esc(member.fullName)}</strong>${member.organisation ? ` (${esc(member.organisation)})` : ""} · trust ${score}</p>
             <p style="margin:0 0 6px"><strong>Priority:</strong> ${esc(triage.priority)} &nbsp; <strong>Category:</strong> ${esc(triage.category)}</p>
             <p style="margin:0 0 6px"><strong>Destination:</strong> ${esc(destination)}${clean.timeframe ? ` &nbsp; <strong>Timeframe:</strong> ${esc(clean.timeframe)}` : ""}</p>
             <p style="margin:12px 0 4px"><strong>Summary:</strong> ${esc(triage.summary)}</p>
             <p style="margin:0 0 12px"><strong>Suggested next steps:</strong> ${esc(triage.nextSteps)}</p>
             <p style="margin:0;padding-left:12px;border-left:2px solid #e3d8b8;color:#2b3242">${esc(needs)}</p>`,
      ctaLabel: "Open the console",
      ctaUrl: `${baseUrl()}/overview`,
    }),
    text: `New concierge lead — ${member.fullName} (trust ${score})\nPriority: ${triage.priority} · Category: ${triage.category}\nDestination: ${destination}${clean.timeframe ? ` · ${clean.timeframe}` : ""}\nSummary: ${triage.summary}\nNext steps: ${triage.nextSteps}\n\n${needs}`,
  })

  await logAudit({
    action: "CONCIERGE_LEAD_CREATED",
    subject: `Concierge lead from ${member.fullName}`,
    metadata: { email: member.email, priority: triage.priority, category: triage.category, destination },
  })

  return { ok: true, priority: triage.priority, category: triage.category, summary: triage.summary, id: lead.id }
}

/** The member's own concierge requests, newest first. */
export function listMemberConciergeLeads(userId: string) {
  return prisma.conciergeLead.findMany({
    where: { memberId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, destination: true, timeframe: true, category: true, priority: true, summary: true, status: true, createdAt: true },
  })
}
