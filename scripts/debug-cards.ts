import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const txs = await prisma.cardTransaction.findMany({ take: 5 });
    console.log("Sample Transactions:", txs);

    const groups = await prisma.cardTransaction.groupBy({
        by: ['cardName'],
        _count: true,
    });
    console.log("Card Groups:", groups);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
