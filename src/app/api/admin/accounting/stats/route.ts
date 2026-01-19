
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
        return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    // 1. Calculate Total Sales from SaleItem
    const salesAgg = await prisma.saleItem.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    // 2. Calculate Total Purchase from PurchaseItem
    const purchaseAgg = await prisma.purchaseItem.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    // 3. Fallback to DailySales if needed (ignoring for now as we want new system)
    // If we want to hybrid, we could add DailySales but that might double count if user uses both.

    const totalSales = salesAgg._sum.amount || 0;
    const totalPurchase = purchaseAgg._sum.amount || 0;
    const netProfit = totalSales - totalPurchase;

    return NextResponse.json({
        sales: totalSales,
        purchase: totalPurchase,
        profit: netProfit,
    });
}
