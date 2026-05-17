import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const label = process.env.DB_LABEL ?? "로컬";
  const admins = await p.userInfo.findMany({
    where: { level: { gte: 21 } },
    select: {
      level: true,
      user: { select: { username: true, email: true } },
    },
    orderBy: { level: "desc" },
  });

  console.log(`\n=== ${label} DB 어드민 계정 (level ≥ 21) ===`);
  if (admins.length === 0) {
    console.log("없음 — seed 실행 전 어드민 계정 생성 필요");
  } else {
    admins.forEach((a) =>
      console.log(`  level ${a.level}: ${a.user.username} <${a.user.email}>`)
    );
  }

  const total = await p.user.count();
  console.log(`  전체 유저 수: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
