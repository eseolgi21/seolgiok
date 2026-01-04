
import { auth } from "@/auth";
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

    // Default to current month if not specified
    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Ensure end date includes the entire day
    end.setHours(23, 59, 59, 999);

    const cardName = searchParams.get("card");

    console.log(`[Analysis API] Request: from=${from}, to=${to}, card=${cardName}`);
    console.log(`[Analysis API] Query Range: ${start.toISOString()} ~ ${end.toISOString()}`);

    try {
        const baseWhere = {
            confirmedAt: {
                gte: start,
                lte: end,
            },
        };

        // 1. Get available cards in this period for the filter dropdown
        const cardGroups = await prisma.cardTransaction.groupBy({
            by: ['cardName'],
            where: baseWhere,
        });
        const availableCards = cardGroups.map(g => g.cardName).filter(Boolean).sort();

        // 2. Main Analysis Grouping (with optional card filter)
        const where = {
            ...baseWhere,
            ...(cardName ? { cardName } : {}),
        };

        // 3. Separate Queries for Positive (Spending) and Negative (Refund) amounts
        // We do this to ensure refunds appear as separate list items even if the merchant has a positive net total.

        // A. Spending (Amount > 0)
        const spendingGroups = await prisma.cardTransaction.groupBy({
            by: ['merchant'],
            where: {
                ...where,
                amount: { gt: 0 }
            },
            _sum: { amount: true },
            _count: { _all: true },
        });

        // B. Refunds (Amount < 0)
        const refundGroups = await prisma.cardTransaction.groupBy({
            by: ['merchant'],
            where: {
                ...where,
                amount: { lt: 0 }
            },
            _sum: { amount: true },
            _count: { _all: true },
        });

        // C. Total Frequency (All transactions) - for "Frequency" chart
        const frequencyGroups = await prisma.cardTransaction.groupBy({
            by: ['merchant'],
            where: where, // No amount filter
            _count: { _all: true },
        });

        // Transform for "By Amount" list (Concatenate Spending + Refunds)
        const spendingData = spendingGroups.map(item => ({
            merchant: item.merchant,
            totalAmount: item._sum.amount ?? 0,
            count: item._count._all ?? 0,
        }));

        const refundData = refundGroups.map(item => ({
            merchant: item.merchant, // Same name, but negative amount entry
            totalAmount: item._sum.amount ?? 0,
            count: item._count._all ?? 0,
        }));

        // Merged list for display
        const combinedData = [...spendingData, ...refundData];

        // Top amounts (Spending & Refunds mixed, sorted by value)
        // Positive amounts will be at top, Negative amounts at bottom
        const byAmount = combinedData
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 100);

        // Top counts (Based on TOTAL frequency, not split)
        const byCount = frequencyGroups
            .map(item => ({
                merchant: item.merchant,
                count: item._count._all ?? 0,
                totalAmount: 0 // Not relevant for count chart
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        // Calculate Summary from the separate parts to ensure accuracy
        // Net Total = Sum(Spending) + Sum(Refunds)
        const totalSpending = spendingData.reduce((sum, i) => sum + i.totalAmount, 0);
        const totalRefund = refundData.reduce((sum, i) => sum + i.totalAmount, 0);
        const totalCount = frequencyGroups.reduce((sum, i) => sum + (i._count._all ?? 0), 0);

        return NextResponse.json({
            byAmount,
            byCount,
            byRefund: [], // Deprecated/Empty as requested (merged into byAmount)
            summary: {
                totalAmount: totalSpending + totalRefund,
                totalCount: totalCount,
            },
            availableCards,
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
