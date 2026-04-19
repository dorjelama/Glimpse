-- CreateTable
CREATE TABLE "submission_reactions" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "submission_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_reactions_submissionId_idx" ON "submission_reactions"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_reactions_submissionId_sessionId_emoji_key" ON "submission_reactions"("submissionId", "sessionId", "emoji");

-- AddForeignKey
ALTER TABLE "submission_reactions" ADD CONSTRAINT "submission_reactions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "gallery_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
