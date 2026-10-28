-- Customer accounts: profile fields, orders linked to accounts, rate limits,
-- and triggers that keep Profile in step with Supabase Auth.

-- 1. Profile: new signups default to CUSTOMER; add display/profile fields.
ALTER TABLE "Profile"
  ADD COLUMN "firstName"       TEXT NOT NULL DEFAULT '',
  ADD COLUMN "lastName"        TEXT NOT NULL DEFAULT '',
  ADD COLUMN "company"         TEXT,
  ADD COLUMN "instagramHandle" TEXT,
  ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- 2. Orders can belong to an account. Existing guest orders stay NULL.
ALTER TABLE "Order" ADD COLUMN "userId" TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- 3. Rate limit counters (deny-all to the Data API like every other table).
CREATE TABLE "RateLimit" (
    "key"         TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count"       INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key", "windowStart")
);
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "RateLimit" FROM anon, authenticated;

-- 4. Keep Profile in step with auth.users.
--    INSERT: every new auth user gets a Profile with role CUSTOMER. The role
--    is hardcoded here — never read from user metadata, which the user
--    controls. Only first/last name are copied from signup metadata, as
--    display data. Covers signups made directly against the Auth API too.
--    UPDATE OF email: Supabase only changes auth.users.email once the new
--    address is confirmed, so Profile.email always holds a verified email.
--    DELETE: remove the Profile (orders keep their data, userId -> NULL).
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public."Profile" ("id", "email", "role", "firstName", "lastName", "updatedAt")
    VALUES (
      NEW.id::text,
      COALESCE(NEW.email, NEW.id::text),
      'CUSTOMER',
      LEFT(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '')), 50),
      LEFT(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')), 50),
      now()
    )
    ON CONFLICT ("id") DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
      UPDATE public."Profile" SET "email" = NEW.email, "updatedAt" = now()
      WHERE "id" = NEW.id::text;
    END IF;
    RETURN NEW;
  ELSE
    DELETE FROM public."Profile" WHERE "id" = OLD.id::text;
    RETURN OLD;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_from_auth_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth_user();

CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth_user();

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth_user();
