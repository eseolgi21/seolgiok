"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { XMarkIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";

type ItemRule = {
    id: string;
    itemName: string;
    category: string;
};

export default function ItemManagementPage() {
    const [type, setType] = useState<"PURCHASE" | "SALES">("PURCHASE");
    const [items, setItems] = useState<ItemRule[]>([]);

    // Category management
    const [selectedCategory, setSelectedCategory] = useState("");
    const [newCategoryInput, setNewCategoryInput] = useState("");

    // DB Categories
    const [dbCategories, setDbCategories] = useState<{ id: string, name: string }[]>([]);

    // Item Input
    const [itemText, setItemText] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/accounting/items?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (e) {
            console.error(e);
        }
    }, [type]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/accounting/categories?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setDbCategories(data.categories);
            }
        } catch (e) {
            console.error(e);
        }
    }, [type]);

    useEffect(() => {
        fetchItems();
        fetchCategories();
    }, [fetchItems, fetchCategories]);

    const allCategories = useMemo(() => {
        // Union of specific Saved Categories AND Used Categories in Items
        const usedCats = new Set(items.map(i => i.category));
        const savedCats = new Set(dbCategories.map(c => c.name));

        const merged = new Set([...Array.from(usedCats), ...Array.from(savedCats)]);
        return Array.from(merged).sort();
    }, [items, dbCategories]);

    const handleAddCategory = async () => {
        if (!newCategoryInput.trim()) return;
        const cat = newCategoryInput.trim();

        // Optimistic UI update? No, let's just save.
        try {
            await fetch("/api/admin/accounting/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, name: cat })
            });
            fetchCategories(); // Refresh list
        } catch (e) {
            console.error(e);
        }

        setSelectedCategory(cat);
        setNewCategoryInput("");
    };

    const handleSave = async () => {
        if (!selectedCategory) {
            alert("분류를 선택해주세요.");
            return;
        }
        if (!itemText.trim()) {
            alert("품목명을 입력해주세요.");
            return;
        }

        if (!confirm(`선택한 분류 [${selectedCategory}]로 품목들을 등록하시겠습니까?`)) return;

        // Construct payload: "Item : Category" format
        const lines = itemText.split("\n").map(line => line.trim()).filter(line => line);
        const formattedText = lines.map(line => `${line} : ${selectedCategory}`).join("\n");

        setProcessing(true);
        try {
            const res = await fetch("/api/admin/accounting/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, text: formattedText })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.count}개 항목이 등록되었습니다.`);
                setItemText("");
                fetchItems();
            } else {
                alert("저장 실패");
            }
        } catch (e) {
            console.error(e);
            alert("오류 발생");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            await fetch(`/api/admin/accounting/items?id=${id}`, { method: "DELETE" });
            fetchItems();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">품목 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        엑셀 업로드 시 품목명에 따라 자동으로 분류를 지정하는 규칙을 관리합니다.
                    </p>
                </div>
                <div className="tabs tabs-boxed">
                    <a className={`tab ${type === "PURCHASE" ? "tab-active" : ""}`} onClick={() => setType("PURCHASE")}>매입 품목</a>
                    <a className={`tab ${type === "SALES" ? "tab-active" : ""}`} onClick={() => setType("SALES")}>(준비중) 매출 품목</a>
                </div>
            </div>

            {type === "SALES" ? (
                <div className="alert alert-info">
                    현재 매출 품목 자동 분류는 준비 중입니다. 매입 품목 관리만 먼저 사용해주세요.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: List */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-lg flex justify-between">
                                등록된 규칙 ({items.length})
                                <button className="btn btn-ghost btn-sm btn-circle" onClick={fetchItems}>
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                            </h2>
                            <div className="overflow-y-auto max-h-[600px]">
                                <table className="table table-sm table-pin-rows">
                                    <thead>
                                        <tr>
                                            <th>품목명</th>
                                            <th>분류</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr><td colSpan={3} className="text-center text-gray-500 py-4">등록된 규칙이 없습니다.</td></tr>
                                        ) : items.map(item => (
                                            <tr key={item.id} className="hover">
                                                <td className="font-medium">{item.itemName}</td>
                                                <td><span className="badge badge-ghost badge-sm">{item.category}</span></td>
                                                <td>
                                                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(item.id)}>
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Registration Form */}
                    <div className="space-y-6">

                        {/* 1. Category Manager */}
                        <div className="card bg-base-100 shadow-sm border border-base-200">
                            <div className="card-body">
                                <h2 className="card-title text-lg">1. 분류 선택 / 추가</h2>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="새 분류명 입력 (예: 식자재)"
                                        value={newCategoryInput}
                                        onChange={e => setNewCategoryInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                    />
                                    <button className="btn btn-secondary" onClick={handleAddCategory}>
                                        <PlusIcon className="w-5 h-5" /> 추가
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-base-50">
                                    {allCategories.length === 0 && <span className="text-gray-400 text-sm p-2">등록된 분류가 없습니다.</span>}
                                    {allCategories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Item Input */}
                        <div className="card bg-base-100 shadow-sm border border-base-200">
                            <div className="card-body">
                                <h2 className="card-title text-lg">
                                    2. 품목 등록
                                    {selectedCategory && <span className="text-primary text-sm font-normal ml-2"> (선택된 분류: {selectedCategory})</span>}
                                </h2>
                                <p className="text-sms text-gray-500 mb-2">
                                    선택한 분류에 등록할 품목명을 입력하세요. (한 줄에 하나씩)
                                </p>
                                <textarea
                                    className="textarea textarea-bordered h-48 font-mono text-sm leading-relaxed"
                                    placeholder={selectedCategory ? `[${selectedCategory}] 에 등록할 품목명들을 입력하세요...` : "먼저 위에서 분류를 선택해주세요."}
                                    value={itemText}
                                    onChange={e => setItemText(e.target.value)}
                                    disabled={!selectedCategory}
                                ></textarea>

                                <div className="card-actions justify-end mt-4">
                                    <button className="btn btn-primary w-full" onClick={handleSave} disabled={processing || !selectedCategory}>
                                        {processing ? "저장 중..." : "규칙 일괄 저장"}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
