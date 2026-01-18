
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Helper to parse "2025년 12월 28일" or basic strings
function parseKoreanDate(str: unknown): Date | null {
    if (!str) return null;
    if (typeof str === 'number') {
        // Excel serial date
        return new Date((str - (25567 + 2)) * 86400 * 1000);
    }
    if (str instanceof Date) return str;

    // "2025년 12월 28일" -> "2025-12-28"
    const s = String(str).replace(/년/g, '-').replace(/월/g, '-').replace(/일/g, '').replace(/ /g, '');
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function parseCurrency(str: unknown): number {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    // "138,230원" -> 138230
    return parseInt(String(str).replace(/[^0-9-]/g, ''), 10);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user.level ?? 0) < 21) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 1. Find Header Row dynamically
        // Convert to array of arrays to scan for the header
        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        let headerRowIndex = 0;

        for (let i = 0; i < Math.min(aoa.length, 20); i++) {
            const row = aoa[i];
            // Check if this row looks like a header (contains "승인번호")
            if (row && row.some((cell: unknown) => String(cell).includes("승인번호"))) {
                headerRowIndex = i;
                break;
            }
        }

        // 2. Parse with correct range
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });



        // Debug: Log first row keys to verify mapping
        if (rows.length > 0) {
            console.log("Parsed Header Keys:", Object.keys(rows[0]));
        }

        // Find specific column keys based on the detected header row (rows[0])
        const headerRow = rows.length > 0 ? rows[0] : {}; // Use the first row as the header reference
        const keys = Object.keys(headerRow);

        const approvalKey = keys.find(k => k.includes("승인번호")) || "승인번호";
        const amountKey = keys.find(k => k.includes("이용금액")) || "이용금액";
        const dateKey = keys.find(k => k.includes("이용일")) || "이용일";
        const confirmedKey = keys.find(k => k.includes("확정일")) || "확정일";

        // Improved Card Name Detection:
        // Priority 1: Exact match for the user's specific header format "카드명(카드번호...)"
        // Priority 2: "카드명" (Card Name)
        // Priority 3: Fuzzy "카드" but strict exclusions
        const cardNameKey = keys.find(k => k.includes("카드명") && k.includes("번호")) ||
            keys.find(k => k.includes("카드명")) ||
            keys.find(k => k.includes("카드") && !k.includes("승인") && !k.includes("구분") && !k.includes("번호"));

        const merchantKey = keys.find(k => k.includes("가맹점")) || "가맹점명";
        const bizNoKey = keys.find(k => k.includes("사업자")) || "사업자번호";
        const installKey = keys.find(k => k.includes("할부")) || "할부개월";

        // Process rows and prepare data for batch insert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validData: any[] = [];
        let failCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Skip the header row itself if it's included in `rows`
            if (i === 0 && Object.keys(row).every(key => keys.includes(key))) {
                continue;
            }

            const approvalNo = String(row[approvalKey] || "").trim();
            if (!approvalNo) {
                failCount++;
                continue;
            }

            validData.push({
                approvalNo,
                date: parseKoreanDate(row[dateKey]) ?? new Date(),
                confirmedAt: parseKoreanDate(row[confirmedKey]),
                cardName: (cardNameKey && row[cardNameKey]) ? String(row[cardNameKey]).trim() : "",
                merchant: row[merchantKey] || "",
                bizNo: row[bizNoKey] || null,
                installment: row[installKey] || "00개월",
                amount: parseCurrency(row[amountKey]),
            });
        }

        try {
            // Use createMany with skipDuplicates: true
            // This efficiently inserts new records and ignores existing approvalNos ("ON CONFLICT DO NOTHING")
            // The result.count will only reflect the number of NEWLY inserted rows.
            const result = await prisma.cardTransaction.createMany({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: validData as any,
                skipDuplicates: true,
            });

            return NextResponse.json({
                success: true,
                count: result.count, // Only counts actually inserted rows (duplicates excluded)
                failed: failCount
            });

        } catch (e) {
            console.error("Batch insert failed:", e);
            // Fallback or reporting? createMany fails as a whole if data types are wrong.
            return NextResponse.json({ error: "Batch processing failed. Check file format." }, { status: 500 });
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
