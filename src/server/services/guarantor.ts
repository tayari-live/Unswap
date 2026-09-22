import { randomBytes } from "crypto"
import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail, esc } from "@/server/email"
import { logAudit } from "@/server/services/audit"
import { rateLimit } from "@/server/rate-limit"
import { matchAllowedDomain, grantAutoVerifyRewards } from "@/server/services/registration"
import { emailSchema } from "@/lib/validation/auth"

const baseUrl = () => process.env.AUTH_URL || "http://localhost:3000"
const token = () => randomBytes(32).toString("hex")

/**
 * A member who can't verify via their own institutional email names a UN/IO
 * contact as their guarantor. The contact must be on a recognised institutional
 * domain; we email them a link to confirm (by receiving it) and explicitly
 * approve or decline vouching for the member.
 */
export async function requestGuarantor(userId: string, rawEmail: string, guarantorName?: string) {
  const parsed = emailSchema.safeParse(rawEmail)
  if (!parsed.success) throw new ApiError(400, "Enter a valid email address for your guarantor.")
  const guarantorEmail = parsed.data.trim().toLowerCase()

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, firstName: true, email: true, organisation: true, verificationStatus: true },
  })
  if (!member) throw new ApiError(404, "Account not found.")
  if (member.verificationStatus === "FULLY_VERIFIED") throw new ApiError(409, "You're already fully verified.")
  if (guarantorEmail === member.email.toLowerCase()) {
    throw new ApiError(400, "Your guarantor must be someone else — enter a colleague's institutional email.")
  }

  // The guarantor has to be UN/IO staff, or their vouch proves nothing.
  const matched = await matchAllowedDomain(guarantorEmail)
  if (!matched) {
    throw new ApiError(400, "Your guarantor must use a recognised institutional email (e.g. an @un.org address).")
  }

  const limit = await rateLimit(`guarantor:${userId}`, 5, 60 * 60)
  if (!limit.ok) throw new ApiError(429, "Too many attempts. Please try again later.")

  // One live invite at a time.
  await prisma.guarantorRequest.updateMany({
    where: { memberId: userId, status: "pending" },
    data: { status: "declined" },
  })

  const t = token()
  await prisma.guarantorRequest.create({
    data: {
      memberId: userId,
      guarantorEmail,
      guarantorName: guarantorName?.trim() || null,
      token: t,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const url = `${baseUrl()}/guarantor?token=${t}`
  await sendEmail({
    to: guarantorEmail,
    subject: `${member.fullName} asked you to vouch for them on UnSwap`,
    html: renderEmail({
      heading: `Can you vouch for ${esc(member.firstName)}?`,
      preheader: `${esc(member.fullName)} named you as their guarantor on UnSwap.`,
      body: `<p style="margin:0 0 14px"><strong>${esc(member.fullName)}</strong>${member.organisation ? ` (${esc(member.organisation)})` : ""} is joining UnSwap, the verified home-exchange network for UN, World Bank, IMF and international-organisation professionals, and named you as their guarantor.</p>
             <p style="margin:0 0 14px">If you know ${esc(member.firstName)} and can confirm they are a UN/IO colleague, approve below. If not, you can decline — it takes a moment either way.</p>
             <p style="margin:0;color:#6b7280;font-size:13px">You're receiving this only because your address was entered as a guarantor. No account is created for you.</p>`,
      ctaLabel: "Review the request",
      ctaUrl: url,
      footnote: "This link expires in 7 days.",
    }),
    text: `${member.fullName} named you as their guarantor on UnSwap. Approve or decline: ${url}\n\nThis link expires in 7 days.`,
  })

  await logAudit({
    action: "GUARANTOR_REQUESTED",
    subject: `${member.fullName} invited a guarantor`,
    metadata: { email: member.email, guarantorEmail },
  })

  return { ok: true, guarantorEmail }
}

/** Load a guarantor request for the response page. Throws when invalid/expired. */
export async function getGuarantorRequest(rawToken: string) {
  if (!rawToken) throw new ApiError(400, "Missing token.")
  const req = await prisma.guarantorRequest.findUnique({
    where: { token: rawToken },
    include: { member: { select: { fullName: true, firstName: true, organisation: true } } },
  })
  if (!req) throw new ApiError(400, "This guarantor link is invalid.")
  if (req.status !== "pending") throw new ApiError(410, "This request has already been answered.")
  if (req.expiresAt < new Date()) throw new ApiError(410, "This guarantor link has expired.")
  return {
    memberName: req.member.fullName,
    memberFirstName: req.member.firstName,
    organisation: req.member.organisation,
    guarantorEmail: req.guarantorEmail,
  }
}

/**
 * The guarantor's answer. Approval verifies the member (their vouch is the
 * affiliation proof) and grants the same one-time reward as any other
 * verification path; a decline simply records the outcome.
 */
export async function respondToGuarantor(rawToken: string, approve: boolean) {
  if (!rawToken) throw new ApiError(400, "Missing token.")
  const req = await prisma.guarantorRequest.findUnique({
    where: { token: rawToken },
    include: { member: { select: { id: true, fullName: true, firstName: true, email: true, verificationStatus: true } } },
  })
  if (!req) throw new ApiError(400, "This guarantor link is invalid.")
  if (req.status !== "pending") throw new ApiError(410, "This request has already been answered.")
  if (req.expiresAt < new Date()) throw new ApiError(410, "This guarantor link has expired.")

  // Re-check the guarantor's domain is still recognised at approval time.
  if (approve) {
    const matched = await matchAllowedDomain(req.guarantorEmail)
    if (!matched) throw new ApiError(400, "That guarantor email is no longer on a recognised institutional domain.")
  }

  const elevate = approve && req.member.verificationStatus !== "FULLY_VERIFIED"

  await prisma.$transaction([
    prisma.guarantorRequest.update({
      where: { id: req.id },
      data: { status: approve ? "approved" : "declined", respondedAt: new Date() },
    }),
    ...(elevate
      ? [prisma.user.update({ where: { id: req.member.id }, data: { verificationStatus: "FULLY_VERIFIED" } })]
      : []),
  ])

  if (elevate) {
    await grantAutoVerifyRewards({ id: req.member.id, fullName: req.member.fullName, email: req.member.email })
    // Let the member know they're in.
    await sendEmail({
      to: req.member.email,
      subject: "You're verified on UnSwap",
      html: renderEmail({
        heading: `You're verified, ${esc(req.member.firstName)}.`,
        preheader: "Your guarantor vouched for you — you now have full access.",
        body: `<p style="margin:0 0 14px">Your guarantor confirmed your professional standing, so you're now fully verified. You can list your home and arrange exchanges with vetted peers.</p>`,
        ctaLabel: "Go to your dashboard",
        ctaUrl: `${baseUrl()}/dashboard`,
      }),
    }).catch(() => {})
  }

  await logAudit({
    action: approve ? "GUARANTOR_APPROVED" : "GUARANTOR_DECLINED",
    subject: `Guarantor ${approve ? "approved" : "declined"} ${req.member.fullName}`,
    metadata: { email: req.member.email, guarantorEmail: req.guarantorEmail },
  })

  return { memberFirstName: req.member.firstName, approved: approve }
}
