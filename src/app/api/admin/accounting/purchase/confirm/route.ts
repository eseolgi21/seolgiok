
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

        let where: Prisma.PurchaseItemWhereInput;

        if (keywords.length === 0) {
            // If no keywords, confirm ALL unconfirmed items
            where = { confirmed: false };
        } else {
            // If keywords exist, confirm matching unconfirmed items
            where = {
                OR: keywords.flatMap(k => [
                    { itemName: { contains: k, mode: "insensitive" } },
                    { category: { contains: k, mode: "insensitive" } },
                    { note: { contains: k, mode: "insensitive" } },
                ]),
                confirmed: false
            };
        }

        // 1. Fetch candidates
        const candidates = await prisma.purchaseItem.findMany({ where });

        if (candidates.length === 0) {
            return NextResponse.json({ count: 0 });
        }

        // 2. Fetch existing confirmed items for the relevant dates
        const candidateDates = candidates.map(c => c.date);
        const existingItems = await prisma.purchaseItem.findMany({
            where: {
                confirmed: true,
                date: { in: candidateDates }
            }
        });

        // Create a Set of signatures for existing items: "Time_ItemName_Amount"
        const existingSignatures = new Set<string>();
        existingItems.forEach(item => {
            const sig = `${item.date.getTime()}_${item.itemName.trim()}_${item.amount}`;
            existingSignatures.add(sig);
        });

        const idsToDelete: string[] = [];
        const idsToConfirm: string[] = [];

        // 3. Filter candidates
        for (const candidate of candidates) {
            const sig = `${candidate.date.getTime()}_${candidate.itemName.trim()}_${candidate.amount}`;
            if (existingSignatures.has(sig)) {
                idsToDelete.push(candidate.id);
            } else {
                idsToConfirm.push(candidate.id);
                // Optional: Add to signatures so we don't allow duplicates within the batch itself?
                // The user asked to filter based on "existing data". 
                // However, preventing self-duplication inside the batch is also good practice if the batch contains duplicates.
                // But typically batch is from one file. Let's strictly follow "existing data" for now, or add to set to be safe.
                existingSignatures.add(sig);
            }
        }

        // 4. Execute updates/deletes in transaction
        await prisma.$transaction([
            prisma.purchaseItem.deleteMany({
                where: { id: { in: idsToDelete } }
            }),
            prisma.purchaseItem.updateMany({
                where: { id: { in: idsToConfirm } },
                data: { confirmed: true }
            })
        ]);

        return NextResponse.json({ count: idsToConfirm.length, deleted: idsToDelete.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to confirm items" }, { status: 500 });
    }
}
