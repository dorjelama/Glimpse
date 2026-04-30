-- CreateTable
CREATE TABLE "pricing_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proMonthly" INTEGER NOT NULL DEFAULT 15,
    "businessMonthly" INTEGER NOT NULL DEFAULT 49,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_config_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row
INSERT INTO "pricing_config" ("id", "proMonthly", "businessMonthly", "currency", "updatedAt")
VALUES (1, 15, 49, 'USD', NOW())
ON CONFLICT ("id") DO NOTHING;
