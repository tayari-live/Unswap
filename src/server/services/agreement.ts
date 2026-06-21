import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { decryptField } from "@/server/crypto"

const NAVY = rgb(0.043, 0.122, 0.227) // #0B1F3A
const GOLD = rgb(0.788, 0.659, 0.298) // #C9A84C
const INK = rgb(0.227, 0.263, 0.341) // #3A4357
const MUTED = rgb(0.42, 0.46, 0.54)

const EXCHANGE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

/**
 * Generate the Swap Agreement PDF for a confirmed exchange. Only a participant
 * (host or requester) may download it.
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

  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const M = 56

  // Header band
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: NAVY })
  page.drawText("UnSwap", { x: M, y: height - 52, size: 22, font: bold, color: rgb(1, 1, 1) })
  page.drawText("Home Exchange Agreement", { x: M, y: height - 74, size: 12, font, color: GOLD })

  let y = height - 140

  const heading = (t: string) => {
    page.drawText(t.toUpperCase(), { x: M, y, size: 10, font: bold, color: GOLD })
    y -= 6
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.75, color: rgb(0.89, 0.91, 0.93) })
    y -= 18
  }
  const row = (label: string, value: string) => {
    page.drawText(label, { x: M, y, size: 10, font, color: MUTED })
    page.drawText(value || "—", { x: M + 150, y, size: 10.5, font: bold, color: INK })
    y -= 20
  }
  const para = (t: string) => {
    const words = t.split(" ")
    let line = ""
    const max = 78
    for (const w of words) {
      if ((line + " " + w).length > max) {
        page.drawText(line, { x: M, y, size: 9.5, font, color: INK })
        y -= 14
        line = w
      } else line = line ? `${line} ${w}` : w
    }
    if (line) { page.drawText(line, { x: M, y, size: 9.5, font, color: INK }); y -= 14 }
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
  row("Mode", swap.mode === "credits" ? "Non-simultaneous (UnSwap Credits)" : "Simultaneous exchange")
  row("Status", swap.status.replace("_", " "))
  y -= 6

  heading("Terms")
  para(
    "Both members confirm their UN/IO professional status has been verified by UnSwap. Each party agrees to treat the other's home with care, honour the agreed dates, and leave the property in the condition in which it was received. Cancellations must be communicated promptly via the UnSwap platform."
  )
  y -= 4
  para(
    "Property protection applies in accordance with each member's UnSwap membership tier. This agreement records a peer exchange of accommodation; no monetary rent is payable between the parties."
  )

  // Signatures
  y -= 24
  const colW = (width - M * 2 - 30) / 2
  const sig = (x: number, name: string) => {
    page.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 0.75, color: rgb(0.7, 0.73, 0.78) })
    page.drawText(name, { x, y: y - 14, size: 9, font, color: MUTED })
  }
  sig(M, `Host — ${swap.host.fullName}`)
  sig(M + colW + 30, `Guest — ${swap.requester.fullName}`)

  // Footer
  page.drawText(
    `Generated ${fmt(new Date())} · UnSwap is an independent, staff-led platform, not affiliated with the United Nations.`,
    { x: M, y: 40, size: 7.5, font, color: MUTED }
  )

  return doc.save()
}
