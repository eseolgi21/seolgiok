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
    type: string;
    name: string;
    colDate: string;
    colItem: string;
    colAmount: string;
    colCategory: string | null;
    colPayment: string | null;
    colNote: string | null;
    filterExclude: string | null;
    filterInclude: string | null;
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
    const [excelPassword, setExcelPassword] = useState("");
    const [filterMode, setFilterMode] = useState<"ALL" | "EXCLUDE" | "INCLUDE">("EXCLUDE");

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
        note: "비고",
        filterExclude: "",
        filterInclude: ""
    });

    // Manual Add State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        category: "",
        itemName: "",
        amount: "",
        paymentMethod: "",
        note: ""
    });

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<string>("");

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);



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

    // Auto-select last used mapping
    useEffect(() => {
        if (mappings.length > 0 && !selectedMappingId) {
            const lastId = localStorage.getItem("lastSalesMappingId");
            if (lastId) {
                const found = mappings.find(m => m.id === lastId);
                if (found) {
                    setSelectedMappingId(lastId);
                    setMapping({
                        date: found.colDate,
                        item: found.colItem,
                        amount: found.colAmount,
                        category: found.colCategory || "",
                        payment: found.colPayment || "",
                        note: found.colNote || "",
                        filterExclude: found.filterExclude || "",
                        filterInclude: found.filterInclude || ""
                    });
                    setShowMapping(true);
                }
            }
        }
    }, [mappings, selectedMappingId]);

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
                    colNote: mapping.note,
                    filterExclude: mapping.filterExclude,
                    filterInclude: mapping.filterInclude
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
                localStorage.removeItem("lastSalesMappingId");
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
            localStorage.setItem("lastSalesMappingId", id);
            const m = mappings.find(x => x.id === id);
            if (m) {
                setMapping({
                    date: m.colDate,
                    item: m.colItem,
                    amount: m.colAmount,
                    category: m.colCategory || "",
                    payment: m.colPayment || "",
                    note: m.colNote || "",
                    filterExclude: m.filterExclude || "",
                    filterInclude: m.filterInclude || ""
                });
            }
        } else {
            localStorage.removeItem("lastSalesMappingId");
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
                limit: "100",
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
            setSelectedIds([]);
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
        const newKeys = [...activeKeywords];
        if (inputValue.trim()) {
            const inputs = inputValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
            inputs.forEach(k => {
                if (!newKeys.includes(k)) {
                    newKeys.push(k);
                }
            });
        }
        setActiveKeywords(newKeys);
        setInputValue("");
        fetchData(newKeys, 1);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
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
        formData.append("mapPayment", mapping.payment);
        formData.append("mapNote", mapping.note);
        formData.append("filterExclude", mapping.filterExclude);
        formData.append("filterExclude", mapping.filterExclude);
        formData.append("filterInclude", mapping.filterInclude);
        formData.append("filterMode", filterMode);
        if (excelPassword) {
            formData.append("password", excelPassword);
        }

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
            if (e.target) e.target.value = "";
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(items.map(i => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleCheckboxChange = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length}건의 항목을 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch("/api/admin/accounting/sales/list", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (res.ok) {
                alert("삭제되었습니다.");
                fetchData(activeKeywords, page);
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        if (!newItem.category || !newItem.itemName || !newItem.amount) {
            alert("필수 항목을 입력해주세요.");
            return;
        }

        try {
            const res = await fetch("/api/admin/accounting/sales/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                alert("항목이 추가되었습니다.");
                setIsAddModalOpen(false);
                setNewItem({
                    date: format(new Date(), "yyyy-MM-dd"),
                    category: "",
                    itemName: "",
                    amount: "",
                    paymentMethod: "",
                    note: ""
                });
                fetchData(activeKeywords, page); // Refresh
            } else {
                alert("추가 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startEditing = (item: Item) => {
        setEditingId(item.id);
        setEditAmount(item.amount.toString());
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditAmount("");
    };

    const saveEditing = async () => {
        if (!editingId) return;

        try {
            const res = await fetch("/api/admin/accounting/sales/list", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingId, amount: Number(editAmount) })
            });

            if (res.ok) {
                // Update local state directly or refetch
                setItems(prev => prev.map(item =>
                    item.id === editingId ? { ...item, amount: Number(editAmount) } : item
                ));
                setEditingId(null);
            } else {
                alert("수정 실패");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteExcept = async () => {
        if (activeKeywords.length === 0) return;
        if (!confirm(`현재 검색된 키워드(${activeKeywords.join(", ")})를 포함하지 않는\n모든 '미확정' 항목을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            const res = await fetch("/api/admin/accounting/sales/list", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "DELETE_EXCEPT",
                    keywords: activeKeywords
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.count}개의 항목이 삭제되었습니다.`);
                fetchData(activeKeywords, 1);
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error(e);
            alert("오류 발생");
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
                    {selectedIds.length > 0 && (
                        <button className="btn btn-error text-white" onClick={handleDeleteSelected}>
                            선택 삭제 ({selectedIds.length})
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(true)}>
                        + 직접 추가
                    </button>
                    <button
                        className={`btn gap-2 ${showMapping ? 'btn-active' : 'btn-ghost'}`}
                        onClick={() => setShowMapping(!showMapping)}
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                        엑셀 설정
                    </button>
                    <div className="flex items-center gap-2">
                        {/* Mapping Dropdown Moved Here */}
                        <div className="flex gap-1 flex-shrink-0">
                            <select
                                className="select select-sm select-bordered w-auto min-w-[160px]"
                                value={selectedMappingId}
                                onChange={handleSelectMapping}
                            >
                                <option value="">-- 엑셀 설정 선택 --</option>
                                {mappings.map(m => (
                                    <option key={m.id} value={m.id}>
                                        [{m.type === "SALES" ? "매출" : "매입"}] {m.name}
                                    </option>
                                ))}
                            </select>
                            {selectedMappingId && (
                                <button className="btn btn-sm btn-square btn-outline btn-error" onClick={handleDeleteMapping} title="설정 삭제">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Mode Selector */}
                        <select
                            className="select select-sm select-bordered max-w-[100px]"
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value as "ALL" | "EXCLUDE" | "INCLUDE")}
                        >
                            <option value="ALL">전체</option>
                            <option value="EXCLUDE">제외</option>
                            <option value="INCLUDE">포함</option>
                        </select>

                        <input
                            type="password"
                            placeholder="엑셀 비밀번호"
                            className="input input-bordered input-sm w-32"
                            value={excelPassword}
                            onChange={(e) => setExcelPassword(e.target.value)}
                        />
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
            )
            }

            {/* Keyword Search Section */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 flex items-center">
                                <input
                                    type="text"
                                    placeholder="키워드 입력"
                                    className="input input-bordered w-full max-w-xs"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <button className="btn btn-square ml-2" onClick={handleSearch}>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
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
                                <button
                                    className="btn btn-xs btn-error btn-outline ml-auto"
                                    onClick={handleDeleteExcept}
                                >
                                    검색 결과 외 모두 삭제
                                </button>
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
                                <th className="w-10">
                                    <label>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            onChange={handleSelectAll}
                                            checked={items.length > 0 && selectedIds.length === items.length}
                                        />
                                    </label>
                                </th>
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
                                        <th>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                />
                                            </label>
                                        </th>
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
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    className="input input-xs input-bordered w-24 text-right"
                                                    value={editAmount}
                                                    onChange={e => setEditAmount(e.target.value)}
                                                    onBlur={saveEditing}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveEditing();
                                                        if (e.key === 'Escape') cancelEditing();
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="cursor-pointer hover:underline decoration-dashed"
                                                    onClick={() => startEditing(item)}
                                                >
                                                    {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                                                </span>
                                            )}
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
            {/* Add Modal */}
            {
                isAddModalOpen && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">매출 내역 직접 추가</h3>
                            <div className="form-control mb-2">
                                <label className="label">날짜</label>
                                <input
                                    type="date"
                                    className="input input-bordered"
                                    value={newItem.date}
                                    onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-2">
                                <label className="label">분류</label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="예: 매장, 배달"
                                    value={newItem.category}
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-2">
                                <label className="label">상품명</label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="예: 아메리카노"
                                    value={newItem.itemName}
                                    onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-2">
                                <label className="label">금액</label>
                                <input
                                    type="number"
                                    className="input input-bordered"
                                    placeholder="숫자만 입력"
                                    value={newItem.amount}
                                    onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-2">
                                <label className="label">결제수단</label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="예: 카드, 현금"
                                    value={newItem.paymentMethod}
                                    onChange={e => setNewItem({ ...newItem, paymentMethod: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-4">
                                <label className="label">비고</label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newItem.note}
                                    onChange={e => setNewItem({ ...newItem, note: e.target.value })}
                                />
                            </div>
                            <div className="modal-action">
                                <button className="btn" onClick={() => setIsAddModalOpen(false)}>취소</button>
                                <button className="btn btn-primary" onClick={handleCreate}>추가</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
