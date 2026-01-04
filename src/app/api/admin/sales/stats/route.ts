
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "month"; // day, week, month, year
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    let start: Date, end: Date;

    if (type === "year") {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
    } else {
        // Default to month view for now
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
    }

    // Fetch all daily records in range
    const sales = await prisma.dailySales.findMany({
        where: {
            date: {
                gte: start,
                lte: end,
            },
        },
        orderBy: { date: "asc" },
    });

    return NextResponse.json({
        data: sales,
        summary: {
            totalSales: sales.reduce((acc, cur) => acc + cur.salesAmount, 0),
            totalCost: sales.reduce((acc, cur) => acc + cur.costAmount, 0),
        }
    });
}
