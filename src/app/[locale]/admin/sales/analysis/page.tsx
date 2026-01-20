
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";

type AnalysisItem = {
    itemName: string;
    category: string;
    totalAmount: number;
    count: number;
    averageAmount: number;
};

type Metadata = {
    totalSpending: number;
    totalCount: number;
};

export default function SalesAnalysisPage() {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

    const [items, setItems] = useState<AnalysisItem[]>([]);
    const [metadata, setMetadata] = useState<Metadata>({ totalSpending: 0, totalCount: 0 });

    // Filter
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [keywords, setKeywords] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/admin/accounting/categories?type=SALES`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAnalysis = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/api/admin/accounting/sales/analysis?startDate=${startDate}&endDate=${endDate}`;
            if (categoryFilter !== null) {
                url += `&category=${encodeURIComponent(categoryFilter)}`;
            }
            if (keywords.trim()) {
                url += `&keywords=${encodeURIComponent(keywords.trim())}`;
            }
            const res = await fetch(url);
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
    }, [startDate, endDate, categoryFilter, keywords]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    // Load saved dates on mount
    useEffect(() => {
        const savedStart = localStorage.getItem("salesAnalysisStart");
        const savedEnd = localStorage.getItem("salesAnalysisEnd");
        if (savedStart) setStartDate(savedStart);
        if (savedEnd) setEndDate(savedEnd);
    }, []);

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartDate(value);
            localStorage.setItem("salesAnalysisStart", value);
        } else {
            setEndDate(value);
            localStorage.setItem("salesAnalysisEnd", value);
        }
    };

    const handleDeleteAllInPeriod = async () => {
        if (!startDate || !endDate) return;
        if (!confirm(`${startDate} ~ ${endDate} 기간 내의\n모든 매출 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            const res = await fetch("/api/admin/accounting/sales/analysis", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "DELETE_ALL_IN_PERIOD", startDate, endDate })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.count}건의 데이터가 삭제되었습니다.`);
                fetchAnalysis();
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">매출 분석</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        기간별 매출 품목 통계를 확인합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-error btn-outline btn-sm" onClick={handleDeleteAllInPeriod}>
                        기간 내 전체 삭제
                    </button>
                </div>
            </div>

            {/* Filters & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-100 shadow-sm border border-base-200 p-4 md:col-span-2 space-y-4">
                    <div>
                        <h3 className="font-bold mb-2">분석 기간 설정</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="input input-bordered input-sm"
                                value={startDate}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                            />
                            <span>~</span>
                            <input
                                type="date"
                                className="input input-bordered input-sm"
                                value={endDate}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-2">상세 조건</h3>
                        <div className="flex flex-wrap gap-2 items-center">
                            <select
                                className="select select-bordered select-sm"
                                value={categoryFilter === null ? "ALL" : categoryFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCategoryFilter(val === "ALL" ? null : val);
                                }}
                            >
                                <option value="ALL">전체 분류</option>
                                <option value="">(미분류)</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="품목명 검색 (쉼표 구분)"
                                className="input input-bordered input-sm w-48"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchAnalysis();
                                    }
                                }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={fetchAnalysis}>조회</button>
                        </div>
                    </div>
                </div>
                <div className="card bg-success text-success-content shadow-sm p-4">
                    <div className="stat p-0">
                        <div className="stat-title text-success-content/80">총 매출 금액</div>
                        <div className="stat-value text-2xl">+{metadata.totalSpending.toLocaleString()}원</div>
                        <div className="stat-desc text-success-content/80">총 {metadata.totalCount}건</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200">
                                <th className="w-16">순위</th>
                                <th>품목명</th>
                                <th>분류</th>
                                <th className="text-right">판매 횟수</th>
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
                                        <tr key={`${item.itemName}-${item.category}`}>
                                            <td className="font-mono text-center">{index + 1}</td>
                                            <td className="font-bold">{item.itemName}</td>
                                            <td><span className="badge badge-ghost badge-sm">{item.category}</span></td>
                                            <td className="text-right font-mono">{item.count}회</td>
                                            <td className="text-right font-mono text-gray-500">
                                                {item.averageAmount.toLocaleString()}
                                            </td>
                                            <td className="text-right font-mono text-success font-bold">
                                                +{item.totalAmount.toLocaleString()}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <progress
                                                        className="progress progress-success w-full"
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
