
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin(10);
    if (error) return error;

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
