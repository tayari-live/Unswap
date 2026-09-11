import { NextRequest, NextResponse } from "next/server"
import { requireSession, toErrorResponse, ApiError } from "@/server/http"
import { prisma } from "@/server/prisma"
import { sendEmail, emailConfigured, esc } from "@/server/email"

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "hello@unswap.net"

type ChatMessage = { role: "user" | "assistant"; content: string }

// POST /api/ai/assistant/escalate — hand a conversation with Vera to a human.
// Emails the support inbox the member's identity plus the transcript, so the
// team can follow up by replying to the member's address.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const userId = (session.user as any).id as string
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    })
    if (!user) throw new ApiError(401, "Unauthorized")

    const body = await req.json().catch(() => ({}))
    const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []

    const clean = history
      .filter(
        (m): m is ChatMessage =>
          !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && !!m.content.trim(),
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

    const who = (role: "user" | "assistant") => (role === "user" ? user.fullName || "Member" : "Vera")

    const transcriptHtml = clean.length
      ? clean
          .map((m) => `<p style="margin:0 0 10px"><strong>${esc(who(m.role))}:</strong> ${esc(m.content)}</p>`)
          .join("")
      : `<p style="margin:0 0 10px;color:#6b7689">No conversation yet — the member asked to reach a person directly.</p>`

    const transcriptText = clean.length
      ? clean.map((m) => `${who(m.role)}: ${m.content}`).join("\n\n")
      : "No conversation yet — the member asked to reach a person directly."

    const sent = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `Help request from ${user.fullName || user.email}`,
      html: `<p style="margin:0 0 6px"><strong>Member:</strong> ${esc(user.fullName || "")} &lt;${esc(user.email)}&gt;</p>
             <p style="margin:16px 0 8px;font-weight:bold">Conversation with Vera</p>
             ${transcriptHtml}
             <p style="margin:18px 0 0;color:#6b7689">Reply to ${esc(user.email)} to reach the member.</p>`,
      text:
        `Member: ${user.fullName || ""} <${user.email}>\n\n` +
        `Conversation with Vera:\n${transcriptText}\n\n` +
        `Reply to ${user.email} to reach the member.`,
    })

    // In production a false return means a real send failed (not just "no token
    // configured in dev"); surface it so the member can fall back to email.
    if (!sent && emailConfigured()) {
      throw new ApiError(502, "We couldn't reach the team just now. Please email hello@unswap.net.")
    }

    return NextResponse.json({ ok: true, email: user.email })
  } catch (err) {
    return toErrorResponse(err)
  }
}
