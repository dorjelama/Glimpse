-- Migration: add_page_transition
-- Adds a pageTransition column to projects for controlling page-change animation in the public viewer.

ALTER TABLE "projects" ADD COLUMN "pageTransition" TEXT NOT NULL DEFAULT 'none';
