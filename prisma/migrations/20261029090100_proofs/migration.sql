-- Print proofs: every version kept, decisions recorded, files in a private bucket.

CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ProofDecisionSource" AS ENUM ('CUSTOMER', 'STAFF_ON_BEHALF');

CREATE TABLE "Proof" (
    "id"               TEXT NOT NULL,
    "orderId"          TEXT NOT NULL,
    "version"          INTEGER NOT NULL,
    "storagePath"      TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType"         TEXT NOT NULL,
    "sizeBytes"        INTEGER NOT NULL,
    "status"           "ProofStatus" NOT NULL DEFAULT 'PENDING',
    "customerComment"  TEXT,
    "decidedAt"        TIMESTAMP(3),
    "decidedBy"        TEXT,
    "decisionSource"   "ProofDecisionSource",
    "uploadedBy"       TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Proof_storagePath_key" ON "Proof"("storagePath");
CREATE UNIQUE INDEX "Proof_orderId_version_key" ON "Proof"("orderId", "version");
CREATE INDEX "Proof_orderId_createdAt_idx" ON "Proof"("orderId", "createdAt");
CREATE INDEX "Proof_status_idx" ON "Proof"("status");

ALTER TABLE "Proof" ADD CONSTRAINT "Proof_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deny-all to Supabase's Data API, like every other table.
ALTER TABLE "Proof" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Proof" FROM anon, authenticated;

-- Private Storage bucket for proof files: never public, 20 MB cap, only the
-- formats we accept. storage.objects already has RLS with no policies for
-- this bucket, so only the server (service role key) can read or write it.
-- Guarded so the migration still runs on a plain Postgres (e.g. a shadow DB)
-- that has no Supabase storage schema.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'proofs', 'proofs', false, 20971520,
      ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE
      SET public = false,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
