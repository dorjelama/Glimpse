-- Migration: add_pages
-- Introduces a Page model between Project and Element.
-- Each project gets a default "Page 1"; all existing elements are re-parented to it.
-- canvasBgColor / canvasBgImage are moved from projects → pages.

-- ─── 1. Create pages table ──────────────────────────────────────────────────

CREATE TABLE "pages" (
  "id"        TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name"      TEXT NOT NULL DEFAULT 'Page 1',
  "order"     INTEGER NOT NULL DEFAULT 0,
  "bgColor"   TEXT NOT NULL DEFAULT '#ffffff',
  "bgImage"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pages_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pages_projectId_idx" ON "pages"("projectId");
CREATE INDEX "pages_projectId_order_idx" ON "pages"("projectId", "order");

-- ─── 2. Insert a default "Page 1" for every existing project ────────────────
--        Copy canvasBgColor / canvasBgImage into the page row.

INSERT INTO "pages" ("id", "projectId", "name", "order", "bgColor", "bgImage", "updatedAt")
SELECT
  'page_' || id,
  id,
  'Page 1',
  0,
  "canvasBgColor",
  "canvasBgImage",
  NOW()
FROM "projects";

-- ─── 3. Add pageId (nullable) to elements ───────────────────────────────────

ALTER TABLE "elements" ADD COLUMN "pageId" TEXT;

-- ─── 4. Back-fill pageId from the default page for each element ─────────────

UPDATE "elements" e
SET "pageId" = p."id"
FROM "pages" p
WHERE p."projectId" = e."projectId";

-- ─── 5. Make pageId NOT NULL and add the FK ─────────────────────────────────

ALTER TABLE "elements" ALTER COLUMN "pageId" SET NOT NULL;

ALTER TABLE "elements"
  ADD CONSTRAINT "elements_pageId_fkey"
  FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 6. Drop old projectId FK + index + column from elements ────────────────

DROP INDEX IF EXISTS "elements_projectId_idx";

ALTER TABLE "elements" DROP CONSTRAINT IF EXISTS "elements_projectId_fkey";
ALTER TABLE "elements" DROP COLUMN IF EXISTS "projectId";

-- ─── 7. Add new index on elements.pageId ────────────────────────────────────

CREATE INDEX "elements_pageId_idx" ON "elements"("pageId");

-- ─── 8. Drop bg columns from projects ───────────────────────────────────────

ALTER TABLE "projects" DROP COLUMN IF EXISTS "canvasBgColor";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "canvasBgImage";
