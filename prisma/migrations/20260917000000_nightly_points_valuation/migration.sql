-- Amenity-weighted nightly points valuation.
-- Additive columns only (safe): a per-night value + host adjustment on listings,
-- and a per-night snapshot on swap requests so an in-flight exchange's cost is
-- locked even if the listing is later edited.
ALTER TABLE "Listing" ADD COLUMN "nightlyPoints" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Listing" ADD COLUMN "nightlyAdjustment" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SwapRequest" ADD COLUMN "pointsPerNight" INTEGER;
