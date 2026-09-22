-- A member who signed up with a non-recognised address can add a second,
-- institutional email to prove affiliation. Confirming it runs the same
-- allowlist logic (auto-verify / fast-track) as the primary email.
ALTER TABLE "User" ADD COLUMN "workEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "workEmailVerifiedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_workEmail_key" ON "User"("workEmail");

CREATE TABLE "WorkEmailToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkEmailToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkEmailToken_token_key" ON "WorkEmailToken"("token");
CREATE INDEX "WorkEmailToken_userId_idx" ON "WorkEmailToken"("userId");
ALTER TABLE "WorkEmailToken" ADD CONSTRAINT "WorkEmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
