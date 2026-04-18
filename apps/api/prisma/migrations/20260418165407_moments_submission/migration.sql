-- CreateTable
CREATE TABLE "gallery_submissions" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "message" TEXT,
    "token" TEXT NOT NULL,
    "featuredPhotoId" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_submissions_token_key" ON "gallery_submissions"("token");

-- CreateIndex
CREATE INDEX "gallery_submissions_galleryId_idx" ON "gallery_submissions"("galleryId");

-- CreateIndex
CREATE INDEX "gallery_photos_submissionId_idx" ON "gallery_photos"("submissionId");

-- AddForeignKey
ALTER TABLE "gallery_submissions" ADD CONSTRAINT "gallery_submissions_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "gallery_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
