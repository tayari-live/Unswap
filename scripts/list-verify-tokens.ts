import { prisma } from "../src/server/prisma"

async function main() {
  const base = process.env.AUTH_URL || "http://localhost:3000"
  const tokens = await prisma.emailVerificationToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
    include: { user: { select: { email: true, firstName: true, verificationStatus: true } } },
  })

  if (tokens.length === 0) {
    console.log("No pending verification tokens. Register an account first, then re-run.")
    return
  }

  console.log(`Found ${tokens.length} pending verification link(s):\n`)
  for (const t of tokens) {
    console.log(`• ${t.user.email}  (${t.user.firstName}, ${t.user.verificationStatus})`)
    console.log(`  ${base}/verify?token=${t.token}`)
    console.log(`  expires ${t.expiresAt.toISOString()}\n`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
