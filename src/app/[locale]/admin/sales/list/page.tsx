"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
    ArrowUpTrayIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/outline";

type Keyword = {
    id: string;
    keyword: string;
};

type ExcelMapping = {
    id: string;
    name: string;
    colDate: string;
    colItem: string;
    colAmount: string;
    colCategory: string | null;
    colPayment: string | null;
    colNote: string | null;
};

type Item = {
    id: string;
    date: string;
    category: string;
    itemName: string;
    amount: number;
    paymentMethod: string | null;
    note: string | null;
    confirmed: boolean;
};

export default function SalesListPage() {
    const [uploading, setUploading] = useState(false);

    // Search & Data
    const [inputValue, setInputValue] = useState("");
    const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
    const [savedKeywords, setSavedKeywords] = useState<Keyword[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    // const [total, setTotal] = useState(0);

    // Header Mapping State
    const [showMapping, setShowMapping] = useState(false);
    const [mappings, setMappings] = useState<ExcelMapping[]>([]);
    const [selectedMappingId, setSelectedMappingId] = useState<string>("");

    const [mapping, setMapping] = useState({
        date: "일자",
        item: "상품명",
        amount: "금액",
        category: "분류",
        payment: "결제수단",
        note: "비고"
    });

    // 1. Load Saved Keywords & Mappings
    const fetchKeywords = useCallback(async () => {
        try {
            const res = await fetch("/api/user/keywords?type=SALES");
            if (res.ok) setSavedKeywords(await res.json());
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchMappings = useCallback(async () => {
        try {
            const res = await fetch("/api/user/excel-mappings");
            if (res.ok) {
                const data = await res.json();
                setMappings(data.mappings || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchKeywords();
        fetchMappings();
    }, [fetchKeywords, fetchMappings]);

    const handleSaveMapping = async () => {
        const name = prompt("이 설정의 이름을 입력하세요 (예: 배달의민족)");
        if (!name) return;

        try {
            const res = await fetch("/api/user/excel-mappings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type: "SALES",
                    colDate: mapping.date,
                    colItem: mapping.item,
                    colAmount: mapping.amount,
                    colCategory: mapping.category,
                    colPayment: mapping.payment,
                    colNote: mapping.note
                })
            });
            if (res.ok) {
                alert("설정이 저장되었습니다.");
                fetchMappings();
            } else {
                alert("저장 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteMapping = async () => {
        if (!selectedMappingId || !confirm("선택한 설정을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/user/excel-mappings?id=${selectedMappingId}`, { method: "DELETE" });
            if (res.ok) {
                alert("삭제되었습니다.");
                setSelectedMappingId("");
                fetchMappings();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectMapping = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedMappingId(id);
        if (id) {
            const m = mappings.find(x => x.id === id);
            if (m) {
                setMapping({
                    date: m.colDate,
                    item: m.colItem,
                    amount: m.colAmount,
                    category: m.colCategory || "",
                    payment: m.colPayment || "",
                    note: m.colNote || ""
                });
            }
        }
    };

    useEffect(() => {
        fetchKeywords();
    }, [fetchKeywords]);

    // 2. Fetch Data
    const fetchData = useCallback(async (keys: string[], p: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: "20",
                keywords: keys.join(",")
            });
            const res = await fetch(`/api/admin/accounting/sales/list?${params}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                // setTotal(data.metadata.total);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(activeKeywords, page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleAddKeyword = (val: string) => {
        const trimmed = val.trim();
        if (trimmed && !activeKeywords.includes(trimmed)) {
            setActiveKeywords([...activeKeywords, trimmed]);
            setInputValue("");
        }
    };

    const handleRemoveKeyword = (val: string) => {
        setActiveKeywords(activeKeywords.filter(k => k !== val));
    };

    const handleSearch = () => {
        setPage(1);
        fetchData(activeKeywords, 1);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                handleAddKeyword(inputValue);
            } else {
                handleSearch();
            }
        }
    };

    const handleConfirm = async () => {
        // if (activeKeywords.length === 0) return; 

        const message = activeKeywords.length > 0
            ? `${activeKeywords.join(", ")} 키워드로 검색된 항목을 일괄 등록하시겠습니까?`
            : `전체 미등록 항목을 일괄 등록하시겠습니까?`;

        if (!confirm(message)) return;

        try {
            const res = await fetch("/api/admin/accounting/sales/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords: activeKeywords })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${data.count}건의 항목이 등록(확정)되었습니다.`);
                handleSearch();
            } else {
                alert(`등록 실패: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteKeyword = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("키워드를 삭제하시겠습니까?")) return;
        try {
            await fetch(`/api/user/keywords?id=${id}`, { method: "DELETE" });
            fetchKeywords();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        formData.append("mapDate", mapping.date);
        formData.append("mapItem", mapping.item);
        formData.append("mapAmount", mapping.amount);
        formData.append("mapCategory", mapping.category);
        formData.append("mapPayment", mapping.payment);
        formData.append("mapNote", mapping.note);

        setUploading(true);
        try {
            const res = await fetch("/api/admin/accounting/sales/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${data.count}건의 매출 내역이 업로드되었습니다.`);
                fetchData(activeKeywords, 1);
            } else {
                alert(`업로드 실패: ${data.error || data.message}`);
            }
        } catch (err) {
            console.error(err);
            alert("업로드 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">매출 내역</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        매장, 배달 등 매출 내역을 관리합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`btn gap-2 ${showMapping ? 'btn-active' : 'btn-ghost'}`}
                        onClick={() => setShowMapping(!showMapping)}
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                        엑셀 설정
                    </button>
                    <label className={`btn btn-primary gap-2 ${uploading ? "loading" : ""}`}>
                        {uploading ? "업로드 중..." : (
                            <>
                                <ArrowUpTrayIcon className="w-5 h-5" />
                                엑셀 업로드
                            </>
                        )}
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Custom Mapping UI */}
            {showMapping && (
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold">엑셀 컬럼 매핑 설정</h3>
                                <p className="text-xs text-gray-500">엑셀 파일의 헤더 이름이 다를 경우 아래 입력칸에 해당 컬럼명을 입력하세요.</p>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="select select-sm select-bordered max-w-xs"
                                    value={selectedMappingId}
                                    onChange={handleSelectMapping}
                                >
                                    <option value="">-- 저장된 설정 선택 --</option>
                                    {mappings.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                {selectedMappingId && (
                                    <button className="btn btn-sm btn-square btn-outline btn-error" onClick={handleDeleteMapping} title="설정 삭제">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="btn btn-sm btn-outline" onClick={handleSaveMapping}>
                                    현재 설정 저장
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">날짜 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.date} onChange={e => setMapping({ ...mapping, date: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">분류 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.category} onChange={e => setMapping({ ...mapping, category: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">상품명 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.item} onChange={e => setMapping({ ...mapping, item: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">금액 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.amount} onChange={e => setMapping({ ...mapping, amount: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">결제수단 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.payment} onChange={e => setMapping({ ...mapping, payment: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">비고 컬럼</span></label>
                                <input type="text" className="input input-sm input-bordered" value={mapping.note} onChange={e => setMapping({ ...mapping, note: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyword Search Section */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="검색어 추가 (예: 배달의민족) + Enter"
                                    className="input input-bordered w-full pl-10"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            </div>
                            <button className="btn btn-primary" onClick={handleSearch}>검색 ({activeKeywords.length})</button>
                            <button className="btn btn-secondary" onClick={handleConfirm}>
                                {activeKeywords.length > 0 ? "검색 결과 일괄 등록" : "전체 일괄 등록"}
                            </button>
                        </div>

                        {/* Active Keywords (Chips) */}
                        {activeKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {activeKeywords.map(k => (
                                    <div key={k} className="badge badge-primary gap-1 pl-3 pr-1 py-3">
                                        {k}
                                        <button className="btn btn-xs btn-circle btn-ghost text-white" onClick={() => handleRemoveKeyword(k)}>
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button className="btn btn-xs btn-ghost text-gray-500" onClick={() => setActiveKeywords([])}>전체 삭제</button>
                            </div>
                        )}

                        {/* Saved Keywords (Quick Add) */}
                        {savedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center mt-2 pt-2 border-t border-base-200">
                                <span className="text-xs font-semibold text-gray-500">즐겨찾기:</span>
                                {savedKeywords.map((k) => (
                                    <div
                                        key={k.id}
                                        className={`badge gap-1 cursor-pointer pr-0 hover:bg-gray-200 ${activeKeywords.includes(k.keyword) ? 'badge-neutral opacity-50' : 'badge-ghost'}`}
                                        onClick={() => handleAddKeyword(k.keyword)}
                                    >
                                        {k.keyword}
                                        <button
                                            className="btn btn-ghost btn-xs btn-circle h-4 w-4 min-h-0"
                                            onClick={(e) => handleDeleteKeyword(k.id, e)}
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200">
                                <th>상태</th>
                                <th>일자</th>
                                <th>분류</th>
                                <th>상품명</th>
                                <th className="text-right">금액</th>
                                <th>결제수단</th>
                                <th>비고</th>
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
                                items.map((item) => (
                                    <tr key={item.id} className={item.confirmed ? "bg-base-100" : "bg-base-100 opacity-60"}>
                                        <td>
                                            {item.confirmed ? (
                                                <span className="badge badge-success badge-sm">등록됨</span>
                                            ) : (
                                                <span className="badge badge-ghost badge-sm">대기</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap">{format(new Date(item.date), "yyyy-MM-dd")}</td>
                                        <td>
                                            <span className="badge badge-sm badge-ghost">{item.category}</span>
                                        </td>
                                        <td className="font-medium">{item.itemName}</td>
                                        <td className="text-right font-mono text-success">
                                            +{item.amount.toLocaleString()}
                                        </td>
                                        <td>{item.paymentMethod}</td>
                                        <td className="text-gray-500 text-sm max-w-xs truncate" title={item.note || ""}>{item.note}</td>
                                    </tr>
                                ))
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
                        <button className="join-item btn btn-sm">{page} 페이지</button>
                        <button
                            className="join-item btn btn-sm"
                            disabled={items.length < 20}
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
