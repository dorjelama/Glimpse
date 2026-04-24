-- AlterTable
ALTER TABLE "gallery_submissions" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "consentGiven" BOOLEAN NOT NULL DEFAULT false;
