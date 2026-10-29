-- Sign up now asks for business name, phone and Instagram handle (all optional).

-- 1. Phone number on the profile.
ALTER TABLE "Profile" ADD COLUMN "phone" TEXT;

-- 2. Copy the optional sign up details into the new Profile, next to the names.
--    They are display data only, sent as signup metadata. Anyone can call the
--    Auth API directly, so each value is checked again here: anything that
--    doesn't fit the same rules as the form is stored as NULL. The role is
--    still hardcoded and never read from metadata.
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta_company   text := BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'company', ''));
  meta_phone     text := BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'phone', ''));
  meta_instagram text := BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'instagram_handle', ''));
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public."Profile" (
      "id", "email", "role", "firstName", "lastName", "company", "phone", "instagramHandle", "updatedAt"
    )
    VALUES (
      NEW.id::text,
      COALESCE(NEW.email, NEW.id::text),
      'CUSTOMER',
      LEFT(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '')), 50),
      LEFT(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')), 50),
      NULLIF(LEFT(meta_company, 100), ''),
      CASE WHEN meta_phone ~ '^\+?[0-9][0-9 ()-]{6,19}$' THEN meta_phone END,
      CASE WHEN meta_instagram ~ '^[A-Za-z0-9._]{1,30}$' THEN meta_instagram END,
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
