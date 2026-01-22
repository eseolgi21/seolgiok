import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import officeCrypto from "officecrypto-tool";
import { toHalfWidth } from "@/lib/string-utils";

// Helper to find column index by fuzzy matching
function findColumn(headers: string[], keywords: string[]): string | undefined {
    return headers.find(h => h && typeof h === 'string' && keywords.some(k => k && h.toLowerCase().includes(k.toLowerCase())));
}

function parseDateSafe(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) {
        const d = new Date(value);
        d.setHours(12, 0, 0, 0); // Normalize to noon
        return d;
    }
    if (typeof value === "number") {
        const d = new Date((value - 25569) * 86400000);
        d.setHours(12, 0, 0, 0); // Normalize to noon
        return d;
    }

    const strVal = String(value).trim();

    // Handle "YYYY년 MM월 DD일" format
    const koreanDateMatch = strVal.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (koreanDateMatch) {
        const year = parseInt(koreanDateMatch[1]);
        const month = parseInt(koreanDateMatch[2]) - 1;
        const day = parseInt(koreanDateMatch[3]);
        const d = new Date(year, month, day);
        d.setHours(12, 0, 0, 0); // Normalize to noon
        if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(value as string | number | Date);
    if (!isNaN(d.getTime())) {
        d.setHours(12, 0, 0, 0); // Normalize to noon
        return d;
    }
    return null;
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

        // Get Custom Mappings
        const mapDate = formData.get("mapDate") as string;
        const mapItem = formData.get("mapItem") as string;
        const mapAmount = formData.get("mapAmount") as string;
        const mapCategory = formData.get("mapCategory") as string;
        const mapPayment = formData.get("mapPayment") as string;
        const mapNote = formData.get("mapNote") as string;
        const password = formData.get("password") as string;

        const arrayBuffer = await file.arrayBuffer();
        let bufferToRead: ArrayBuffer | Uint8Array = arrayBuffer;

        if (password && password.trim()) {
            try {
                const fileBuffer = Buffer.from(arrayBuffer);
                const decrypted = await officeCrypto.decrypt(fileBuffer, { password: password.trim() });
                bufferToRead = decrypted;
            } catch (e: unknown) {
                console.error("Decryption failed:", e);
                return NextResponse.json({ error: "비밀번호가 올바르지 않거나 복호화에 실패했습니다." }, { status: 400 });
            }
        }

        let wb;
        try {
            wb = XLSX.read(bufferToRead, { type: "array", cellDates: true });
        } catch (e: unknown) {
            console.error("XLSX Read Error:", e);
            return NextResponse.json({ error: "엑셀 파일을 읽을 수 없습니다. 형식을 확인해주세요." }, { status: 400 });
        }
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
        if (rawData.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });

        // Search for header row (Robust Scoring System from Purchase Upload)
        let headerIndex = 0;
        let headers: string[] = [];
        let maxScore = 0;

        const defaultDateKeywords = ["date", "일자", "날짜", "시간", "거래일시"];
        const defaultItemKeywords = ["item", "name", "품목", "상품", "내역", "적요", "보낸분/받는분", "출금표시내용", "가맹점명", "기재내용", "상호명"];
        const defaultAmountKeywords = ["amount", "price", "cost", "금액", "가격", "입금액", "승인금액", "이용금액", "맡기신금액"];

        const targetKeywords = new Set<string>();
        if (mapDate) targetKeywords.add(mapDate);
        if (mapItem) targetKeywords.add(mapItem);
        if (mapAmount) targetKeywords.add(mapAmount);

        // Add defaults to target keywords for row detection to be robust
        defaultDateKeywords.forEach(k => targetKeywords.add(k));
        defaultItemKeywords.forEach(k => targetKeywords.add(k));
        defaultAmountKeywords.forEach(k => targetKeywords.add(k));

        for (let i = 0; i < Math.min(rawData.length, 100); i++) {
            const row = rawData[i].map(c => String(c).trim());
            let score = 0;

            // Check overlaps
            row.forEach(cell => {
                if (cell && Array.from(targetKeywords).some(k => cell.toLowerCase().includes(k.toLowerCase()))) {
                    score++;
                }
            });

            // Boost score if it contains specific user mappings
            if (mapDate && findColumn(row, [mapDate])) score += 3;
            if (mapItem && findColumn(row, [mapItem])) score += 3;
            if (mapAmount && findColumn(row, [mapAmount])) score += 3;

            if (score > maxScore) {
                maxScore = score;
                headerIndex = i;
                headers = row;
            }
        }

        if (maxScore === 0) {
            headers = rawData[0].map(h => String(h).trim());
            headerIndex = 0;
        }

        const rows = rawData.slice(headerIndex + 1);

        // 2. Find Column Mappings (User input > Defaults)

        // Helper to resolve column with fallback
        const resolveColumn = (userMap: string | null, defaults: string[]) => {
            // Priority 1: User Mapping
            if (userMap) {
                const found = findColumn(headers, [userMap]);
                if (found) return found;
            }
            // Priority 2: Defaults
            return findColumn(headers, defaults);
        };

        const colDate = resolveColumn(mapDate, defaultDateKeywords);
        const colItem = resolveColumn(mapItem, defaultItemKeywords);
        const colAmount = resolveColumn(mapAmount, defaultAmountKeywords);
        const colCategory = resolveColumn(mapCategory, ["category", "type", "분류", "구분", "적요"]);
        const colPayment = resolveColumn(mapPayment, ["payment", "method", "결제", "카드", "수단", "지불", "입금통장"]);
        const colNote = resolveColumn(mapNote, ["note", "memo", "비고", "메모"]);

        if (!colDate || !colItem || !colAmount) {
            const missing = [];
            if (!colDate) missing.push(`Date (User: ${mapDate}, Defaults: ${defaultDateKeywords.join(', ')})`);
            if (!colItem) missing.push(`Item (User: ${mapItem}, Defaults: ${defaultItemKeywords.join(', ')})`);
            if (!colAmount) missing.push(`Amount (User: ${mapAmount}, Defaults: ${defaultAmountKeywords.join(', ')})`);

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
        const idxPayment = colPayment ? headers.indexOf(colPayment) : -1;
        const idxNote = colNote ? headers.indexOf(colNote) : -1;

        // Fetch classifications
        const classifications = await prisma.itemClassification.findMany({
            where: { type: "SALES" }
        });
        const classMap = new Map<string, string>();
        classifications.forEach((c) => classMap.set(c.itemName, c.category));

        // Fetch Global Filters
        const filters = await prisma.excelFilter.findMany({
            where: { type: "SALES" }
        });
        const globalExclude = filters.filter((f) => !f.isInclude).map((f) => toHalfWidth(f.keyword).toLowerCase());
        const globalInclude = filters.filter((f) => f.isInclude).map((f) => toHalfWidth(f.keyword).toLowerCase());

        const createInput = [];

        const filterExcludeStr = formData.get("filterExclude") as string;
        const filterIncludeStr = formData.get("filterInclude") as string;
        const filterMode = (formData.get("filterMode") as string) || "EXCLUDE";

        const runtimeExclude = filterExcludeStr ? filterExcludeStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
        const runtimeInclude = filterIncludeStr ? filterIncludeStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as (string | number | undefined)[];
            if (!row || row.length === 0) continue;

            if (!row[idxItem] && !row[idxAmount]) {
                continue;
            }

            const itemName = String(row[idxItem]).trim();
            const normalizedItemName = toHalfWidth(itemName).toLowerCase();

            // Get other fields for filtering
            const rawCategory = idxCategory > -1 ? String(row[idxCategory]).trim() : "";
            const normalizedCategory = toHalfWidth(rawCategory).toLowerCase();

            const rawNote = idxNote > -1 ? String(row[idxNote]).trim() : "";
            const normalizedNote = toHalfWidth(rawNote).toLowerCase();

            const rawPayment = idxPayment > -1 ? String(row[idxPayment]).trim() : "";
            const normalizedPayment = toHalfWidth(rawPayment).toLowerCase();

            const rowContent = (normalizedItemName + " " + normalizedCategory + " " + normalizedNote + " " + normalizedPayment);
            const contentToCheck = (normalizedItemName + normalizedCategory + normalizedNote + normalizedPayment);

            // Filter Logic based on Mode
            if (filterMode === "ALL") {
                // No filters applied
            } else if (filterMode === "EXCLUDE") {
                if (runtimeExclude.some((k: string) => rowContent.includes(k))) {
                    continue;
                }
                if (globalExclude.some((k: string) => contentToCheck.includes(k))) {
                    continue;
                }
            } else if (filterMode === "INCLUDE") {
                const allIncludes = [...runtimeInclude, ...globalInclude];
                if (allIncludes.length > 0) {
                    if (!allIncludes.some((k: string) => rowContent.includes(k))) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            const dateVal = parseDateSafe(row[idxDate]);
            if (!dateVal) {
                continue;
            }

            // Fix: Remove non-numeric characters to store absolute value
            const rawAmount = String(row[idxAmount]).replace(/[^0-9.-]/g, "");
            const amount = Number(rawAmount) || 0;

            if (amount === 0) {
                continue;
            }

            const finalCategory = classMap.has(itemName)
                ? classMap.get(itemName)!
                : (idxCategory > -1 ? String(row[idxCategory]) : "기타");

            createInput.push({
                date: dateVal,
                category: finalCategory,
                itemName: itemName,
                amount: amount,
                paymentMethod: idxPayment > -1 ? String(row[idxPayment]) : "기타",
                note: idxNote > -1 ? String(row[idxNote]) : "",
            });
        }


        if (createInput.length === 0) {
            return NextResponse.json({ message: "No valid rows found" }, { status: 400 });
        }

        // Delete existing unconfirmed items before uploading new ones
        await prisma.saleItem.deleteMany({
            where: { confirmed: false }
        });

        const { count } = await prisma.saleItem.createMany({
            data: createInput,
        });

        return NextResponse.json({ success: true, count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to process excel: " + (e as Error).message }, { status: 500 });
    }
}
