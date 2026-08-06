-- Tracks whether the member has seen the "you are verified" moment.
-- Separate from creditsCelebratedAt so neither celebration swallows the other.
ALTER TABLE "User" ADD COLUMN "verifiedCelebratedAt" TIMESTAMP(3);
