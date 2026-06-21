import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"
import { recomputeTrustScore, recomputeListingRating } from "@/server/services/reviews"

const TARGET_TYPES = ["message", "review"] as const
type TargetType = (typeof TARGET_TYPES)[number]

/** A member reports a message or review for moderation. */
export async function createReport(input: {
  reporterId: string
  targetType: string
  targetId: string
  reason?: string
}) {
  if (!TARGET_TYPES.includes(input.targetType as TargetType)) {
    throw new ApiError(400, "Unsupported report type.")
  }
  if (!input.targetId) throw new ApiError(400, "Missing target.")

  // Confirm the target exists.
  const exists =
    input.targetType === "message"
      ? await prisma.message.findUnique({ where: { id: input.targetId }, select: { id: true } })
      : await prisma.review.findUnique({ where: { id: input.targetId }, select: { id: true } })
  if (!exists) throw new ApiError(404, "That content no longer exists.")

  // One open report per member per item.
  const dupe = await prisma.report.findFirst({
    where: { reporterId: input.reporterId, targetType: input.targetType, targetId: input.targetId, status: "open" },
  })
  if (dupe) return { ok: true, alreadyReported: true }

  await prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason?.trim() || null,
    },
  })

  await prisma.notification.create({
    data: {
      type: "moderation",
      title: "New content report",
      body: `A ${input.targetType} was reported for moderation.`,
      link: "/moderation",
    },
  })

  await logAudit({ actorId: input.reporterId, action: "CONTENT_REPORTED", subject: `Reported ${input.targetType}`, metadata: { targetId: input.targetId } })
  return { ok: true, alreadyReported: false }
}

export type ReportRow = Awaited<ReturnType<typeof listReports>>[number]

/** Reports for the admin queue, enriched with a preview of the reported content. */
export async function listReports(status = "open") {
  const reports = await prisma.report.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { fullName: true, avatarInitials: true } } },
  })

  const msgIds = reports.filter((r) => r.targetType === "message").map((r) => r.targetId)
  const revIds = reports.filter((r) => r.targetType === "review").map((r) => r.targetId)

  const [messages, reviews] = await Promise.all([
    prisma.message.findMany({ where: { id: { in: msgIds } }, include: { sender: { select: { fullName: true } } } }),
    prisma.review.findMany({ where: { id: { in: revIds } }, include: { author: { select: { fullName: true } }, subject: { select: { fullName: true } } } }),
  ])
  const msgMap = new Map(messages.map((m) => [m.id, m]))
  const revMap = new Map(reviews.map((r) => [r.id, r]))

  return reports.map((r) => {
    let content: { body: string; by: string; meta?: string; removed: boolean }
    if (r.targetType === "message") {
      const m = msgMap.get(r.targetId)
      content = m
        ? { body: m.body || "(photo attachment)", by: m.sender.fullName, removed: false }
        : { body: "—", by: "—", removed: true }
    } else {
      const rv = revMap.get(r.targetId)
      content = rv
        ? { body: rv.body, by: rv.author.fullName, meta: `${rv.overall}★ · about ${rv.subject.fullName}`, removed: false }
        : { body: "—", by: "—", removed: true }
    }
    return {
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: r.reporter,
      content,
    }
  })
}

/** Resolve a report: dismiss (keep content) or remove (delete the content). */
export async function resolveReport(input: { adminId: string; id: string; action: "dismiss" | "remove" }) {
  const report = await prisma.report.findUnique({ where: { id: input.id } })
  if (!report) throw new ApiError(404, "Report not found.")
  if (report.status !== "open") throw new ApiError(409, "This report is already resolved.")

  if (input.action === "remove") {
    if (report.targetType === "message") {
      await prisma.message.deleteMany({ where: { id: report.targetId } })
    } else if (report.targetType === "review") {
      const rv = await prisma.review.findUnique({ where: { id: report.targetId } })
      if (rv) {
        await prisma.review.delete({ where: { id: rv.id } })
        await recomputeTrustScore(rv.subjectId)
        if (rv.listingId) await recomputeListingRating(rv.listingId)
      }
    }
  } else if (input.action !== "dismiss") {
    throw new ApiError(400, "Unknown action.")
  }

  await prisma.report.update({
    where: { id: input.id },
    data: { status: input.action === "remove" ? "actioned" : "dismissed", resolvedById: input.adminId, resolvedAt: new Date() },
  })

  await logAudit({
    actorId: input.adminId,
    action: input.action === "remove" ? "CONTENT_REMOVED" : "REPORT_DISMISSED",
    subject: `${input.action === "remove" ? "Removed" : "Dismissed report on"} ${report.targetType}`,
    metadata: { targetId: report.targetId },
  })
  return { ok: true }
}
