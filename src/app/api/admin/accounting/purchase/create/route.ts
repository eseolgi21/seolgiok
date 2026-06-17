
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware/admin-auth";

const ItemSchema = z.object({
    date: z.string(), // ISO string from frontend
    itemName: z.string().min(1),
    amount: z.number(),
    category: z.string().optional(),
    note: z.string().optional(),
});

const BodySchema = z.object({
    items: z.array(ItemSchema).min(1),
});

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { items } = BodySchema.parse(body);

        const data = items.map(item => ({
            date: new Date(item.date),
            itemName: item.itemName,
            amount: item.amount,
            category: item.category || "기타",
            note: item.note || "",
        }));

        const { count } = await prisma.purchaseItem.createMany({
            data,
        });

        return NextResponse.json({ success: true, count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
}
