
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ItemSchema = z.object({
    date: z.string(),
    itemName: z.string().min(1),
    amount: z.number(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    note: z.string().optional(),
});

const BodySchema = z.object({
    items: z.array(ItemSchema).min(1),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { items } = BodySchema.parse(body);

        const data = items.map(item => ({
            date: new Date(item.date),
            itemName: item.itemName,
            amount: item.amount,
            category: item.category || "기타",
            paymentMethod: item.paymentMethod || "카드",
            note: item.note || "",
        }));

        const { count } = await prisma.saleItem.createMany({
            data,
        });

        return NextResponse.json({ success: true, count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
}
