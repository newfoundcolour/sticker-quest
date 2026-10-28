-- Lock the public schema away from Supabase's Data API.
--
-- The anon key ships to every browser, and Supabase exposes public-schema
-- tables through its REST API using that key. Until now RLS was off and the
-- anon/authenticated roles held full privileges on every table, so anyone
-- could read customer orders or insert themselves an ADMIN Profile.
--
-- All app data access goes through Prisma, which connects as `postgres`
-- (bypasses RLS), so authorisation is enforced in server code. RLS here is
-- deny-all: enabled with no policies.

-- 1. Enable RLS (no policies = deny all) on every existing public table.
ALTER TABLE "public"."Order"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Profile"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PricingRule"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PricingSetting"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QuantityDiscountTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations"   ENABLE ROW LEVEL SECURITY;

-- 2. Belt and braces: remove the API roles' privileges outright.
REVOKE ALL ON ALL TABLES    IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM anon, authenticated;

-- 3. Stop future tables/sequences/functions created by `postgres` (i.e. by
--    Prisma migrations) from being granted to the API roles automatically.
--    New tables still get ENABLE ROW LEVEL SECURITY in their own migration.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
