
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Check card name distribution
    const cardStats = await prisma.cardTransaction.groupBy({
        by: ['cardName'],
        _count: true,
    });
    console.log("Card Name Distribution:");
    console.log(cardStats);

    const aggregate = await prisma.cardTransaction.aggregate({
        _min: { date: true },
        _max: { date: true },
        _count: true,
    });
    console.log("Transaction Summary:");
    console.log("Count:", aggregate._count);
    console.log("Min Date:", aggregate._min.date);
    console.log("Max Date:", aggregate._max.date);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
