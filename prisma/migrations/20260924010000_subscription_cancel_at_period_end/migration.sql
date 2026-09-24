-- AlterTable: track a cancellation that keeps access until the paid period ends.
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
