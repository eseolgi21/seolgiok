
"use client";

import { useState, useEffect } from "react";
import { format, subMonths, addMonths, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

// A simple bar chart component using CSS grids/flex or a library if available.
// Since we don't have a chart lib installed in instructions, I'll build a simple CSS bar chart.

type DailySale = {
    date: string;
    salesAmount: number;
    costAmount: number;
};

type StatsResponse = {
    data: DailySale[];
    summary: {
        totalSales: number;
        totalCost: number;
    };
};

export default function SalesStatsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "year">("month");
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [currentDate, viewMode]);

    const fetchStats = async () => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const params = new URLSearchParams({
            type: viewMode,
            year: String(year),
            month: String(month),
        });

        try {
            const res = await fetch(`/api/admin/sales/stats?${params}`);
            if (res.ok) {
                setStats(await res.json());
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
        else setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    };

    const handleNext = () => {
        if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    };

    const netProfit = (stats?.summary.totalSales ?? 0) - (stats?.summary.totalCost ?? 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">매출 현황</h1>

                <div className="join">
                    <button
                        className={`join-item btn btn-sm ${viewMode === "month" ? "btn-active btn-primary" : ""}`}
                        onClick={() => setViewMode("month")}
                    >
                        월간
                    </button>
                    <button
                        className={`join-item btn btn-sm ${viewMode === "year" ? "btn-active btn-primary" : ""}`}
                        onClick={() => setViewMode("year")}
                    >
                        연간
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 bg-base-100 p-4 rounded-lg border shadow-sm">
                <button className="btn btn-sm btn-circle" onClick={handlePrev}>
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <div className="text-xl font-bold min-w-40 text-center">
                    {viewMode === "month"
                        ? format(currentDate, "yyyy년 M월", { locale: ko })
                        : format(currentDate, "yyyy년", { locale: ko })
                    }
                </div>
                <button className="btn btn-sm btn-circle" onClick={handleNext}>
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat bg-base-100 shadow rounded-lg border">
                    <div className="stat-title">총 매출</div>
                    <div className="stat-value text-primary">{stats?.summary.totalSales.toLocaleString() ?? 0}원</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg border">
                    <div className="stat-title">총 매입(비용)</div>
                    <div className="stat-value text-secondary">{stats?.summary.totalCost.toLocaleString() ?? 0}원</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg border">
                    <div className="stat-title">순수익</div>
                    <div className={`stat-value ${netProfit >= 0 ? "text-success" : "text-error"}`}>
                        {netProfit.toLocaleString()}원
                    </div>
                </div>
            </div>

            {/* Simple Chart Visualization */}
            <div className="bg-base-100 p-6 rounded-lg border shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold mb-6">매출/비용 추이</h3>

                {loading ? (
                    <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <div className="min-w-[600px] h-64 flex items-end gap-2 text-xs">
                        {stats?.data.map((item) => {
                            // Simple normalization for bar height
                            const maxVal = Math.max(stats.summary.totalSales, stats.summary.totalCost, 1) * 0.1; // roughly scale
                            // Actually let's find local max for scaling
                            const localMax = Math.max(...stats.data.map(d => Math.max(d.salesAmount, d.costAmount)), 1);

                            const salesH = (item.salesAmount / localMax) * 100;
                            const costH = (item.costAmount / localMax) * 100;

                            return (
                                <div key={item.date} className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                                    {/* Tooltip */}
                                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-black text-white p-2 rounded z-10 whitespace-nowrap">
                                        <div>날짜: {format(new Date(item.date), "MM-dd")}</div>
                                        <div>매출: {item.salesAmount.toLocaleString()}</div>
                                        <div>매입: {item.costAmount.toLocaleString()}</div>
                                    </div>

                                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                        <div style={{ height: `${salesH}%` }} className="w-3 bg-primary/80 rounded-t-sm"></div>
                                        <div style={{ height: `${costH}%` }} className="w-3 bg-secondary/80 rounded-t-sm"></div>
                                    </div>
                                    <div className="mt-1 text-base-content/50 rotate-0 truncate text-[10px]">
                                        {viewMode === "month" ? format(new Date(item.date), "d") : format(new Date(item.date), "M월")}
                                    </div>
                                </div>
                            )
                        })}
                        {stats?.data.length === 0 && <div className="w-full text-center text-base-content/50 py-10">데이터가 없습니다.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
