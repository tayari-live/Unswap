-- One free-credit grant per member per reason, enforced by the database.
--
-- grantCreditsOnce() checked for an existing row before inserting, but two
-- concurrent calls could both pass that check and grant twice (publishing a
-- listing reaches it from three separate code paths).
--
-- Swap-related transactions carry reason = NULL. Postgres treats NULLs as
-- distinct in a unique index, so a member can still have any number of them.
CREATE UNIQUE INDEX "CreditTransaction_userId_reason_key"
  ON "CreditTransaction" ("userId", "reason");
