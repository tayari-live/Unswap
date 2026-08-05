-- Tracks when a member last saw the credit-earned celebration, so it fires once.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creditsCelebratedAt" TIMESTAMP(3);
