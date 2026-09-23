-- The Vacation Swap Calendar: positive availability windows a host marks as
-- open for a swap. Drives the "Available Now" tag and vacation-window matching.
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AvailabilityWindow_listingId_idx" ON "AvailabilityWindow"("listingId");
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
