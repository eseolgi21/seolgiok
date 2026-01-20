"use client";

import { useState } from "react";
import { format, subDays, getDay } from "date-fns";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
            <div className="card bg-base-100 shadow border border-base-200">
                <div className="card-body p-4 flex-row items-end gap-4">
                    <div className="form-control">
                        <label className="label py-1"><span className="label-text">시작일</span></label>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-1"><span className="label-text">종료일</span></label>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={fetchPeriodStats} disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : <MagnifyingGlassIcon className="w-5 h-5" />}
                        조회
                    </button>
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat bg-base-100 shadow border border-base-200 rounded-box">
                        <div className="stat-title">기간 총 매출</div>
                        <div className="stat-value text-blue-600">+{summary.totalSales.toLocaleString()}</div>
                    </div>
                    <div className="stat bg-base-100 shadow border border-base-200 rounded-box">
                        <div className="stat-title">기간 총 매입</div>
                        <div className="stat-value text-red-600">-{summary.totalPurchase.toLocaleString()}</div>
                    </div>
                    <div className="stat bg-base-100 shadow border border-base-200 rounded-box">
                        <div className="stat-title">기간 순수익</div>
                        <div className={`stat-value ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {summary.totalProfit >= 0 ? '+' : ''}{summary.totalProfit.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Daily List */}
            {summary && (
                <div className="card bg-base-100 shadow border border-base-200">
                    <div className="card-body p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full text-center">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>날짜</th>
                                        <th className="text-right text-blue-600">매출 (+)</th>
                                        <th className="text-right text-red-600">매입 (-)</th>
                                        <th className="text-right">순수익 (=)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyStats.length === 0 ? (
                                        <tr><td colSpan={4} className="py-8 text-gray-400">데이터가 없습니다.</td></tr>
                                    ) : (
                                        dailyStats.map((stat, idx) => {
                                            const day = getDay(new Date(stat.date));
                                            const isSun = day === 0;
                                            const isSat = day === 6;
                                            const isProfit = stat.profit >= 0;
                                            return (
                                                <tr key={idx}>
                                                    <td className={`font-mono ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : ''}`}>
                                                        {stat.date}
                                                    </td>
                                                    <td className="text-right text-blue-600 font-medium">
                                                        {stat.sales.toLocaleString()}
                                                    </td>
                                                    <td className="text-right text-red-600 font-medium">
                                                        {stat.purchase.toLocaleString()}
                                                    </td>
                                                    <td className={`text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {stat.profit.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
