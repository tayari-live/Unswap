-- Durable referral link on the user, so trust-scoring resolves the referrer as
-- a User<->User join instead of re-deriving it by email each time.
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredByCode" TEXT;

-- One-time backfill from the waitlist. The email join is acceptable here because
-- it runs once over historical rows; new accounts get these stamped at signup.
UPDATE "User" u
SET "referralCode" = w."referralCode",
    "referredByCode" = w."referredBy"
FROM "WaitlistEntry" w
WHERE lower(u."email") = lower(w."email");

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
