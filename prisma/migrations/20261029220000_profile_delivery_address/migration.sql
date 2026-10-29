-- Delivery details on the profile: collected in the cart before checkout and
-- reused for every order. Nullable here; checkout requires them (validated in
-- src/lib/validation/deliveryDetails.ts). Profile already has RLS enabled and
-- anon/authenticated privileges revoked, which covers the new columns.
ALTER TABLE "Profile"
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city"         TEXT,
  ADD COLUMN "province"     TEXT,
  ADD COLUMN "postalCode"   TEXT;
