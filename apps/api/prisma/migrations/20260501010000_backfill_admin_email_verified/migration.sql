-- Backfill: any existing ADMIN should have a verified email so they can publish.
-- The publish guard at publish.controller.ts already bypasses admins by role,
-- but we keep the data consistent: ADMIN implies trust, which implies verified email.
UPDATE "users"
SET "emailVerified" = true,
    "emailVerificationToken" = NULL
WHERE "role" = 'ADMIN'
  AND "emailVerified" = false;
