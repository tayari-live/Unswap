import { prisma } from "@/server/prisma"

/** Write an entry to the audit log. Metadata is JSON-serialized when provided. */
export async function logAudit(params: {
  actorId?: string | null
  action: string
  subject: string
  metadata?: Record<string, unknown>
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      subject: params.subject,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}
