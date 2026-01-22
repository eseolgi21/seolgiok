
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

        // 2. Fetch Total Sales SPLIT by Payment Method
        // We identify "Cash Sales" in DB by 'paymentMethod' containing '현금'.
        const allSales = await prisma.saleItem.findMany({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange }
            },
            select: { amount: true, paymentMethod: true }
        });

        let dbCardSales = 0;
        let dbCashSales = 0;

        allSales.forEach(item => {
            const isCash = item.paymentMethod && item.paymentMethod.includes("현금");
            if (isCash) {
                dbCashSales += item.amount;
            } else {
                dbCardSales += item.amount;
            }
        });

        const totalRealSales = dbCardSales + dbCashSales;

        // 3. Fetch Total Purchase
        const purchaseAgg = await prisma.purchaseItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange }
            },
            _sum: { amount: true }
        });
        const totalPurchase = purchaseAgg._sum.amount || 0;

        // 4. Fetch Labor Costs (Total vs Urgent)
        // User Request: Exclude "Labor Cost" from VAT Base, BUT KEEP "Labor Cost(Urgent)" in VAT Base.
        // So we need to find Total Labor ("인건비") and subtract Urgent Labor ("인건비(급구)") from it.
        // The result (Pure Labor) will be subtracted from Purchase.

        const laborAgg = await prisma.purchaseItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange },
                category: { contains: "인건비" }
            },
            _sum: { amount: true }
        });
        const totalLabor = laborAgg._sum.amount || 0;

        const urgentLaborAgg = await prisma.purchaseItem.aggregate({
            where: {
                confirmed: true,
                date: { gte: startRange, lte: endRange },
                category: { contains: "인건비(급구)" }
            },
            _sum: { amount: true }
        });
        const urgentLabor = urgentLaborAgg._sum.amount || 0;

        // Labor Cost to Exclude from VAT Base
        const laborCost = totalLabor - urgentLabor;

        // --- CALCULATION LOGIC ---

        // Manual Inputs
        const reportedCashSales = settlement?.reportedCashSales || 0;
        const managerRentSupport = settlement?.managerRentSupport || 0;

        // Gross Profit (매출 총이익)
        // Correct Logic: Real Sales (Card + Cash) - Total Purchase
        const grossProfit = totalRealSales - totalPurchase;

        // Actual VAT (실제 신고 부가세)
        // User request: VAT should be 10% of amount (Supply Value logic).
        // Formula: Sales VAT = (Card Sales + Reported Cash Sales) * 0.1
        //          Purchase VAT = (Total Purchase - Labor Cost) * 0.1

        const vatSalesBase = dbCardSales + reportedCashSales;
        const vatPurchaseBase = totalPurchase - laborCost;

        console.log(`[Settlement Debug] Range: ${startDateStr}~${endDateStr}`);
        console.log(`[Settlement Debug] Labor Breakdown:`);
        console.log(`- Total Labor (인건비): ${totalLabor}`);
        console.log(`- Urgent Labor (인건비(급구)): ${urgentLabor}`);
        console.log(`- Excluded Labor (Total - Urgent): ${laborCost}`);
        console.log(`[Settlement Debug] VAT Calculation:`);
        console.log(`- Sales Base (Card ${dbCardSales} + CashReport ${reportedCashSales}): ${vatSalesBase}`);
        console.log(`- Purchase Base (Total ${totalPurchase} - ExcludedLabor ${laborCost}): ${vatPurchaseBase}`);

        const salesVAT = Math.round(vatSalesBase * 0.1);
        const purchaseVAT = Math.round(vatPurchaseBase * 0.1);

        console.log(`- Sales VAT (*0.1): ${salesVAT}`);
        console.log(`- Purchase VAT (*0.1): ${purchaseVAT}`);

        const actualVAT = salesVAT - purchaseVAT;

        // Net Profit (순수익)
        const netProfit = grossProfit - actualVAT - managerRentSupport;

        return NextResponse.json({
            startDate: startDateStr,
            endDate: endDateStr,
            settlement: {
                reportedCashSales,
                managerRentSupport
            },
            data: {
                cardSales: dbCardSales,
                dbCashSales: dbCashSales,
                totalSales: totalRealSales, // Real Total Sales for Gross Profit display
                totalPurchase,
                laborCost
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
        const { startDate, endDate, reportedCashSales, managerRentSupport } = body;

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
                reportedCashSales: Number(reportedCashSales || 0),
                managerRentSupport: Number(managerRentSupport || 0)
            },
            create: {
                startDate: settlementStart,
                endDate: settlementEnd,
                reportedCashSales: Number(reportedCashSales || 0),
                managerRentSupport: Number(managerRentSupport || 0)
            }
        });

        return NextResponse.json({ success: true, settlement });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to save settlement data" }, { status: 500 });
    }
}
