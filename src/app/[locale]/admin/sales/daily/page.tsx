
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

type DailySale = {
    id: string;
    date: string;
    salesAmount: number;
    costAmount: number;
    note: string | null;
};

export default function DailySalesPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<Record<string, DailySale>>({});
    // const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editForm, setEditForm] = useState({ sales: 0, cost: 0, note: "" });
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        // setLoading(true);
        const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
        const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
        try {
            const res = await fetch(`/api/admin/sales/daily?from=${start}&to=${end}`);
            if (res.ok) {
                const list: DailySale[] = await res.json();
                const map: Record<string, DailySale> = {};
                list.forEach((item) => {
                    map[format(new Date(item.date), "yyyy-MM-dd")] = item;
                });
                setData(map);
            }
        } finally {
            // setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    // Calculate start offset for calendar grid
    const startDay = startOfMonth(currentDate).getDay(); // 0(Sun) - 6(Sat)

    const handleDayClick = (date: Date) => {
        const key = format(date, "yyyy-MM-dd");
        const record = data[key];
        setEditForm({
            sales: record?.salesAmount ?? 0,
            cost: record?.costAmount ?? 0,
            note: record?.note ?? "",
        });
        setSelectedDate(date);
        (document.getElementById("daily_edit_modal") as HTMLDialogElement)?.showModal();
    };

    const handleSave = async () => {
        if (!selectedDate) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/sales/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(selectedDate, "yyyy-MM-dd"),
                    salesAmount: Number(editForm.sales),
                    costAmount: Number(editForm.cost),
                    note: editForm.note,
                }),
            });
            if (res.ok) {
                await fetchData();
                (document.getElementById("daily_edit_modal") as HTMLDialogElement)?.close();
            } else {
                alert("Failed to save");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">일별 매출 입력</h1>
                <div className="flex items-center gap-4">
                    <button className="btn btn-sm btn-circle" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-semibold min-w-32 text-center">
                        {format(currentDate, "yyyy년 M월", { locale: ko })}
                    </span>
                    <button className="btn btn-sm btn-circle" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => setCurrentDate(new Date())}>오늘</button>
                </div>
            </div>

            <div className="bg-base-100 rounded-lg border shadow-sm p-4">
                {/* Calendar Grid Header */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-semibold text-base-content/60">
                    <div className="text-red-500">일</div>
                    <div>월</div>
                    <div>화</div>
                    <div>수</div>
                    <div>목</div>
                    <div>금</div>
                    <div className="text-blue-500">토</div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 auto-rows-[120px]">
                    {/* Empty cells for start offset */}
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-base-200/30 rounded-lg"></div>
                    ))}

                    {days.map((date) => {
                        const dateKey = format(date, "yyyy-MM-dd");
                        const record = data[dateKey];
                        const isTodayDate = isToday(date);
                        const profit = (record?.salesAmount ?? 0) - (record?.costAmount ?? 0);

                        return (
                            <div
                                key={dateKey}
                                onClick={() => handleDayClick(date)}
                                className={`
                  relative border rounded-lg p-2 cursor-pointer transition-all hover:border-primary hover:shadow-md
                  ${isTodayDate ? "bg-primary/5 border-primary" : "bg-base-100 border-base-200"}
                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-medium ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : ''}`}>
                                        {format(date, "d")}
                                    </span>
                                    {record && <div className="badge badge-xs badge-ghost">📝</div>}
                                </div>

                                {record ? (
                                    <div className="mt-2 text-xs space-y-1 text-right">
                                        <div className="text-success font-semibold">+{record.salesAmount.toLocaleString()}</div>
                                        <div className="text-error">-{record.costAmount.toLocaleString()}</div>
                                        <div className={`pt-1 border-t border-base-200 font-bold ${profit >= 0 ? 'text-base-content' : 'text-error'}`}>
                                            {profit.toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100">
                                        <span className="text-4xl text-base-200">+</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            <dialog id="daily_edit_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">
                        {selectedDate && format(selectedDate, "yyyy년 M월 d일")} 매출 입력
                    </h3>

                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">매출 (수입)</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered text-right"
                                value={editForm.sales}
                                onChange={(e) => setEditForm({ ...editForm, sales: Number(e.target.value) })}
                                autoFocus
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">매입 (지출)</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered text-right"
                                value={editForm.cost}
                                onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">비고 / 메모</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-24"
                                value={editForm.note}
                                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                placeholder="특이사항 입력"
                            />
                        </div>

                        <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                            <span className="text-sm font-bold">순수익</span>
                            <span className={`text-lg font-bold ${(editForm.sales - editForm.cost) < 0 ? 'text-error' : 'text-success'}`}>
                                {(editForm.sales - editForm.cost).toLocaleString()} 원
                            </span>
                        </div>
                    </div>

                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost mr-2">취소</button>
                        </form>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <span className="loading loading-spinner"></span> : "저장"}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}
