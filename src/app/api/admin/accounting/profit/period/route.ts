
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, eachDayOfInterval, format, parseISO, isValid } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 10) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }

    const start = startOfDay(parseISO(startDateStr));
    const end = endOfDay(parseISO(endDateStr));

    if (!isValid(start) || !isValid(end)) {
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    try {
        // 1. Fetch Sales (Grouped by Date)
        const sales = await prisma.saleItem.groupBy({
            by: ['date'],
            where: {
                confirmed: true,
                date: {
                    gte: start,
                    lte: end
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
                    gte: start,
                    lte: end
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

        // Initialize all days in range (if reasonable range, e.g. < 365 days)
        // If range is too huge, skipping empty days might be better, but let's stick to consistent daily format.
        const days = eachDayOfInterval({ start, end });
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
                entry.profit += entry.sales;
            }
        });

        // Fill Purchases
        purchases.forEach(p => {
            const dateStr = format(new Date(p.date), "yyyy-MM-dd");
            const entry = dayMap.get(dateStr);
            if (entry) {
                entry.purchase = p._sum.amount || 0;
                entry.purchaseCount = p._count._all;
                entry.profit -= entry.purchase;
            }
        });

        const dailyStats = Array.from(dayMap.values());

        // Calculate Totals
        const summary = {
            totalSales: dailyStats.reduce((acc, cur) => acc + cur.sales, 0),
            totalPurchase: dailyStats.reduce((acc, cur) => acc + cur.purchase, 0),
            totalProfit: dailyStats.reduce((acc, cur) => acc + cur.profit, 0),
        };

        return NextResponse.json({ summary, dailyStats });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch profit period stats" }, { status: 500 });
    }
}
