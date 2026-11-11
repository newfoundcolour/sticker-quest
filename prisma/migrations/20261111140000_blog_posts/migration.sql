-- Blog: staff write posts in /admin/blog and submit them; admins publish
-- them to /blog. Bodies are Markdown, rendered without raw HTML.

-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same lockdown as every public table: RLS on with no policies (deny-all),
-- and no privileges for the anon/authenticated API roles. Prisma connects
-- as postgres and bypasses RLS.
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "BlogPost" FROM anon, authenticated;
