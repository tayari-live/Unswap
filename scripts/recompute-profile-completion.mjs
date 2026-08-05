/**
 * Recompute every member's stored profileCompletion.
 *
 * Needed after changing which fields count toward completion: the value is
 * denormalised onto User and only refreshes when a member saves their profile,
 * so existing rows keep the old score until then. Safe and idempotent — it only
 * rewrites a derived number, and re-running produces the same result.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="<prod-url>"; node scripts/recompute-profile-completion.mjs
 * Add DRY_RUN=1 to preview without writing.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const DRY = process.env.DRY_RUN === "1"

// Must mirror computeCompletion() in src/server/services/profile.ts
const FIELDS = ["fullName", "imageUrl", "nationality", "dutyStation", "organisation", "languages", "bio"]

function completionOf(u) {
  const filled = FIELDS.filter((k) => u[k] && String(u[k]).trim().length > 0).length
  return Math.round((filled / FIELDS.length) * 100)
}

async function main() {
  console.log("→ Database:", (process.env.DATABASE_URL || "(not set)").replace(/:[^:@/]+@/, ":****@"))
  if (DRY) console.log("→ DRY RUN: no writes will be made.\n")

  const users = await prisma.user.findMany({ where: { role: "member" } })
  console.log(`→ ${users.length} member(s) found.\n`)

  let changed = 0
  for (const u of users) {
    const next = completionOf(u)
    if (next === u.profileCompletion) continue
    console.log(`  ${u.email}: ${u.profileCompletion}% → ${next}%`)
    if (!DRY) {
      await prisma.user.update({ where: { id: u.id }, data: { profileCompletion: next } })
    }
    changed++
  }

  console.log(`\n✓ ${changed} member(s) ${DRY ? "would be" : ""} updated, ${users.length - changed} already correct.`)
}

main()
  .catch((e) => { console.error("✗ ERROR:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
