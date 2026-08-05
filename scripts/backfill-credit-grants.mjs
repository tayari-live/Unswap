/**
 * Award any credit grants a member already qualifies for but never received,
 * because the grant was added to the code after they hit the milestone.
 *
 * Covers: welcome (every member), profile_complete (100% profile),
 * first_listing (has an ACTIVE listing), verified (FULLY_VERIFIED).
 * Idempotent — it checks the ledger first, so re-running grants nothing twice.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="<prod-url>"; node scripts/backfill-credit-grants.mjs
 * Add DRY_RUN=1 to preview without writing.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const DRY = process.env.DRY_RUN === "1"

// Mirrors CREDIT_GRANTS in src/server/services/credits.ts
const AMOUNTS = {
  welcome: 1,
  profile_complete: 1,
  first_listing: 3,
  verified: 2,
  first_subscription: 3,
}

async function main() {
  console.log("→ Database:", (process.env.DATABASE_URL || "(not set)").replace(/:[^:@/]+@/, ":****@"))
  if (DRY) console.log("→ DRY RUN: no writes will be made.\n")

  const members = await prisma.user.findMany({
    where: { role: "member" },
    include: { listings: true },
  })

  let granted = 0
  for (const m of members) {
    const earned = []
    earned.push("welcome")
    if (m.profileCompletion >= 100) earned.push("profile_complete")
    if (m.listings.some((l) => l.status === "ACTIVE")) earned.push("first_listing")
    if (m.verificationStatus === "FULLY_VERIFIED") earned.push("verified")

    for (const reason of earned) {
      const existing = await prisma.creditTransaction.findFirst({
        where: { userId: m.id, reason, type: "earned" },
        select: { id: true },
      })
      if (existing) continue
      console.log(`  ${m.email}: +${AMOUNTS[reason]} (${reason})`)
      if (!DRY) {
        await prisma.creditTransaction.create({
          data: { userId: m.id, type: "earned", amount: AMOUNTS[reason], status: "confirmed", reason },
        })
      }
      granted++
    }
  }

  console.log(`\n✓ ${granted} grant(s) ${DRY ? "would be" : ""} awarded across ${members.length} member(s).`)
}

main()
  .catch((e) => { console.error("✗ ERROR:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
