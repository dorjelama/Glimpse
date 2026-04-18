-- CreateTable: projects (parent "Event" in UI)
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: galleries (Moments scaffold)
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "galleries_projectId_key" ON "galleries"("projectId");

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add projectId to events
ALTER TABLE "events" ADD COLUMN "projectId" TEXT;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: create a Project for every existing Event and link them
-- Uses a CTE to insert projects and capture their ids alongside the event ids
WITH inserted AS (
    INSERT INTO "projects" ("id", "title", "ownerId", "createdAt", "updatedAt")
    SELECT
        'proj_' || substr(md5(random()::text), 1, 12),
        title,
        "ownerId",
        "createdAt",
        NOW()
    FROM "events"
    WHERE "ownerId" IS NOT NULL
    RETURNING id, title, "ownerId", "createdAt"
)
UPDATE "events" e
SET "projectId" = i.id
FROM inserted i
WHERE i."ownerId" = e."ownerId"
  AND i.title = e.title
  AND i."createdAt" = e."createdAt";
