
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 10) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: "Start date and End date required" }, { status: 400 });
    }

    const startRange = startOfDay(parseISO(startDateStr));
    const endRange = endOfDay(parseISO(endDateStr));

    const settlementStart = new Date(startDateStr);
    const settlementEnd = new Date(endDateStr);

    try {
        // 1. Fetch Manual Inputs (Settlement Data)
        const settlement = await prisma.settlement.findUnique({
            where: {
                startDate_endDate: {
                    startDate: settlementStart,
                    endDate: settlementEnd
                }
            }
        });

        // 2. Fetch Total Sales (Consistent with Sales Analysis)
        // We use aggregate to ensure the numbers match exactly with Sales Analysis page.
        const salesAgg = await prisma.saleItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange }
            },
            _sum: { amount: true }
        });
        const totalRealSales = salesAgg._sum.amount || 0;

        // Fetch Cash Sales (PaymentMethod contains '현금')
        const cashSalesAgg = await prisma.saleItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange },
                paymentMethod: { contains: "현금" }
            },
            _sum: { amount: true }
        });
        const dbCashSales = cashSalesAgg._sum.amount || 0;

        // Card Sales = Total - Cash
        const dbCardSales = totalRealSales - dbCashSales;

        // 3. Fetch Total Purchase
        const purchaseAgg = await prisma.purchaseItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange }
            },
            _sum: { amount: true }
        });
        const totalPurchase = purchaseAgg._sum.amount || 0;

        // 4. Fetch Excluded Items for Purchase VAT
        // User Request: Exclude "Tax" (세금), "Labor(Freelance)" (인건비(프리)), "Labor(4-Ins)" (인건비(사대)).
        // Everything else should be included in VAT Base.

        const excludedAgg = await prisma.purchaseItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange },
                OR: [
                    { category: { contains: "세금" } },
                    { category: { contains: "인건비(프리)" } },
                    { category: { contains: "인건비(사대)" } }
                ]
            },
            _sum: { amount: true }
        });
        const excludedAmount = excludedAgg._sum.amount || 0;

        // --- CALCULATION LOGIC ---

        // Manual Inputs
        const reportedCashSales = settlement?.reportedCashSales || 0;

        // Gross Profit (매출 총이익)
        // User Request: This amount must match the "Sales Analysis" Total Amount.
        // So Gross Profit = Total Real Sales.
        const grossProfit = totalRealSales;

        // Actual VAT (실제 신고 부가세)
        // Formula: Sales VAT = (Card Sales + Reported Cash Sales) * 0.1
        //          Purchase VAT = (Total Purchase - Excluded Items) * 0.1

        const vatSalesBase = dbCardSales + reportedCashSales;
        const vatPurchaseBase = totalPurchase - excludedAmount;

        const salesVAT = Math.round(vatSalesBase * 0.1);
        const purchaseVAT = Math.round(vatPurchaseBase * 0.1);

        const actualVAT = salesVAT - purchaseVAT;

        // Net Profit (순수익)
        // Formula: Gross Profit - Total Purchase - Actual VAT
        // Note: grossProfit is now Total Sales.
        const netProfit = grossProfit - totalPurchase - actualVAT;

        return NextResponse.json({
            startDate: startDateStr,
            endDate: endDateStr,
            settlement: {
                reportedCashSales
            },
            data: {
                cardSales: dbCardSales,
                dbCashSales: dbCashSales,
                totalSales: totalRealSales,
                totalPurchase,
                laborCost: excludedAmount // field name is laborCost for compatibility, but represents excludedAmount
            },
            calculated: {
                grossProfit,
                vat: {
                    salesVAT,
                    purchaseVAT,
                    actualVAT
                },
                netProfit
            }
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch settlement data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 20) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { startDate, endDate, reportedCashSales } = body;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: "Start Date and End Date required" }, { status: 400 });
        }

        const settlementStart = new Date(startDate);
        const settlementEnd = new Date(endDate);

        const settlement = await prisma.settlement.upsert({
            where: {
                startDate_endDate: {
                    startDate: settlementStart,
                    endDate: settlementEnd
                }
            },
            update: {
                reportedCashSales: Number(reportedCashSales || 0)
            },
            create: {
                startDate: settlementStart,
                endDate: settlementEnd,
                reportedCashSales: Number(reportedCashSales || 0)
            }
        });

        return NextResponse.json({ success: true, settlement });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to save settlement data" }, { status: 500 });
    }
}
