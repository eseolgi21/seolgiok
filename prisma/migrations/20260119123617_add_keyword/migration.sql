-- CreateEnum
CREATE TYPE "KeywordType" AS ENUM ('PURCHASE', 'SALES');

-- CreateTable
CREATE TABLE "SearchKeyword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchKeyword_userId_type_idx" ON "SearchKeyword"("userId", "type");

-- AddForeignKey
ALTER TABLE "SearchKeyword" ADD CONSTRAINT "SearchKeyword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
