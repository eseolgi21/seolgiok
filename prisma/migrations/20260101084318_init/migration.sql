-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('NOTICE', 'EVENT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('QNA', 'ONE_TO_ONE');

-- CreateEnum
CREATE TYPE "BodyFormat" AS ENUM ('MARKDOWN', 'HTML');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('REFERRER', 'SPONSOR');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "boardType" "BoardType" NOT NULL,
    "supportCategory" "SupportCategory",
    "authorId" TEXT NOT NULL,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "title" TEXT NOT NULL,
    "bodyFormat" "BodyFormat" NOT NULL DEFAULT 'HTML',
    "bodyRaw" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "eventStartAt" TIMESTAMP(3),
    "eventEndAt" TIMESTAMP(3),
    "bannerUrl" TEXT,
    "ctaLinkUrl" TEXT,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceByline" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAssignment" (
    "postId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ReferralEdge" (
    "id" TEXT NOT NULL,
    "type" "EdgeType" NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "position" INTEGER,
    "groupNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" CITEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "countryCode" CHAR(2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "googleOtpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleOtpSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_boardType_isPublished_publishedAt_idx" ON "Post"("boardType", "isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_supportCategory_idx" ON "Post"("supportCategory");

-- CreateIndex
CREATE INDEX "Post_visibility_idx" ON "Post"("visibility");

-- CreateIndex
CREATE INDEX "Post_sourceUrl_idx" ON "Post"("sourceUrl");

-- CreateIndex
CREATE INDEX "Post_tags_idx" ON "Post" USING GIN ("tags" array_ops);

-- CreateIndex
CREATE INDEX "SupportAssignment_assigneeId_idx" ON "SupportAssignment"("assigneeId");

-- CreateIndex
CREATE INDEX "Attachment_postId_idx" ON "Attachment"("postId");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_isPrivate_idx" ON "Comment"("isPrivate");

-- CreateIndex
CREATE INDEX "ReferralEdge_parentId_type_idx" ON "ReferralEdge"("parentId", "type");

-- CreateIndex
CREATE INDEX "ReferralEdge_childId_type_idx" ON "ReferralEdge"("childId", "type");

-- CreateIndex
CREATE INDEX "ReferralEdge_parentId_createdAt_idx" ON "ReferralEdge"("parentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_direct_parent_per_tree" ON "ReferralEdge"("childId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_countryCode_idx" ON "User"("countryCode");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserInfo_userId_key" ON "UserInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInfo_referralCode_key" ON "UserInfo"("referralCode");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAssignment" ADD CONSTRAINT "SupportAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEdge" ADD CONSTRAINT "ReferralEdge_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEdge" ADD CONSTRAINT "ReferralEdge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInfo" ADD CONSTRAINT "UserInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
