"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { XMarkIcon, ArrowPathIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ItemRule = {
    id: string;
    itemName: string;
    category: string;
};

export default function ItemManagementPage() {
    const [type, setType] = useState<"PURCHASE" | "SALES">("PURCHASE");
    const [items, setItems] = useState<ItemRule[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // AlertDialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    const openConfirm = (message: string, action: () => void) => {
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        const result: { name: string; id?: string }[] = [];
        const seen = new Set<string>();

        // Priority 1: DB Categories
        dbCategories.forEach(c => {
            result.push({ name: c.name, id: c.id });
            seen.add(c.name);
        });

        // Priority 2: Used Categories
        items.forEach(i => {
            if (!seen.has(i.category)) {
                result.push({ name: i.category });
                seen.add(i.category);
            }
        });

        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [items, dbCategories]);

    const handleDeleteCategory = (name: string, id: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();

        if (id) {
            openConfirm(`이 분류를 삭제하시겠습니까? (이 분류를 사용하는 자동 분류 규칙은 유지되지만, 저장된 분류 목록에서는 사라집니다.)`, async () => {
                try {
                    await fetch(`/api/admin/accounting/categories?id=${id}`, { method: "DELETE" });
                    fetchCategories();
                } catch (err) {
                    console.error(err);
                    alert("삭제 실패");
                }
            });
        } else {
            const count = items.filter(i => i.category === name).length;
            openConfirm(`'${name}' 분류는 현재 ${count}개의 품목 규칙에서 사용되고 있습니다. 이 분류를 삭제하면, 해당 ${count}개의 품목 규칙도 함께 삭제됩니다. 계속하시겠습니까?`, async () => {
                try {
                    const res = await fetch(`/api/admin/accounting/items?category=${encodeURIComponent(name)}&type=${type}`, { method: "DELETE" });
                    if (res.ok) {
                        fetchItems();
                    }
                } catch (err) {
                    console.error(err);
                    alert("삭제 실패");
                }
            });
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryInput.trim()) return;
        const cat = newCategoryInput.trim();

        try {
            await fetch("/api/admin/accounting/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, name: cat })
            });
            fetchCategories();
        } catch (e) {
            console.error(e);
        }

        setSelectedCategory(cat);
        setNewCategoryInput("");
    };

    const handleSave = () => {
        if (!selectedCategory) {
            alert("분류를 선택해주세요.");
            return;
        }
        if (!itemText.trim()) {
            alert("품목명을 입력해주세요.");
            return;
        }

        openConfirm(`선택한 분류 [${selectedCategory}]로 품목들을 등록하시겠습니까?`, async () => {
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
        });
    };

    const handleDelete = (id: string) => {
        openConfirm("삭제하시겠습니까?", async () => {
            try {
                await fetch(`/api/admin/accounting/items?id=${id}`, { method: "DELETE" });
                fetchItems();
            } catch (e) {
                console.error(e);
            }
        });
    };

    return (
        <>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">품목 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        엑셀 업로드 시 품목명에 따라 자동으로 분류를 지정하는 규칙을 관리합니다.
                    </p>
                </div>
                <Tabs value={type} onValueChange={(v) => setType(v as "PURCHASE" | "SALES")}>
                    <TabsList>
                        <TabsTrigger value="PURCHASE">매입 품목</TabsTrigger>
                        <TabsTrigger value="SALES">(준비중) 매출 품목</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {type === "SALES" ? (
                <Alert>
                    <AlertDescription>
                        현재 매출 품목 자동 분류는 준비 중입니다. 매입 품목 관리만 먼저 사용해주세요.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: List */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between text-lg font-semibold mb-4">
                                등록된 규칙 ({filteredItems.length} / {items.length})
                                <Button variant="ghost" size="sm" className="rounded-full p-1 h-8 w-8" onClick={fetchItems}>
                                    <ArrowPathIcon className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Search Input */}
                            <div className="mb-2">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="품목명 또는 분류 검색..."
                                        className="h-8 text-sm pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[600px]">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>품목명</TableHead>
                                            <TableHead>분류</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                                {searchTerm ? "검색 결과가 없습니다." : "등록된 규칙이 없습니다."}
                                            </TableCell></TableRow>
                                        ) : filteredItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Registration Form */}
                    <div className="space-y-6">

                        {/* 1. Category Manager */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold mb-4">1. 분류 선택 / 추가</h2>
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        type="text"
                                        placeholder="새 분류명 입력 (예: 식자재)"
                                        value={newCategoryInput}
                                        onChange={e => setNewCategoryInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                    />
                                    <Button variant="secondary" onClick={handleAddCategory}>
                                        <PlusIcon className="w-5 h-5" /> 추가
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                                    {allCategories.length === 0 && <span className="text-gray-400 text-sm p-2">등록된 분류가 없습니다.</span>}
                                    {allCategories.map(cat => (
                                        <Badge
                                            key={cat.name}
                                            className={`gap-2 cursor-pointer pr-1 py-2 text-sm ${selectedCategory === cat.name ? '' : 'variant-outline'}`}
                                            variant={selectedCategory === cat.name ? 'default' : 'outline'}
                                            onClick={() => setSelectedCategory(cat.name)}
                                        >
                                            {cat.name}
                                            <button
                                                className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/20"
                                                onClick={(e) => handleDeleteCategory(cat.name, cat.id, e)}
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Item Input */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold mb-2">
                                    2. 품목 등록
                                    {selectedCategory && <span className="text-primary text-sm font-normal ml-2"> (선택된 분류: {selectedCategory})</span>}
                                </h2>
                                <p className="text-sms text-gray-500 mb-2">
                                    선택한 분류에 등록할 품목명을 입력하세요. (한 줄에 하나씩)
                                </p>
                                <Textarea
                                    className="h-48 font-mono text-sm leading-relaxed"
                                    placeholder={selectedCategory ? `[${selectedCategory}] 에 등록할 품목명들을 입력하세요...` : "먼저 위에서 분류를 선택해주세요."}
                                    value={itemText}
                                    onChange={e => setItemText(e.target.value)}
                                    disabled={!selectedCategory}
                                />

                                <div className="flex justify-end mt-4">
                                    <Button className="w-full" onClick={handleSave} disabled={processing || !selectedCategory}>
                                        {processing ? "저장 중..." : "규칙 일괄 저장"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}
        </div>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>확인</AlertDialogTitle>
                    <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { confirmAction?.(); setConfirmAction(null); }}>확인</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
