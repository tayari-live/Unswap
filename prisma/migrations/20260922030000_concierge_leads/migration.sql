-- Relocation Concierge requests, triaged (category/priority/summary) on
-- submission and routed to the team. Only trust-eligible members create these.
CREATE TABLE "ConciergeLead" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "timeframe" TEXT,
    "needs" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "nextSteps" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "trustScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConciergeLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConciergeLead_status_createdAt_idx" ON "ConciergeLead"("status", "createdAt");
ALTER TABLE "ConciergeLead" ADD CONSTRAINT "ConciergeLead_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
