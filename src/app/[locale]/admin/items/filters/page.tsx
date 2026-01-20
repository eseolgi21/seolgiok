"use client";

import { useState, useEffect } from "react";

export default function ExcelFilterPage() {
    const [purchaseFilters, setPurchaseFilters] = useState<{ id: string, keyword: string, isInclude: boolean }[]>([]);
    const [salesFilters, setSalesFilters] = useState<{ id: string, keyword: string, isInclude: boolean }[]>([]);
    const [newFilterKeyword, setNewFilterKeyword] = useState("");
    const [isIncludeMode, setIsIncludeMode] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState<"PURCHASE" | "SALES">("PURCHASE");
    const [loading, setLoading] = useState(false);

    const fetchFilters = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                fetch("/api/admin/accounting/filters?type=PURCHASE"),
                fetch("/api/admin/accounting/filters?type=SALES")
            ]);

            if (pRes.ok) {
                const data = await pRes.json();
                setPurchaseFilters(data.filters);
            }
            if (sRes.ok) {
                const data = await sRes.json();
                setSalesFilters(data.filters);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFilter = async () => {
        if (!newFilterKeyword.trim()) return;
        try {
            const res = await fetch("/api/admin/accounting/filters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeFilterTab,
                    keyword: newFilterKeyword,
                    isInclude: isIncludeMode
                })
            });

            if (res.ok) {
                setNewFilterKeyword("");
                fetchFilters();
                // alert("필터가 추가되었습니다."); // Removing alert for smoother UX
            } else {
                alert("추가 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteFilter = async (id: string) => {
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/admin/accounting/filters?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchFilters();
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchFilters();
    }, []);

    const currentFilters = activeFilterTab === "PURCHASE" ? purchaseFilters : salesFilters;
    const excludeFilters = currentFilters.filter(f => !f.isInclude);
    const includeFilters = currentFilters.filter(f => f.isInclude);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">엑셀 필터 설정</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        엑셀 업로드 시 적용할 포함/제외 키워드를 설정합니다.
                    </p>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <div className="tabs tabs-boxed mb-4">
                        <a
                            className={`tab ${activeFilterTab === "PURCHASE" ? "tab-active" : ""}`}
                            onClick={() => setActiveFilterTab("PURCHASE")}
                        >
                            매입 필터 ({purchaseFilters.length})
                        </a>
                        <a
                            className={`tab ${activeFilterTab === "SALES" ? "tab-active" : ""}`}
                            onClick={() => setActiveFilterTab("SALES")}
                        >
                            매출 필터 ({salesFilters.length})
                        </a>
                    </div>

                    <div className="form-control">
                        <label className="label py-0 pb-1">
                            <span className="label-text">키워드</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full max-w-xs"
                            placeholder="키워드 입력"
                            value={newFilterKeyword}
                            onChange={(e) => setNewFilterKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddFilter()}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label cursor-pointer gap-2 py-0 pb-1">
                            <span className="label-text">필터 유형</span>
                        </label>
                        <div className="join">
                            <input
                                className="join-item btn btn-sm"
                                type="radio"
                                name="options"
                                aria-label="제외 필터"
                                checked={!isIncludeMode}
                                onChange={() => setIsIncludeMode(false)}
                                disabled={loading}
                            />
                            <input
                                className="join-item btn btn-sm"
                                type="radio"
                                name="options"
                                aria-label="포함 필터"
                                checked={isIncludeMode}
                                onChange={() => setIsIncludeMode(true)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddFilter} disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : "추가"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Exclude List */}
                    <div className="bg-base-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-error">
                            ⛔ 제외 필터
                            <span className="badge badge-sm">{excludeFilters.length}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2 min-h-[50px]">
                            {excludeFilters.length === 0 && <span className="text-gray-400 text-sm">없음</span>}
                            {excludeFilters.map(f => (
                                <div key={f.id} className="badge badge-error gap-2 p-3 text-white">
                                    {f.keyword}
                                    <button className="btn btn-xs btn-circle btn-ghost text-white" onClick={() => handleDeleteFilter(f.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Include List */}
                    <div className="bg-base-200 p-4 rounded-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-success">
                            ✅ 포함 필터
                            <span className="badge badge-sm">{includeFilters.length}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2 min-h-[50px]">
                            {includeFilters.length === 0 && <span className="text-gray-400 text-sm">없음</span>}
                            {includeFilters.map(f => (
                                <div key={f.id} className="badge badge-success gap-2 p-3 text-white">
                                    {f.keyword}
                                    <button className="btn btn-xs btn-circle btn-ghost text-white" onClick={() => handleDeleteFilter(f.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>

    );
}
