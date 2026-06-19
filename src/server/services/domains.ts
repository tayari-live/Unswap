import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"

export function listDomains() {
  return prisma.allowedDomain.findMany({ orderBy: { domain: "asc" } })
}

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i

export async function addDomain(input: { actorId: string; domain: string; label: string; fastTrack: boolean }) {
  const domain = input.domain.trim().toLowerCase().replace(/^@/, "")
  if (!DOMAIN_RE.test(domain)) throw new ApiError(400, "Enter a valid domain, e.g. un.org.")
  if (!input.label.trim()) throw new ApiError(400, "An organisation label is required.")

  const existing = await prisma.allowedDomain.findUnique({ where: { domain } })
  if (existing) throw new ApiError(409, "That domain is already on the allowlist.")

  const created = await prisma.allowedDomain.create({
    data: { domain, label: input.label.trim(), fastTrack: input.fastTrack },
  })
  await logAudit({ actorId: input.actorId, action: "DOMAIN_ADDED", subject: `Allowlisted ${domain}`, metadata: { domain } })
  return created
}

export async function deleteDomain(input: { actorId: string; id: string }) {
  const existing = await prisma.allowedDomain.findUnique({ where: { id: input.id } })
  if (!existing) throw new ApiError(404, "Domain not found.")
  await prisma.allowedDomain.delete({ where: { id: input.id } })
  await logAudit({ actorId: input.actorId, action: "DOMAIN_REMOVED", subject: `Removed ${existing.domain}`, metadata: { domain: existing.domain } })
  return { ok: true }
}
