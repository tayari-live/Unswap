import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { logAudit } from "@/server/services/audit"

export function listDomains() {
  return prisma.allowedDomain.findMany({ orderBy: { domain: "asc" } })
}

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i

export async function addDomain(input: {
  actorId: string
  domain: string
  label: string
  fastTrack: boolean
  autoVerify?: boolean
}) {
  const domain = input.domain.trim().toLowerCase().replace(/^@/, "")
  if (!DOMAIN_RE.test(domain)) throw new ApiError(400, "Enter a valid domain, e.g. un.org.")
  if (!input.label.trim()) throw new ApiError(400, "An organisation label is required.")

  const existing = await prisma.allowedDomain.findUnique({ where: { domain } })
  if (existing) throw new ApiError(409, "That domain is already on the allowlist.")

  const autoVerify = input.autoVerify === true
  const created = await prisma.allowedDomain.create({
    // autoVerify short-circuits the document + officer step, so it necessarily
    // implies fast-track — coerce it so the row can't hold a contradictory state.
    data: { domain, label: input.label.trim(), fastTrack: autoVerify || input.fastTrack, autoVerify },
  })
  await logAudit({ actorId: input.actorId, action: "DOMAIN_ADDED", subject: `Allowlisted ${domain}`, metadata: { domain, autoVerify } })
  return created
}

export async function updateDomain(input: {
  actorId: string
  id: string
  fastTrack?: boolean
  autoVerify?: boolean
}) {
  const existing = await prisma.allowedDomain.findUnique({ where: { id: input.id } })
  if (!existing) throw new ApiError(404, "Domain not found.")

  const autoVerify = input.autoVerify ?? existing.autoVerify
  // Auto-verify implies fast-track (it skips review entirely), so never let the
  // pair land in a contradictory state.
  const fastTrack = autoVerify ? true : (input.fastTrack ?? existing.fastTrack)

  const updated = await prisma.allowedDomain.update({
    where: { id: input.id },
    data: { fastTrack, autoVerify },
  })
  await logAudit({
    actorId: input.actorId,
    action: "DOMAIN_UPDATED",
    subject: `Updated ${existing.domain} (fastTrack=${fastTrack}, autoVerify=${autoVerify})`,
    metadata: { domain: existing.domain, fastTrack, autoVerify },
  })
  return updated
}

export async function deleteDomain(input: { actorId: string; id: string }) {
  const existing = await prisma.allowedDomain.findUnique({ where: { id: input.id } })
  if (!existing) throw new ApiError(404, "Domain not found.")
  await prisma.allowedDomain.delete({ where: { id: input.id } })
  await logAudit({ actorId: input.actorId, action: "DOMAIN_REMOVED", subject: `Removed ${existing.domain}`, metadata: { domain: existing.domain } })
  return { ok: true }
}
