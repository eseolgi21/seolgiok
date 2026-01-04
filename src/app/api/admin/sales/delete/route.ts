
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user || (session.user.level || 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { year, month, type } = await req.json();

        if (type === 'all') {
            const result = await prisma.cardTransaction.deleteMany({});
            return NextResponse.json({
                success: true,
                count: result.count,
                message: `전체 데이터 ${result.count}건이 삭제되었습니다.`
            });
        }

        if (!year || !month) {
            return NextResponse.json({ error: "Year and month are required" }, { status: 400 });
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        // Delete transactions where confirmedAt falls within the month
        // (Matching the analysis logic which uses confirmedAt)
        const result = await prisma.cardTransaction.deleteMany({
            where: {
                confirmedAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `${result.count} records deleted for ${year}-${month}`
        });

    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
    }
}
