
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";

type AnalysisItem = {
    itemName: string;
    totalAmount: number;
    count: number;
    averageAmount: number;
};

type Metadata = {
    totalSpending: number;
    totalCount: number;
};

export default function PurchaseAnalysisPage() {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

    const [items, setItems] = useState<AnalysisItem[]>([]);
    const [metadata, setMetadata] = useState<Metadata>({ totalSpending: 0, totalCount: 0 });

    const fetchAnalysis = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate
            });
            const res = await fetch(`/api/admin/accounting/purchase/analysis?${params}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setMetadata(data.metadata);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">매입 분석</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        기간별 매입 품목 통계를 확인합니다.
                    </p>
                </div>
            </div>

            {/* Filters & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-100 shadow-sm border border-base-200 p-4 md:col-span-2">
                    <h3 className="font-bold mb-2">분석 기간 설정</h3>
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            className="input input-bordered"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span>~</span>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={fetchAnalysis}>조회</button>
                    </div>
                </div>
                <div className="card bg-primary text-primary-content shadow-sm p-4">
                    <div className="stat p-0">
                        <div className="stat-title text-primary-content/80">총 매입 금액</div>
                        <div className="stat-value text-2xl">{metadata.totalSpending.toLocaleString()}원</div>
                        <div className="stat-desc text-primary-content/80">총 {metadata.totalCount}건</div>
                    </div>
                </div>
            </div>

            {/* Chart (Placeholder for now, using simple progress bars or just table) */}

            {/* Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200">
                                <th className="w-16">순위</th>
                                <th>품목명</th>
                                <th className="text-right">구매 횟수</th>
                                <th className="text-right">평균 단가</th>
                                <th className="text-right">총 금액</th>
                                <th className="w-1/4">비중</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10">
                                        <span className="loading loading-spinner"></span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        데이터가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => {
                                    const percentage = metadata.totalSpending > 0
                                        ? (item.totalAmount / metadata.totalSpending) * 100
                                        : 0;

                                    return (
                                        <tr key={item.itemName}>
                                            <td className="font-mono text-center">{index + 1}</td>
                                            <td className="font-bold">{item.itemName}</td>
                                            <td className="text-right font-mono">{item.count}회</td>
                                            <td className="text-right font-mono text-gray-500">
                                                {item.averageAmount.toLocaleString()}
                                            </td>
                                            <td className="text-right font-mono text-error font-bold">
                                                {item.totalAmount.toLocaleString()}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <progress
                                                        className="progress progress-error w-full"
                                                        value={percentage}
                                                        max="100"
                                                    ></progress>
                                                    <span className="text-xs w-10 text-right">{percentage.toFixed(1)}%</span>
                                                </div>
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
    );
}
