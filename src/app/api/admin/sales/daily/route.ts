
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

    const sales = await prisma.dailySales.findMany({
        where: {
            date: {
                gte: new Date(from),
                lte: new Date(to),
            },
        },
        orderBy: { date: "asc" },
    });

    return NextResponse.json(sales);
}

const PostSchema = z.object({
    date: z.string(), // YYYY-MM-DD
    salesAmount: z.number().min(0),
    costAmount: z.number().min(0),
    note: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const data = PostSchema.parse(body);
        const date = new Date(data.date);

        const record = await prisma.dailySales.upsert({
            where: { date },
            update: {
                salesAmount: data.salesAmount,
                costAmount: data.costAmount,
                note: data.note,
            },
            create: {
                date,
                salesAmount: data.salesAmount,
                costAmount: data.costAmount,
                note: data.note,
            },
        });

        return NextResponse.json(record);
    } catch {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
}
