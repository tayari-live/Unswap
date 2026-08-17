-- Passwordless members (waitlist invite) set a password only after setup.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Single-use, short-lived sign-in token (passwordless onboarding + resume link).
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoginToken_token_key" ON "LoginToken"("token");
CREATE INDEX "LoginToken_userId_idx" ON "LoginToken"("userId");

ALTER TABLE "LoginToken" ADD CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
