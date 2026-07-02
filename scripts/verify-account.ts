import { prisma } from "../src/server/prisma"

// Simulates clicking the email-verification link for an account, for use while
// Resend is unconfigured. Advances PENDING_EMAIL -> EMAIL_VERIFIED.
const EMAIL = "qasim@jacquelinetsuma.com"

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!user) { console.log(`No user: ${EMAIL}`); return }

  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const updated = user.verificationStatus === "PENDING_EMAIL"
    ? await prisma.user.update({
        where: { id: user.id },
        data: { verificationStatus: "EMAIL_VERIFIED" },
      })
    : user

  console.log(`${EMAIL}`)
  console.log(`  before: ${user.verificationStatus}`)
  console.log(`  after:  ${updated.verificationStatus}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
