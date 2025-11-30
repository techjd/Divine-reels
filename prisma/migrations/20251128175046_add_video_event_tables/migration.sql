/*
  Warnings:

  - You are about to drop the `VideoShareEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoViewEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoShareEvent" DROP CONSTRAINT "VideoShareEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoShareEvent" DROP CONSTRAINT "VideoShareEvent_videoId_fkey";

-- DropForeignKey
ALTER TABLE "VideoViewEvent" DROP CONSTRAINT "VideoViewEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoViewEvent" DROP CONSTRAINT "VideoViewEvent_videoId_fkey";

-- DropTable
DROP TABLE "VideoShareEvent";

-- DropTable
DROP TABLE "VideoViewEvent";

-- CreateTable
CREATE TABLE "VideoView" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoShare" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoView_videoId_createdAt_idx" ON "VideoView"("videoId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoShare_videoId_createdAt_idx" ON "VideoShare"("videoId", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoView" ADD CONSTRAINT "VideoView_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoShare" ADD CONSTRAINT "VideoShare_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
