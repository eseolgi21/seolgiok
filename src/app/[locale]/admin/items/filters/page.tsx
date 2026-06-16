"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

            <Card>
                <CardContent className="p-6">
                    <Tabs value={activeFilterTab} onValueChange={(v) => setActiveFilterTab(v as "PURCHASE" | "SALES")}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="PURCHASE">매입 필터 ({purchaseFilters.length})</TabsTrigger>
                            <TabsTrigger value="SALES">매출 필터 ({salesFilters.length})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-1 mb-3">
                        <Label>키워드</Label>
                        <Input
                            type="text"
                            className="max-w-xs"
                            placeholder="키워드 입력"
                            value={newFilterKeyword}
                            onChange={(e) => setNewFilterKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddFilter()}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-1 mb-3">
                        <Label>필터 유형</Label>
                        <div className="flex">
                            <button type="button" onClick={() => setIsIncludeMode(false)} className={`h-8 px-3 text-sm border rounded-l-md ${!isIncludeMode ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`} disabled={loading}>제외 필터</button>
                            <button type="button" onClick={() => setIsIncludeMode(true)} className={`h-8 px-3 text-sm border border-l-0 rounded-r-md ${isIncludeMode ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`} disabled={loading}>포함 필터</button>
                        </div>
                    </div>
                    <Button onClick={handleAddFilter} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "추가"}
                    </Button>
                </CardContent>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Exclude List */}
                    <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-red-600">
                            ⛔ 제외 필터
                            <Badge className="text-xs">{excludeFilters.length}</Badge>
                        </h3>
                        <div className="flex flex-wrap gap-2 min-h-[50px]">
                            {excludeFilters.length === 0 && <span className="text-gray-400 text-sm">없음</span>}
                            {excludeFilters.map(f => (
                                <Badge key={f.id} variant="destructive" className="gap-2 px-3 py-1.5">
                                    {f.keyword}
                                    <Button variant="ghost" size="sm" className="h-5 w-5 rounded-full p-0 text-white hover:text-white hover:bg-white/20" onClick={() => handleDeleteFilter(f.id)}>✕</Button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Include List */}
                    <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-green-600">
                            ✅ 포함 필터
                            <Badge className="text-xs">{includeFilters.length}</Badge>
                        </h3>
                        <div className="flex flex-wrap gap-2 min-h-[50px]">
                            {includeFilters.length === 0 && <span className="text-gray-400 text-sm">없음</span>}
                            {includeFilters.map(f => (
                                <Badge key={f.id} className="gap-2 px-3 py-1.5 bg-green-500 text-white hover:bg-green-500">
                                    {f.keyword}
                                    <Button variant="ghost" size="sm" className="h-5 w-5 rounded-full p-0 text-white hover:text-white hover:bg-white/20" onClick={() => handleDeleteFilter(f.id)}>✕</Button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

            </Card>
        </div>

    );
}
