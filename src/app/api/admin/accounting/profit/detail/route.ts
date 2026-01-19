
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 10) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // yyyy-MM-dd

    if (!dateStr) {
        return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    try {
        const targetDate = parseISO(dateStr);
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);

        const [sales, purchases] = await Promise.all([
            prisma.saleItem.findMany({
                where: {
                    confirmed: true,
                    date: { gte: start, lte: end }
                },
                orderBy: { amount: 'desc' } // High value first? or created_at?
            }),
            prisma.purchaseItem.findMany({
                where: {
                    confirmed: true,
                    date: { gte: start, lte: end }
                },
                orderBy: { amount: 'desc' }
            })
        ]);

        return NextResponse.json({
            date: dateStr,
            sales,
            purchases,
            summary: {
                totalSales: sales.reduce((sum, item) => sum + item.amount, 0),
                totalPurchase: purchases.reduce((sum, item) => sum + item.amount, 0),
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch profit detail" }, { status: 500 });
    }
}
