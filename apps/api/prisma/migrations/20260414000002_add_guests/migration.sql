-- Migration: add_guests
-- Adds a guests table for personalised invitation links.

CREATE TABLE "guests" (
  "id"        TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT,
  "token"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guests_token_key" UNIQUE ("token"),
  CONSTRAINT "guests_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "guests_projectId_idx" ON "guests"("projectId");
CREATE INDEX "guests_token_idx" ON "guests"("token");
