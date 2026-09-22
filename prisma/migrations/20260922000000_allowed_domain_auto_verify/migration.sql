-- Auto-verify domains: confirming an institutional email on one of these
-- domains is itself the proof of affiliation, so the member skips the document
-- upload + officer review and becomes FULLY_VERIFIED on email confirmation.
ALTER TABLE "AllowedDomain" ADD COLUMN "autoVerify" BOOLEAN NOT NULL DEFAULT false;
