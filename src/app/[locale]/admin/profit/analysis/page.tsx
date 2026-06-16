
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type DetailItem = {
    id: string;
    itemName: string;
    amount: number;
    category: string;
    note?: string;
};

type DailyDetail = {
    date: string;
    sales: DetailItem[];
    purchases: DetailItem[];
    summary: {
        totalSales: number;
        totalPurchase: number;
    };
};

export default function ProfitAnalysisPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState<DailyStat[]>([]);

    // Modal State
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<DailyDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"ALL" | "SALES" | "PURCHASE">("ALL");

    // Fetch Calendar Data
    const fetchCalendar = useCallback(async () => {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const res = await fetch(`/api/admin/accounting/profit/calendar?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchCalendar();
    }, [fetchCalendar]);

    // Fetch Detail Data
    const fetchDetail = useCallback(async (date: string) => {
        setDetailLoading(true);
        setDetailData(null);
        try {
            const res = await fetch(`/api/admin/accounting/profit/detail?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setDetailData(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleDateClick = (date: string) => {
        setSelectedDate(date);
        setActiveTab("ALL");
        fetchDetail(date);
        // Open modal
        (document.getElementById('detail_modal') as HTMLDialogElement)?.showModal();
    };

    // Calculate empty slots for calendar grid
    const monthStart = startOfMonth(currentDate);
    const startDay = getDay(monthStart); // 0 (Sun) - 6 (Sat)
    const emptySlots = Array(startDay).fill(null);

    // Totals for the month
    const totalSales = stats.reduce((acc, curr) => acc + curr.sales, 0);
    const totalPurchase = stats.reduce((acc, curr) => acc + curr.purchase, 0);
    const totalProfit = stats.reduce((acc, curr) => acc + curr.profit, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">순수익 분석</h1>
                    <p className="text-sm text-gray-500 mt-1">월별 매출, 매입 및 순수익 현황을 확인합니다.</p>
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 pt-4">
                        <p className="text-sm text-muted-foreground">월 총 매출</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">+{totalSales.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-4">
                        <p className="text-sm text-muted-foreground">월 총 매입</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">-{totalPurchase.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-4">
                        <p className="text-sm text-muted-foreground">월 순수익</p>
                        <p className={`text-3xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Controls */}
            <div className="flex justify-between items-center bg-background p-4 rounded-t-lg border border-border border-b-0">
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeftIcon className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold font-mono">
                    {format(currentDate, "yyyy년 MM월", { locale: ko })}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRightIcon className="w-5 h-5" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-background border border-border rounded-b-lg p-4">
                {/* Week Header */}
                <div className="grid grid-cols-7 mb-2 text-center font-bold text-gray-500">
                    <div className="text-red-500">일</div>
                    <div>월</div>
                    <div>화</div>
                    <div>수</div>
                    <div>목</div>
                    <div>금</div>
                    <div className="text-blue-500">토</div>
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-px bg-muted border border-border">
                    {emptySlots.map((_, i) => (
                        <div key={`empty-${i}`} className="bg-background min-h-[120px]" />
                    ))}

                    {stats.map((day) => {
                        const dayNum = new Date(day.date).getDate();
                        const isProfit = day.profit >= 0;
                        const hasData = day.sales > 0 || day.purchase > 0;

                        return (
                            <div
                                key={day.date}
                                className={`bg-background min-h-[120px] p-2 hover:bg-gray-50 cursor-pointer transition-colors relative flex flex-col justify-between group ${hasData ? 'border-indigo-50' : ''}`}
                                onClick={() => handleDateClick(day.date)}
                            >
                                <span className={`text-sm font-semibold ${getDay(new Date(day.date)) === 0 ? 'text-red-500' : getDay(new Date(day.date)) === 6 ? 'text-blue-500' : ''}`}>
                                    {dayNum}
                                </span>

                                {hasData ? (
                                    <div className="text-xs space-y-1 mt-1 text-right">
                                        {day.sales > 0 && (
                                            <div className="text-blue-600">+{day.sales.toLocaleString()}</div>
                                        )}
                                        {day.purchase > 0 && (
                                            <div className="text-red-500">-{day.purchase.toLocaleString()}</div>
                                        )}
                                        <div className={`font-bold mt-2 pt-1 border-t border-dashed ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                            {isProfit ? '+' : ''}{day.profit.toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-center text-gray-300 mt-8">-</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail Modal */}
            <dialog id="detail_modal" className="fixed inset-0 z-50 m-auto w-11/12 max-w-4xl rounded-lg bg-background shadow-xl border-0 p-0 open:flex open:flex-col backdrop:bg-black/50">
                <div className="w-full h-[80vh] flex flex-col overflow-hidden rounded-lg">
                    <div className="bg-muted p-4 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg">
                            {selectedDate} 상세 내역
                        </h3>
                        <form method="dialog">
                            <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
                                <XMarkIcon className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        {detailLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin h-8 w-8" />
                            </div>
                        ) : detailData ? (
                            <>
                                {/* Summary Card */}
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1 bg-blue-50 p-3 rounded-lg text-center">
                                        <div className="text-xs text-blue-800 font-bold">매출 합계</div>
                                        <div className="text-lg font-bold text-blue-600">+{detailData.summary.totalSales.toLocaleString()}</div>
                                    </div>
                                    <div className="flex-1 bg-red-50 p-3 rounded-lg text-center">
                                        <div className="text-xs text-red-800 font-bold">매입 합계</div>
                                        <div className="text-lg font-bold text-red-600">-{detailData.summary.totalPurchase.toLocaleString()}</div>
                                    </div>
                                    <div className="flex-1 bg-green-50 p-3 rounded-lg text-center border-l-4 border-green-400">
                                        <div className="text-xs text-green-800 font-bold">순수익</div>
                                        <div className="text-lg font-bold text-green-700">
                                            {(detailData.summary.totalSales - detailData.summary.totalPurchase).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ALL" | "SALES" | "PURCHASE")} className="mb-4">
                                    <TabsList>
                                        <TabsTrigger value="ALL">전체</TabsTrigger>
                                        <TabsTrigger value="SALES">매출 ({detailData.sales.length})</TabsTrigger>
                                        <TabsTrigger value="PURCHASE">매입 ({detailData.purchases.length})</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Lists */}
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>유형</TableHead>
                                            <TableHead>분류</TableHead>
                                            <TableHead>품목명</TableHead>
                                            <TableHead className="text-right">금액</TableHead>
                                            <TableHead>비고</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(activeTab === 'ALL' || activeTab === 'SALES') && detailData.sales.map((item, idx) => (
                                            <TableRow key={`sale-${idx}`} className="hover:bg-blue-50">
                                                <TableCell><Badge variant="outline" className="text-xs">매출</Badge></TableCell>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell className="font-semibold">{item.itemName}</TableCell>
                                                <TableCell className="text-right text-blue-600">+{item.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs text-gray-500">{item.note}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(activeTab === 'ALL' || activeTab === 'PURCHASE') && detailData.purchases.map((item, idx) => (
                                            <TableRow key={`purchase-${idx}`} className="hover:bg-red-50">
                                                <TableCell><Badge variant="destructive" className="text-xs border border-destructive bg-transparent text-destructive hover:bg-transparent">매입</Badge></TableCell>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell className="font-semibold">{item.itemName}</TableCell>
                                                <TableCell className="text-right text-red-600">-{item.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs text-gray-500">{item.note}</TableCell>
                                            </TableRow>
                                        ))}
                                        {activeTab === 'ALL' && detailData.sales.length === 0 && detailData.purchases.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">데이터가 없습니다.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-400">데이터를 불러오지 못했습니다.</div>
                        )}
                    </div>
                </div>
                <form method="dialog" className="fixed inset-0 -z-10 cursor-default">
                    <button className="sr-only">close</button>
                </form>
            </dialog>
        </div>
    );
}
