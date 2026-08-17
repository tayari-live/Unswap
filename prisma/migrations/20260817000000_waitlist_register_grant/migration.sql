-- AlterTable: single-use registration grant handed from waitlist-confirm to /register
ALTER TABLE "WaitlistEntry" ADD COLUMN "registerGrant" TEXT;
ALTER TABLE "WaitlistEntry" ADD COLUMN "registerGrantExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_registerGrant_key" ON "WaitlistEntry"("registerGrant");
