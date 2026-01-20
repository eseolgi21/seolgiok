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

export default function PurchaseAnalysisPage() {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

    const [items, setItems] = useState<AnalysisItem[]>([]);
    const [metadata, setMetadata] = useState<Metadata>({ totalSpending: 0, totalCount: 0 });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Selection
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Filter
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [keywords, setKeywords] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/admin/accounting/categories?type=PURCHASE`);
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
            let url = `/api/admin/accounting/purchase/analysis?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=100`;
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
                setTotalItems(data.metadata.totalItems || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setSelectedItems([]);
        }
    }, [startDate, endDate, page, categoryFilter, keywords]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItems(items.map(i => i.itemName));
        } else {
            setSelectedItems([]);
        }
    };

    const handleCheckboxChange = (itemName: string) => {
        setSelectedItems(prev =>
            prev.includes(itemName) ? prev.filter(x => x !== itemName) : [...prev, itemName]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`선택한 ${selectedItems.length}개 품목의 매입 내역을 모두 삭제하시겠습니까?\n(해당 기간 내의 모든 기록이 삭제됩니다)`)) return;

        try {
            const res = await fetch("/api/admin/accounting/purchase/analysis", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemNames: selectedItems, startDate, endDate })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.count}건의 세부 내역이 삭제되었습니다.`);
                fetchAnalysis();
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Load saved dates on mount
    useEffect(() => {
        const savedStart = localStorage.getItem("purchaseAnalysisStart");
        const savedEnd = localStorage.getItem("purchaseAnalysisEnd");
        if (savedStart) setStartDate(savedStart);
        if (savedEnd) setEndDate(savedEnd);
    }, []);

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartDate(value);
            localStorage.setItem("purchaseAnalysisStart", value);
        } else {
            setEndDate(value);
            localStorage.setItem("purchaseAnalysisEnd", value);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchAnalysis();
    };

    const handleDeleteAllInPeriod = async () => {
        if (!startDate || !endDate) return;
        if (!confirm(`${startDate} ~ ${endDate} 기간 내의\n모든 매입 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            const res = await fetch("/api/admin/accounting/purchase/analysis", {
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
                    <h1 className="text-2xl font-bold">매입 분석</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        기간별 매입 품목 통계를 확인합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedItems.length > 0 && (
                        <button className="btn btn-error text-white btn-sm" onClick={handleDeleteSelected}>
                            선택 삭제 ({selectedItems.length})
                        </button>
                    )}
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
                                    setPage(1);
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
                                        handleSearch();
                                    }
                                }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSearch}>조회</button>
                        </div>
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

            {/* Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <label>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            onChange={handleSelectAll}
                                            checked={items.length > 0 && selectedItems.length === items.length}
                                        />
                                    </label>
                                </th>
                                <th>품목명</th>
                                <th>분류</th>
                                <th className="text-right">건수</th>
                                <th className="text-right">평균 단가</th>
                                <th className="text-right">총 매입금액</th>
                                <th className="w-1/4">비중</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10">
                                        <span className="loading loading-spinner"></span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">
                                        데이터가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const percentage = metadata.totalSpending > 0
                                        ? (item.totalAmount / metadata.totalSpending) * 100
                                        : 0;

                                    return (
                                        <tr key={`${item.itemName}-${item.category}`}>
                                            <th>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={selectedItems.includes(item.itemName)}
                                                        onChange={() => handleCheckboxChange(item.itemName)}
                                                    />
                                                </label>
                                            </th>
                                            <td className="font-medium">{item.itemName}</td>
                                            <td><span className="badge badge-ghost badge-sm">{item.category}</span></td>
                                            <td className="text-right">{item.count.toLocaleString()}</td>
                                            <td className="text-right">{item.averageAmount.toLocaleString()}원</td>
                                            <td className="text-right font-bold">{item.totalAmount.toLocaleString()}원</td>
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

                {/* Pagination */}
                <div className="flex justify-center p-4 border-t border-base-200">
                    <div className="join">
                        <button
                            className="join-item btn btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            «
                        </button>
                        <button className="join-item btn btn-sm">
                            {page} / {Math.max(1, Math.ceil(totalItems / 20))}
                        </button>
                        <button
                            className="join-item btn btn-sm"
                            disabled={page * 20 >= totalItems}
                            onClick={() => setPage(p => p + 1)}
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
