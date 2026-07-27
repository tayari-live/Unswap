-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "confirmToken" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_confirmToken_key" ON "WaitlistEntry"("confirmToken");

-- CreateIndex
CREATE INDEX "WaitlistEntry_confirmedAt_referrals_idx" ON "WaitlistEntry"("confirmedAt", "referrals");
