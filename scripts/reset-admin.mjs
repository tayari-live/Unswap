/**
 * Diagnose + repair the admin login against whatever database DATABASE_URL
 * points at. Safe to run against production: it only touches the single admin
 * row (upsert) and never adds demo/member data.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="<prod-neon-pooled-url>"; node scripts/reset-admin.mjs
 * Usage (bash):
 *   DATABASE_URL="<prod-neon-pooled-url>" node scripts/reset-admin.mjs
 *
 * Optional overrides: ADMIN_EMAIL, ADMIN_PASSWORD (default hello@unswap.net / admin1234)
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const EMAIL = (process.env.ADMIN_EMAIL || "hello@unswap.net").toLowerCase()
const PASSWORD = process.env.ADMIN_PASSWORD || "admin1234"

const prisma = new PrismaClient()

async function main() {
  const host = (process.env.DATABASE_URL || "").replace(/:[^:@/]+@/, ":****@")
  console.log("→ Database:", host || "(DATABASE_URL not set!)")

  // 1) Connectivity + rough shape of the DB we're actually talking to.
  const [users, members, admins, listings] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "member" } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.listing.count().catch(() => -1),
  ])
  console.log(`→ Users: ${users}  (members: ${members}, admins: ${admins})  Listings: ${listings}`)

  // 2) Current state of the admin account.
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!existing) {
    console.log(`→ Admin ${EMAIL} does NOT exist in this database.`)
  } else {
    const matches = await bcrypt.compare(PASSWORD, existing.passwordHash)
    console.log(`→ Admin ${EMAIL} exists. role=${existing.role}  "${PASSWORD}" matches: ${matches}`)
  }

  // 3) Repair: ensure the admin exists with the intended password + role.
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, role: "admin", verificationStatus: "FULLY_VERIFIED" },
    create: {
      email: EMAIL,
      passwordHash,
      firstName: "UnSwap",
      lastName: "Admin",
      fullName: "UnSwap Admin",
      role: "admin",
      avatarInitials: "UA",
      verificationStatus: "FULLY_VERIFIED",
      organisation: "UnSwap",
    },
  })

  const after = await prisma.user.findUnique({ where: { email: EMAIL } })
  const ok = await bcrypt.compare(PASSWORD, after.passwordHash)
  console.log(`✓ Done. ${EMAIL} / ${PASSWORD} now valid: ${ok}  role=${after.role}`)
}

main()
  .catch((e) => { console.error("✗ ERROR:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
