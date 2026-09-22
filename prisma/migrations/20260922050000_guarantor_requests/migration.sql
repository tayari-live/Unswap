-- Guarantor invitations: a member who can't verify via their own institutional
-- email names a UN/IO contact who confirms and explicitly approves, vouching
-- for their professional standing.
CREATE TABLE "GuarantorRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "guarantorEmail" TEXT NOT NULL,
    "guarantorName" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuarantorRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuarantorRequest_token_key" ON "GuarantorRequest"("token");
CREATE INDEX "GuarantorRequest_memberId_idx" ON "GuarantorRequest"("memberId");
ALTER TABLE "GuarantorRequest" ADD CONSTRAINT "GuarantorRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
