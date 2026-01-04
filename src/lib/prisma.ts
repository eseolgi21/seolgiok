
// lib/prisma.ts
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

// 타입 안전한 globalThis 캐시 (dev에서만 사용)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 필요 시 로깅 옵션/쿼리 이벤트 등 추가 가능
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // log: ["query", "error", "warn"], // 필요 시 활성화
  });

// 개발 환경에서만 글로벌에 보관하여 핫리로드 시 재사용
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
