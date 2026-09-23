-- Automated ID verification via a third-party provider (Stripe Identity). The
-- raw document/selfie stays with the provider; we store only the session id and
-- the pass/fail outcome.
CREATE TABLE "IdentityCheck" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdentityCheck_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IdentityCheck_sessionId_key" ON "IdentityCheck"("sessionId");
CREATE INDEX "IdentityCheck_memberId_idx" ON "IdentityCheck"("memberId");
ALTER TABLE "IdentityCheck" ADD CONSTRAINT "IdentityCheck_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
