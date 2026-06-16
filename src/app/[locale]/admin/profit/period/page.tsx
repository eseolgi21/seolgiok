"use client";

import { useState } from "react";
import { format, subDays, getDay } from "date-fns";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DailyStat = {
    date: string;
    sales: number;
    salesCount: number;
    purchase: number;
    purchaseCount: number;
    profit: number;
};

type PeriodSummary = {
    totalSales: number;
    totalPurchase: number;
    totalProfit: number;
};

export default function PeriodProfitPage() {
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<PeriodSummary | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

    const fetchPeriodStats = async () => {
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/accounting/profit/period?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setSummary(data.summary);
                setDailyStats(data.dailyStats);
            }
        } catch (e) {
            console.error(e);
            alert("조회 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">기간별 순수익 분석</h1>
                    <p className="text-sm text-gray-500 mt-1">원하는 기간의 매출, 매입 및 순수익 현황을 확인합니다.</p>
                </div>
            </div>

            {/* Controls */}
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
                    <Button onClick={fetchPeriodStats} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
                        조회
                    </Button>
                </CardContent>
            </Card>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <p className="text-sm text-muted-foreground">기간 총 매출</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">+{summary.totalSales.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <p className="text-sm text-muted-foreground">기간 총 매입</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">-{summary.totalPurchase.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <p className="text-sm text-muted-foreground">기간 순수익</p>
                            <p className={`text-3xl font-bold mt-1 ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {summary.totalProfit >= 0 ? '+' : ''}{summary.totalProfit.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Daily List */}
            {summary && (
                <Card>
                    <CardContent className="p-0 overflow-hidden">
                        <Table className="text-center">
                            <TableHeader>
                                <TableRow className="bg-muted border-0">
                                    <TableHead>날짜</TableHead>
                                    <TableHead className="text-right text-blue-600">매출 (+)</TableHead>
                                    <TableHead className="text-right text-red-600">매입 (-)</TableHead>
                                    <TableHead className="text-right">순수익 (=)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyStats.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="py-8 text-gray-400">데이터가 없습니다.</TableCell></TableRow>
                                ) : (
                                    dailyStats.map((stat, idx) => {
                                        const day = getDay(new Date(stat.date));
                                        const isSun = day === 0;
                                        const isSat = day === 6;
                                        const isProfit = stat.profit >= 0;
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell className={`font-mono ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : ''}`}>
                                                    {stat.date}
                                                </TableCell>
                                                <TableCell className="text-right text-blue-600 font-medium">
                                                    {stat.sales.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 font-medium">
                                                    {stat.purchase.toLocaleString()}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                    {stat.profit.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
