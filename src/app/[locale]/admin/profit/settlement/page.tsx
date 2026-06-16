
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type SettlementData = {
    startDate: string;
    endDate: string;
    settlement: {
        reportedCashSales: number;
    };
    data: {
        cardSales: number;
        dbCashSales: number;
        totalSales: number;
        totalPurchase: number;
        laborCost: number;
    };
    calculated: {
        grossProfit: number;
        vat: {
            salesVAT: number;
            purchaseVAT: number;
            actualVAT: number;
        };
        netProfit: number;
    };
};

export default function ProfitSettlementPage() {
    // Default to this month
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<SettlementData | null>(null);

    // Form inputs
    const [reportedCashSales, setReportedCashSales] = useState<string>("");

    const fetchData = useCallback(async (startOverride?: string, endOverride?: string) => {
        const queryStart = startOverride || startDate;
        const queryEnd = endOverride || endDate;

        if (!queryStart || !queryEnd) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/accounting/profit/settlement?startDate=${queryStart}&endDate=${queryEnd}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setReportedCashSales(json.settlement.reportedCashSales.toString());
            } else {
                setData(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const storedStart = localStorage.getItem("settlement_startDate");
        const storedEnd = localStorage.getItem("settlement_endDate");

        if (storedStart && storedEnd) {
            setStartDate(storedStart);
            setEndDate(storedEnd);
            fetchData(storedStart, storedEnd);
        } else {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        localStorage.setItem("settlement_startDate", startDate);
        localStorage.setItem("settlement_endDate", endDate);
        fetchData();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/accounting/profit/settlement`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    reportedCashSales: Number(reportedCashSales)
                }),
            });

            if (res.ok) {
                await fetchData(); // Refresh data to update calculations
                alert("저장되었습니다.");
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">순수익 정산</h1>
                    <p className="text-sm text-gray-500 mt-1">지정된 기간의 순수익을 정산합니다.</p>
                </div>
            </div>

            {/* Date Range Selector */}
            <Card>
                <CardContent className="p-4 flex-row items-end gap-4 flex">
                    <div className="space-y-1">
                        <Label>시작일</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>종료일</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
                        조회
                    </Button>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <Card className="h-fit">
                        <CardContent className="p-5">
                            <CardTitle className="text-base mb-4">정산 항목 입력 ({data.startDate} ~ {data.endDate})</CardTitle>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold">현금매출 신고액</Label>
                                    <span className="text-sm text-gray-500">부가세 계산 시 합산됩니다.</span>
                                </div>
                                <div className="flex">
                                    <Input
                                        type="number"
                                        className="rounded-r-none"
                                        value={reportedCashSales}
                                        onChange={(e) => setReportedCashSales(e.target.value)}
                                    />
                                    <Button variant="outline" className="rounded-l-none border-l-0 cursor-default hover:bg-background" disabled>원</Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "저장 및 재계산"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Calculation Display Section */}
                    <div className="space-y-6">
                        {/* 1. Gross Profit */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-600">1. 기간 총 매출</h3>
                                    <span className="text-xl font-bold">{data.calculated.grossProfit.toLocaleString()} 원</span>
                                </div>
                                <div className="text-xs text-gray-500 flex flex-col gap-1 bg-gray-50 p-3 rounded">
                                    <div className="flex justify-between">
                                        <span>총 실제 매출 (카드+현금):</span>
                                        <span>+{data.data.totalSales.toLocaleString()}</span>
                                    </div>
                                    <div className="pl-2 text-gray-400">
                                        (매출 분석 페이지의 총 금액과 동일)
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Actual VAT */}
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-600">2. 실제 신고 부가세</h3>
                                    <span className={`text-xl font-bold ${data.calculated.vat.actualVAT > 0 ? "text-red-600" : "text-blue-600"}`}>
                                        {data.calculated.vat.actualVAT > 0 ? "-" : "+"}
                                        {Math.abs(data.calculated.vat.actualVAT).toLocaleString()} 원
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 flex flex-col gap-1 bg-gray-50 p-3 rounded">
                                    <div className="flex justify-between border-b pb-1 mb-1">
                                        <span>매출 세액 ((카드 + 현금신고) * 10%):</span>
                                        <span className="font-semibold">{data.calculated.vat.salesVAT.toLocaleString()}</span>
                                    </div>
                                    <div className="pl-2 text-gray-400">
                                        ㄴ 카드 매출: {data.data.cardSales.toLocaleString()} / 현금 매출: {data.settlement.reportedCashSales.toLocaleString()}
                                    </div>

                                    <div className="flex justify-between border-b pb-1 mb-1 mt-1">
                                        <span>매입 세액 ((매입 - 세금/프리/사대) * 10%):</span>
                                        <span className="font-semibold">{data.calculated.vat.purchaseVAT.toLocaleString()}</span>
                                    </div>
                                    <div className="pl-2 text-gray-400">
                                        ㄴ 총 매입: {data.data.totalPurchase.toLocaleString()} / 제외: {data.data.laborCost.toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Final Net Profit */}
                        <div className="rounded-xl bg-primary text-primary-foreground shadow-lg p-6">
                            <h3 className="text-sm font-semibold opacity-80">최종 순수익</h3>
                            <div className="text-4xl font-extrabold my-2">
                                {data.calculated.netProfit.toLocaleString()} <span className="text-lg font-normal">원</span>
                            </div>
                            <div className="text-xs opacity-70 mt-2 pt-2 border-t border-primary-foreground/20 flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span>매출 총이익</span>
                                    <span>{data.calculated.grossProfit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>총 매입</span>
                                    <span>-{data.data.totalPurchase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>실제 신고 부가세</span>
                                    <span>
                                        {data.calculated.vat.actualVAT > 0 ? "-" : "+"}
                                        {Math.abs(data.calculated.vat.actualVAT).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400">
                    기간을 선택하고 조회하세요.
                    {/* <button onClick={handleSearch}>재시도</button> */}
                </div>
            )}
        </div>
    );
}
