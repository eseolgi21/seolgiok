
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
    ArrowUpTrayIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    note: string | null;
    confirmed: boolean;
};

export default function PurchasePage() {
    const t = useTranslations("adminPurchase");
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
    const [total, setTotal] = useState(0); // Added total state


    // Headers Mapping State
    const [showMapping, setShowMapping] = useState(false);
    const [mappings, setMappings] = useState<ExcelMapping[]>([]);
    const [selectedMappingId, setSelectedMappingId] = useState<string>("");

    const [mapping, setMapping] = useState({
        date: "일자",
        item: "품목명",
        amount: "금액",
        category: "분류",
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
        note: ""
    });

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<"AMOUNT" | "CATEGORY" | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // AlertDialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    const openConfirm = (message: string, action: () => void) => {
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };




    // 1. Load Saved Keywords & Mappings
    const fetchKeywords = useCallback(async () => {
        try {
            const res = await fetch("/api/user/keywords?type=PURCHASE");
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
        void Promise.all([fetchKeywords(), fetchMappings()]);
    }, [fetchKeywords, fetchMappings]);

    // Auto-select last used mapping
    useEffect(() => {
        if (mappings.length > 0 && !selectedMappingId) {
            const lastId = localStorage.getItem("lastPurchaseMappingId");
            if (lastId) {
                const found = mappings.find(m => m.id === lastId);
                if (found) {
                    setSelectedMappingId(lastId);
                    setMapping({
                        date: found.colDate,
                        item: found.colItem,
                        amount: found.colAmount,
                        category: found.colCategory || "",
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
        const name = prompt(t("mapping.savePrompt"));
        if (!name) return;

        try {
            const res = await fetch("/api/user/excel-mappings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type: "PURCHASE",
                    colDate: mapping.date,
                    colItem: mapping.item,
                    colAmount: mapping.amount,
                    colCategory: mapping.category,
                    colNote: mapping.note,
                    filterExclude: mapping.filterExclude,
                    filterInclude: mapping.filterInclude
                })
            });
            if (res.ok) {
                alert(t("mapping.saveSuccess"));
                fetchMappings();
            } else {
                alert(t("mapping.saveFail"));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteMapping = () => {
        if (!selectedMappingId) return;
        openConfirm(t("keyword.deleteSettingConfirm"), async () => {
            try {
                const res = await fetch(`/api/user/excel-mappings?id=${selectedMappingId}`, { method: "DELETE" });
                if (res.ok) {
                    alert(t("keyword.deleteSettingSuccess"));
                    setSelectedMappingId("");
                    localStorage.removeItem("lastPurchaseMappingId");
                    fetchMappings();
                }
            } catch (e) {
                console.error(e);
            }
        });
    };

    const handleSelectMapping = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedMappingId(id);
        if (id) {
            localStorage.setItem("lastPurchaseMappingId", id);
            const m = mappings.find(x => x.id === id);
            if (m) {
                setMapping({
                    date: m.colDate,
                    item: m.colItem,
                    amount: m.colAmount,
                    category: m.colCategory || "",
                    note: m.colNote || "",
                    filterExclude: m.filterExclude || "",
                    filterInclude: m.filterInclude || ""
                });
            }
        } else {
            localStorage.removeItem("lastPurchaseMappingId");
        }
    };

    // 2. Fetch Data
    const fetchData = useCallback(async (keys: string[], p: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: "100",
                keywords: keys.join(",")
            });
            const res = await fetch(`/api/admin/accounting/purchase/list?${params}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setTotal(data.metadata.total);
            }
        } finally {
            setLoading(false);
            setSelectedIds([]); // Reset selection on fetch
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

    const handleConfirm = () => {
        const message = activeKeywords.length > 0
            ? `${activeKeywords.join(", ")} 키워드로 검색된 항목을 일괄 등록하시겠습니까?`
            : `전체 미등록 항목을 일괄 등록하시겠습니까?`;

        openConfirm(message, async () => {
            try {
                const res = await fetch("/api/admin/accounting/purchase/confirm", {
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
        });
    };

    const handleDeleteKeyword = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        openConfirm(t("keyword.deleteConfirm"), async () => {
            try {
                await fetch(`/api/user/keywords?id=${id}`, { method: "DELETE" });
                fetchKeywords();
            } catch (err) {
                console.error(err);
            }
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        // Append mapping fields
        formData.append("mapDate", mapping.date);
        formData.append("mapItem", mapping.item);
        formData.append("mapAmount", mapping.amount);
        formData.append("mapCategory", mapping.category);
        formData.append("mapCategory", mapping.category);
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
            const res = await fetch("/api/admin/accounting/purchase/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${data.count}건의 매입 내역이 업로드되었습니다.`);
                fetchData(activeKeywords, 1);
            } else {
                alert(`업로드 실패: ${data.error || data.message}`);
            }
        } catch (err) {
            console.error(err);
            alert(t("alerts.uploadError"));
        } finally {
            setUploading(false);
            e.target.value = "";
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

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        openConfirm(`${selectedIds.length}건의 항목을 삭제하시겠습니까?`, async () => {
            try {
                const res = await fetch("/api/admin/accounting/purchase/list", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selectedIds })
                });
                if (res.ok) {
                    alert(t("alerts.deleteSuccess"));
                    fetchData(activeKeywords, page);
                } else {
                    alert(t("alerts.deleteFail"));
                }
            } catch (e) {
                console.error(e);
            }
        });
    };

    const handleCreate = async () => {
        if (!newItem.category || !newItem.itemName || !newItem.amount) {
            alert(t("alerts.addRequired"));
            return;
        }

        try {
            const res = await fetch("/api/admin/accounting/purchase/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                alert(t("alerts.addSuccess"));
                setIsAddModalOpen(false);
                setNewItem({
                    date: format(new Date(), "yyyy-MM-dd"),
                    category: "",
                    itemName: "",
                    amount: "",
                    note: ""
                });
                fetchData(activeKeywords, page); // Refresh
            } else {
                alert(t("alerts.addFail"));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startEditing = (item: Item, field: "AMOUNT" | "CATEGORY") => {
        setEditingId(item.id);
        setEditingField(field);
        if (field === "AMOUNT") setEditValue(item.amount.toString());
        if (field === "CATEGORY") setEditValue(item.category);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingField(null);
        setEditValue("");
    };

    const saveEditing = async () => {
        if (!editingId || !editingField) return;

        const payload: Partial<Item> & { id: string } = { id: editingId };
        if (editingField === "AMOUNT") payload.amount = Number(editValue);
        if (editingField === "CATEGORY") payload.category = editValue;

        try {
            const res = await fetch("/api/admin/accounting/purchase/list", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Update local state directly for speed, or refetch
                setItems(prev => prev.map(item =>
                    item.id === editingId ? { ...item, ...payload } : item
                ));
                cancelEditing();
            } else {
                alert(t("alerts.editFail"));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteExcept = () => {
        if (activeKeywords.length === 0) return;
        openConfirm(t("keyword.deleteBulkConfirm", { keywords: activeKeywords.join(", ") }), async () => {
            try {
                const res = await fetch("/api/admin/accounting/purchase/list", {
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
                    alert(t("alerts.deleteFail"));
                }
            } catch (e) {
                console.error(e);
                alert(t("alerts.error"));
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("page.title")}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {t("page.subtitle")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <Button variant="destructive" onClick={handleDeleteSelected}>
                            {t("actions.deleteSelected", { count: selectedIds.length })}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                        {t("actions.addDirect")}
                    </Button>
                    <Button
                        variant={showMapping ? "secondary" : "ghost"}
                        onClick={() => setShowMapping(!showMapping)}
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                        {t("actions.excelSettings")}
                    </Button>
                    <div className="flex items-center gap-2">
                        {/* Mapping Dropdown Moved Here */}
                        <div className="flex gap-1 flex-shrink-0">
                            <select
                                className="border border-input bg-background rounded-md px-2 h-8 text-sm w-auto min-w-[160px] focus:outline-none focus:ring-1 focus:ring-ring"
                                value={selectedMappingId}
                                onChange={handleSelectMapping}
                            >
                                <option value="">{t("mapping.selectPlaceholder")}</option>
                                {mappings.map(m => (
                                    <option key={m.id} value={m.id}>
                                        [{m.type === "SALES" ? t("mapping.typeSales") : t("mapping.typePurchase")}] {m.name}
                                    </option>
                                ))}
                            </select>
                            {selectedMappingId && (
                                <Button variant="destructive" size="sm" className="w-8 h-8 p-0" onClick={handleDeleteMapping} title={t("mapping.deleteTitle")}>
                                    <XMarkIcon className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Filter Mode Selector */}
                        <select
                            className="border border-input bg-background rounded-md px-2 h-8 text-sm max-w-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value as "ALL" | "EXCLUDE" | "INCLUDE")}
                        >
                            <option value="ALL">{t("filter.all")}</option>
                            <option value="EXCLUDE">{t("filter.exclude")}</option>
                            <option value="INCLUDE">{t("filter.include")}</option>
                        </select>

                        <Input
                            type="password"
                            placeholder={t("filter.passwordPlaceholder")}
                            className="w-32"
                            value={excelPassword}
                            onChange={(e) => setExcelPassword(e.target.value)}
                        />
                        <label className={`inline-flex items-center gap-2 cursor-pointer h-9 px-4 text-sm font-medium rounded-md ${uploading ? "bg-primary/70 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                            {uploading ? <><Loader2 className="animate-spin h-4 w-4" /> {t("actions.uploading")}</> : <><ArrowUpTrayIcon className="w-5 h-5" />{t("actions.excelUpload")}</>}
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

            </div>

            {/* Custom Mapping UI */}
            {showMapping && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold">{t("mapping.title")}</h3>
                                <p className="text-xs text-gray-500">{t("mapping.desc")}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleSaveMapping}>
                                    {t("actions.saveCurrentMapping")}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <Label>{t("mapping.colDate")}</Label>
                                <Input className="h-8 text-sm" value={mapping.date} onChange={e => setMapping({ ...mapping, date: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("mapping.colCategory")}</Label>
                                <Input className="h-8 text-sm" value={mapping.category} onChange={e => setMapping({ ...mapping, category: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("mapping.colItem")}</Label>
                                <Input className="h-8 text-sm" value={mapping.item} onChange={e => setMapping({ ...mapping, item: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("mapping.colAmount")}</Label>
                                <Input className="h-8 text-sm" value={mapping.amount} onChange={e => setMapping({ ...mapping, amount: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("mapping.colNote")}</Label>
                                <Input className="h-8 text-sm" value={mapping.note} onChange={e => setMapping({ ...mapping, note: e.target.value })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Keyword Search Section */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    placeholder={t("keyword.inputPlaceholder")}
                                    className="max-w-xs"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <Button variant="outline" size="sm" className="ml-2" onClick={handleSearch}>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </Button>
                            </div>
                            <Button onClick={handleSearch}>{t("actions.search", { count: activeKeywords.length })}</Button>
                            <Button variant="secondary" onClick={handleConfirm}>
                                {activeKeywords.length > 0 ? t("actions.bulkRegisterFiltered") : t("actions.bulkRegisterAll")}
                            </Button>
                        </div>

                        {/* Active Keywords (Chips) */}
                        {activeKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {activeKeywords.map(k => (
                                    <Badge key={k} className="gap-1 pl-3 pr-1 py-1.5">
                                        {k}
                                        <Button variant="ghost" size="sm" className="h-5 w-5 rounded-full p-0 text-white hover:text-white hover:bg-white/20" onClick={() => handleRemoveKeyword(k)}>
                                            <XMarkIcon className="w-3 h-3" />
                                        </Button>
                                    </Badge>
                                ))}
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-gray-500" onClick={() => setActiveKeywords([])}>{t("actions.deleteAllKeywords")}</Button>
                                <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground ml-auto" onClick={handleDeleteExcept}>
                                    {t("actions.deleteExceptSearch")}
                                </Button>
                            </div>
                        )}

                        {/* Saved Keywords (Quick Add) */}
                        {savedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center mt-2 pt-2 border-t border-border">
                                <span className="text-xs font-semibold text-gray-500">{t("keyword.favorites")}</span>
                                {savedKeywords.map((k) => (
                                    <Badge
                                        key={k.id}
                                        variant="secondary"
                                        className={`gap-1 cursor-pointer pr-0 hover:bg-gray-200 ${activeKeywords.includes(k.keyword) ? 'opacity-50' : ''}`}
                                        onClick={() => handleAddKeyword(k.keyword)}
                                    >
                                        {k.keyword}
                                        <button
                                            className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-gray-300"
                                            onClick={(e) => handleDeleteKeyword(k.id, e)}
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted border-0">
                            <TableHead className="w-10">
                                <label>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                                        onChange={handleSelectAll}
                                        checked={items.length > 0 && selectedIds.length === items.length}
                                    />
                                </label>
                            </TableHead>
                            <TableHead>{t("table.colStatus")}</TableHead>
                            <TableHead>{t("table.colDate")}</TableHead>
                            <TableHead>{t("table.colCategory")}</TableHead>
                            <TableHead>{t("table.colItem")}</TableHead>
                            <TableHead className="text-right">{t("table.colAmount")}</TableHead>
                            <TableHead>{t("table.colNote")}</TableHead>
                        </TableRow>

                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                    {t("table.noData")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className={item.confirmed ? "bg-background" : "bg-background opacity-60"}>
                                    <TableHead>
                                        <label>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => handleCheckboxChange(item.id)}
                                            />
                                        </label>
                                    </TableHead>
                                    <TableCell>
                                        {item.confirmed ? (
                                            <Badge className="bg-green-500 text-white hover:bg-green-500 text-xs">{t("table.statusConfirmed")}</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">{t("table.statusPending")}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>
                                    <TableCell>
                                        {editingId === item.id && editingField === "CATEGORY" ? (
                                            <Input
                                                type="text"
                                                className="h-6 text-xs px-2 w-24"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onBlur={saveEditing}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveEditing();
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                                autoFocus
                                            />
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs cursor-pointer hover:bg-gray-200"
                                                onClick={() => startEditing(item, "CATEGORY")}
                                            >
                                                {item.category}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell className="text-right font-mono text-red-600">
                                        {editingId === item.id && editingField === "AMOUNT" ? (
                                            <Input
                                                type="number"
                                                className="h-6 text-xs px-2 w-24 text-right"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
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
                                                onClick={() => startEditing(item, "AMOUNT")}
                                            >
                                                {-item.amount > 0 ? '+' : ''}{(-item.amount).toLocaleString()}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm max-w-xs truncate" title={item.note || ""}>{item.note}</TableCell>

                                </TableRow>

                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-center p-4 border-t border-border">
                    <div className="flex">
                        <Button variant="outline" size="sm" className="rounded-r-none" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>«</Button>
                        <Button variant="outline" size="sm" className="rounded-none border-x-0 cursor-default hover:bg-background" disabled>{page} / {Math.max(1, Math.ceil(total / 100))}</Button>
                        <Button variant="outline" size="sm" className="rounded-l-none" disabled={page * 100 >= total} onClick={() => setPage(p => p + 1)}>»</Button>
                    </div>

                </div>
            </Card>
            {/* Confirm Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm.title")}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { confirmAction?.(); setConfirmAction(null); }}>{t("confirm.ok")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("addModal.title")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>{t("addModal.labelDate")}</Label>
                            <Input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("addModal.labelCategory")}</Label>
                            <Input type="text" placeholder={t("addModal.placeholderCategory")} value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("addModal.labelItem")}</Label>
                            <Input type="text" placeholder={t("addModal.placeholderItem")} value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("addModal.labelAmount")}</Label>
                            <Input type="number" placeholder={t("addModal.placeholderAmount")} value={newItem.amount} onChange={e => setNewItem({ ...newItem, amount: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("addModal.labelNote")}</Label>
                            <Input type="text" value={newItem.note} onChange={e => setNewItem({ ...newItem, note: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("addModal.cancel")}</Button>
                        <Button onClick={handleCreate}>{t("addModal.add")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
