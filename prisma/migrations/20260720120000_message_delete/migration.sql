-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedForEveryone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN     "hiddenFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
