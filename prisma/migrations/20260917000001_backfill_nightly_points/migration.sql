-- Backfill nightly point values for listings created before the valuation
-- existed (they default to 100). This mirrors src/lib/valuation.ts exactly:
-- base 100 + location tier (0/40/80) + size (beds cap 50, guests cap 20)
-- + amenities (cap 50), clamped to 100–300. The host adjustment stays 0.
UPDATE "Listing" SET "nightlyPoints" = LEAST(300, GREATEST(100,
  100
  + CASE
      WHEN LOWER("city") IN (
        'geneva','new york','london','paris','rome','vienna','washington d.c.',
        'copenhagen','brussels','madrid','berlin','tokyo','singapore','istanbul'
      ) THEN 80
      WHEN LOWER("city") IN (
        'nairobi','bangkok','addis ababa','bonn','the hague','amman','beirut',
        'cairo','tunis','rabat','dakar','accra','abuja','johannesburg','pretoria',
        'panama city','santiago','bogotá','mexico city','buenos aires','lima','quito',
        'kathmandu','new delhi','dhaka','colombo','jakarta','manila','hanoi','seoul',
        'beijing','ankara','kyiv','budapest','warsaw','stockholm','oslo','helsinki'
      ) THEN 40
      ELSE 0
    END
  + LEAST(50, GREATEST(0, "bedrooms" - 1) * 20)
  + LEAST(20, GREATEST(0, "maxGuests" - 2) * 5)
  + LEAST(50, COALESCE(array_length(string_to_array(NULLIF("amenities", ''), ','), 1), 0) * 8)
));
