
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 10) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Construct date range 
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    try {
        // 1. Fetch Sales (Grouped by Date)
        const sales = await prisma.saleItem.groupBy({
            by: ['date'],
            where: {
                confirmed: true,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { amount: true },
            _count: { _all: true }
        });

        // 2. Fetch Purchases (Grouped by Date)
        const purchases = await prisma.purchaseItem.groupBy({
            by: ['date'],
            where: {
                confirmed: true,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { amount: true },
            _count: { _all: true }
        });

        // 3. Merge Data into Day Map
        const dayMap = new Map<string, {
            date: string;
            sales: number;
            salesCount: number;
            purchase: number;
            purchaseCount: number;
            profit: number;
        }>();

        // Initialize all days in month
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        days.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            dayMap.set(dateStr, {
                date: dateStr,
                sales: 0,
                salesCount: 0,
                purchase: 0,
                purchaseCount: 0,
                profit: 0
            });
        });

        // Fill Sales
        sales.forEach(s => {
            const dateStr = format(new Date(s.date), "yyyy-MM-dd");
            const entry = dayMap.get(dateStr);
            if (entry) {
                entry.sales = s._sum.amount || 0;
                entry.salesCount = s._count._all;
                entry.profit += entry.sales; // Add sales to profit
            }
        });

        // Fill Purchases
        purchases.forEach(p => {
            const dateStr = format(new Date(p.date), "yyyy-MM-dd");
            const entry = dayMap.get(dateStr);
            if (entry) {
                entry.purchase = p._sum.amount || 0;
                entry.purchaseCount = p._count._all;
                entry.profit -= entry.purchase; // Subtract purchase from profit
            }
        });

        return NextResponse.json(Array.from(dayMap.values()));
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch profit calendar" }, { status: 500 });
    }
}
