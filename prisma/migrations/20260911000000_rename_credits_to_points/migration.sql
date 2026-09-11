-- Rename "credits" -> "points". This is a code-only rename: the physical table
-- ("CreditTransaction") and column ("creditsCelebratedAt") names are unchanged,
-- kept via @@map/@map in the Prisma schema, so there is no table/column rename
-- and no risk of data loss.
--
-- The only stored data that carried the old name is the exchange-mode string on
-- swaps and the exchange-type on listings. Move those from "credits" to "points"
-- so existing rows match the new vocabulary.
UPDATE "SwapRequest" SET "mode" = 'points' WHERE "mode" = 'credits';
UPDATE "Listing" SET "exchangeType" = 'points' WHERE "exchangeType" = 'credits';
