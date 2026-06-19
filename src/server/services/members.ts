import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"

/** List all members (excludes admins), with their subscription. */
export function listMembers() {
  return prisma.user.findMany({
    where: { role: "member" },
    orderBy: { createdAt: "desc" },
    include: { subscription: true, _count: { select: { listings: true } } },
  })
}

const ALLOWED_STATUSES = ["FULLY_VERIFIED", "SUSPENDED", "REJECTED", "EMAIL_VERIFIED", "PENDING_ID_REVIEW"]

/** Manually set a member's verification status (verify, suspend, reinstate…). */
export async function setMemberStatus(input: { actorId: string; id: string; status: string }) {
  if (!ALLOWED_STATUSES.includes(input.status)) {
    throw new ApiError(400, "Invalid status.")
  }
  const member = await prisma.user.findUnique({ where: { id: input.id } })
  if (!member || member.role !== "member") throw new ApiError(404, "Member not found.")

  await prisma.user.update({ where: { id: input.id }, data: { verificationStatus: input.status } })

  await logAudit({
    actorId: input.actorId,
    action: "MEMBER_STATUS_CHANGED",
    subject: `${member.fullName} → ${input.status}`,
    metadata: { email: member.email, status: input.status },
  })
  return { ok: true }
}

const TIERS: Record<string, { exchangesPerYear: number; priceAnnual: number; propertyGuarantee: number }> = {
  limited_1x: { exchangesPerYear: 1, priceAnnual: 129, propertyGuarantee: 500_000 },
  standard_2x: { exchangesPerYear: 2, priceAnnual: 219, propertyGuarantee: 1_000_000 },
  professional_4x: { exchangesPerYear: 4, priceAnnual: 349, propertyGuarantee: 1_500_000 },
  unlimited_pro: { exchangesPerYear: -1, priceAnnual: 449, propertyGuarantee: 2_000_000 },
  lifetime: { exchangesPerYear: -1, priceAnnual: 3143, propertyGuarantee: 2_000_000 },
}

/** Admin override of a member's subscription tier. */
export async function overrideTier(input: { actorId: string; id: string; tier: string }) {
  const preset = TIERS[input.tier]
  if (!preset) throw new ApiError(400, "Unknown tier.")
  const member = await prisma.user.findUnique({ where: { id: input.id } })
  if (!member) throw new ApiError(404, "Member not found.")

  await prisma.subscription.upsert({
    where: { userId: input.id },
    update: { tier: input.tier, status: "active", ...preset },
    create: {
      userId: input.id,
      tier: input.tier,
      status: "active",
      ...preset,
      renewsAt: input.tier === "lifetime" ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  })

  await logAudit({
    actorId: input.actorId,
    action: "SUBSCRIPTION_OVERRIDDEN",
    subject: `${member.fullName} → ${input.tier}`,
    metadata: { email: member.email, tier: input.tier },
  })
  return { ok: true }
}
