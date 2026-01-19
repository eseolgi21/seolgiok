
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";

const ConfirmSchema = z.object({
    keywords: z.array(z.string()),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { keywords } = ConfirmSchema.parse(body);

        let where: Prisma.SaleItemWhereInput;

        if (keywords.length === 0) {
            // If no keywords, confirm ALL unconfirmed items
            where = { confirmed: false };
        } else {
            where = {
                OR: keywords.flatMap(k => [
                    { itemName: { contains: k, mode: "insensitive" } },
                    { category: { contains: k, mode: "insensitive" } },
                    { note: { contains: k, mode: "insensitive" } },
                    { paymentMethod: { contains: k, mode: "insensitive" } },
                ]),
                confirmed: false
            };
        }

        const result = await prisma.saleItem.updateMany({
            where,
            data: {
                confirmed: true,
            },
        });

        return NextResponse.json({ count: result.count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to confirm items" }, { status: 500 });
    }
}
