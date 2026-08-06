-- Fixed-window rate limiting for public, email-sending endpoints.
CREATE TABLE "RateLimit" (
  "key"       TEXT NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- Supports the periodic sweep of expired windows.
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit" ("expiresAt");
