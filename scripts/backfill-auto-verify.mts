/*
 * One-off backfill: retroactively verify members who confirmed their email on
 * an auto-verify domain BEFORE that domain was flipped to auto-verify.
 *
 * Auto-verify only fires at email-confirmation time, so members who confirmed
 * earlier stay at EMAIL_VERIFIED even though a new signup on the same domain is
 * now verified instantly. This sweep upgrades them to FULLY_VERIFIED and grants
 * the same one-time "verified" points the auto path gives — mirroring
 * grantAutoVerifyRewards. It sends no email (a bulk "you're verified" blast is
 * undesirable) and is idempotent.
 *
 * SAFETY:
 *   - Dry-run by default. Pass --apply to actually write.
 *   - Only touches EMAIL_VERIFIED members (never PENDING_ID_REVIEW / REJECTED /
 *     SUSPENDED / FULLY_VERIFIED).
 *   - Scoped strictly to domains with autoVerify = true.
 *   - Points grant is upserted on the (userId, reason) unique, so re-running
 *     never double-grants.
 *
 * USAGE:
 *   # dry run against local (.env DATABASE_URL):
 *   npx tsx scripts/backfill-auto-verify.mts
 *   # dry run against prod:
 *   PROD_DATABASE_URL='postgres://...' npx tsx scripts/backfill-auto-verify.mts
 *   # apply against prod:
 *   PROD_DATABASE_URL='postgres://...' npx tsx scripts/backfill-auto-verify.mts --apply
 */
import { readFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"

const APPLY = process.argv.includes("--apply")
const VERIFIED_GRANT = 500 // POINT_GRANTS.verified.amount

function loadEnv(path: string) {
  let txt = ""
  try { txt = readFileSync(path, "utf8") } catch { return }
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (process.env[m[1]] === undefined) process.env[m[1]] = v
  }
}
loadEnv(".env")
loadEnv(".env.local")

const rawUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
if (!rawUrl) { console.error("No PROD_DATABASE_URL or DATABASE_URL found."); process.exit(1) }
// Prisma 5.22 + Neon: channel_binding=require is flaky. Strip it for this script.
const u = new URL(rawUrl)
u.searchParams.delete("channel_binding")
if (!u.searchParams.get("sslmode") && u.host.includes("neon.tech")) u.searchParams.set("sslmode", "require")
u.searchParams.set("connect_timeout", "15")
u.searchParams.set("connection_limit", "1")

const prisma = new PrismaClient({ datasources: { db: { url: u.toString() } } })

/** Same match logic as matchAllowedDomain: exact or subdomain. */
function domainMatches(email: string, autoDomains: string[]): string | null {
  const d = email.slice(email.indexOf("@") + 1).toLowerCase()
  return autoDomains.find((ad) => d === ad || d.endsWith(`.${ad}`)) ?? null
}

async function main() {
  await prisma.$queryRaw`SELECT 1`
  console.log(`Target: ${u.host}   mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}\n`)

  const autoDomains = (await prisma.allowedDomain.findMany({ where: { autoVerify: true }, select: { domain: true } }))
    .map((r) => r.domain.toLowerCase())
  if (!autoDomains.length) { console.log("No auto-verify domains configured — nothing to backfill."); return }
  console.log(`Auto-verify domains (${autoDomains.length}): ${autoDomains.join(", ")}\n`)

  // Candidates: members stuck at EMAIL_VERIFIED.
  const candidates = await prisma.user.findMany({
    where: { verificationStatus: "EMAIL_VERIFIED" },
    select: { id: true, fullName: true, email: true, workEmail: true, workEmailVerifiedAt: true },
  })

  const eligible = candidates
    .map((c) => {
      const via = domainMatches(c.email, autoDomains)
        || (c.workEmailVerifiedAt && c.workEmail ? domainMatches(c.workEmail, autoDomains) : null)
      return via ? { ...c, via } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  console.log(`EMAIL_VERIFIED members: ${candidates.length}   eligible for auto-verify backfill: ${eligible.length}\n`)
  if (!eligible.length) { console.log("Nothing to upgrade."); return }

  for (const e of eligible) console.log(`  ${e.email.padEnd(34)} ${e.fullName.padEnd(22)} via @${e.via}`)

  if (!APPLY) {
    console.log(`\nDRY RUN — no changes made. Re-run with --apply to upgrade these ${eligible.length} member(s).`)
    return
  }

  let upgraded = 0
  for (const e of eligible) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: e.id }, data: { verificationStatus: "FULLY_VERIFIED" } }),
      // Idempotent one-time "verified" grant (skips if already granted).
      prisma.pointTransaction.upsert({
        where: { userId_reason: { userId: e.id, reason: "verified" } },
        create: { userId: e.id, type: "earned", amount: VERIFIED_GRANT, status: "confirmed", reason: "verified" },
        update: {},
      }),
      prisma.auditLog.create({
        data: {
          action: "MEMBER_VERIFIED",
          subject: `Auto-verify backfill: ${e.fullName}`,
          metadata: JSON.stringify({ email: e.email, autoVerified: true, backfill: true, via: e.via }),
        },
      }),
    ])
    upgraded++
    console.log(`  upgraded ${e.email}`)
  }
  console.log(`\nDone. Upgraded ${upgraded} member(s) to FULLY_VERIFIED.`)
}

main().catch((err) => { console.error("FAILED:", (err as Error)?.message ?? err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
