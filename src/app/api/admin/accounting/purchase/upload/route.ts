
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Helper to find column index by fuzzy matching
function findColumn(headers: string[], keywords: string[]): string | undefined {
    return headers.find(h => h && typeof h === 'string' && keywords.some(k => k && h.toLowerCase().includes(k.toLowerCase())));
}

function parseDateSafe(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") {
        return new Date((value - 25569) * 86400000);
    }

    const strVal = String(value).trim();

    // Handle "YYYY년 MM월 DD일" format
    const koreanDateMatch = strVal.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (koreanDateMatch) {
        const year = parseInt(koreanDateMatch[1]);
        const month = parseInt(koreanDateMatch[2]) - 1; // Month is 0-indexed
        const day = parseInt(koreanDateMatch[3]);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(value as string | number | Date);
    if (isNaN(d.getTime())) return null;
    return d;
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

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "buffer" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // 1. Get Headers
        // sheet_to_json with header:1 returns array of arrays, first row is header
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
        if (rawData.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });


        // Get Custom Mappings from FormData
        const mapDate = formData.get("mapDate") as string;
        const mapItem = formData.get("mapItem") as string;
        const mapAmount = formData.get("mapAmount") as string;
        const mapCategory = formData.get("mapCategory") as string;
        const mapNote = formData.get("mapNote") as string;

        // Search for header row
        let headerIndex = 0;
        let headers: string[] = [];
        const dateKeywords = mapDate ? [mapDate] : ["date", "일자", "날짜", "시간", "거래일시"];

        for (let i = 0; i < Math.min(rawData.length, 20); i++) {
            const row = rawData[i].map(c => String(c).trim());
            if (findColumn(row, dateKeywords)) {
                headerIndex = i;
                headers = row;
                break;
            }
        }

        if (headers.length === 0) {
            console.log("No valid header row found in first 20 rows. Using first row.");
            headers = rawData[0].map(h => String(h).trim());
            headerIndex = 0;
        } else {
            console.log(`Found header row at index ${headerIndex}:`, headers);
        }

        const rows = rawData.slice(headerIndex + 1);

        // 2. Find Column Mappings (User input > Defaults)
        console.log("Using mappings:", { mapDate, mapItem, mapAmount, mapCategory, mapNote });

        const colDate = findColumn(headers, dateKeywords);
        const colItem = findColumn(headers, mapItem ? [mapItem] : ["item", "name", "품목", "상품", "내역", "적요", "보낸분/받는분", "가맹점명"]);
        const colAmount = findColumn(headers, mapAmount ? [mapAmount] : ["amount", "price", "cost", "금액", "가격", "출금액", "이용금액"]);
        const colCategory = findColumn(headers, mapCategory ? [mapCategory] : ["category", "type", "분류", "구분", "분야"]);
        const colNote = findColumn(headers, mapNote ? [mapNote] : ["note", "memo", "비고", "메모", "송금메모", "카드명"]);

        console.log("Resolved Columns:", { colDate, colItem, colAmount, colCategory, colNote });

        if (!colDate || !colItem || !colAmount) {
            const missing = [];
            if (!colDate) missing.push(`Date (keywords: ${dateKeywords.join(', ')})`);
            if (!colItem) missing.push(`Item (keywords: ${mapItem || 'default'})`);
            if (!colAmount) missing.push(`Amount (keywords: ${mapAmount || 'default'})`);

            const errorMsg = `Missing required columns: ${missing.join(', ')}. Found headers in row ${headerIndex + 1}: ${headers.join(", ")}`;
            console.error("Upload Failed:", errorMsg);

            return NextResponse.json({
                error: errorMsg
            }, { status: 400 });
        }

        // Map header name to index
        const idxDate = headers.indexOf(colDate);
        const idxItem = headers.indexOf(colItem);
        const idxAmount = headers.indexOf(colAmount);
        const idxCategory = colCategory ? headers.indexOf(colCategory) : -1;
        const idxNote = colNote ? headers.indexOf(colNote) : -1;

        const createInput = [];
        let debugRows = 0;

        for (const row of rows) {
            // Debug first 5 rows
            if (debugRows < 5) {
                console.log(`Processing Row ${debugRows}:`, {
                    rawItem: row[idxItem],
                    rawAmount: row[idxAmount],
                    rawDate: row[idxDate]
                });
            }

            if (!row[idxItem] && !row[idxAmount]) {
                if (debugRows < 5) console.log("-> Skipped: No item/amount");
                debugRows++;
                continue;
            }

            const dateVal = parseDateSafe(row[idxDate]);
            if (!dateVal) {
                if (debugRows < 5) console.log("-> Skipped: Invalid Date", row[idxDate]);
                debugRows++;
                continue;
            }

            // Fix: Remove commas before parsing number
            const rawAmount = String(row[idxAmount]).replace(/,/g, "");
            const amount = Number(rawAmount) || 0;

            if (amount === 0) {
                if (debugRows < 5) console.log("-> Skipped: Zero Amount", row[idxAmount]);
                debugRows++;
                continue;
            }

            createInput.push({
                date: dateVal,
                itemName: String(row[idxItem]),
                amount: amount,
                category: idxCategory > -1 ? String(row[idxCategory]) : "기타",
                note: idxNote > -1 ? String(row[idxNote]) : "",
            });
            debugRows++;
        }

        console.log(`Total valid rows created: ${createInput.length}`);

        if (createInput.length === 0) {
            return NextResponse.json({ message: "No valid rows found. Check server logs for details." }, { status: 400 });
        }

        const { count } = await prisma.purchaseItem.createMany({
            data: createInput,
        });

        return NextResponse.json({ success: true, count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to process excel: " + (e as Error).message }, { status: 500 });
    }
}
