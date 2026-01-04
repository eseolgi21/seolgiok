"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";


type AnalysisItem = {
    merchant: string;
    totalAmount: number;
    count: number;
};

type AnalysisResponse = {
    byAmount: AnalysisItem[];
    byCount: AnalysisItem[];
    byRefund?: AnalysisItem[];
    summary: {
        totalAmount: number;
        totalCount: number;
    };
    availableCards?: string[];
};

export default function AnalysisPage() {
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedCard, setSelectedCard] = useState<string>("");

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCard]); // Auto-fetch when card selection changes

    const handleSearch = () => {
        fetchData();
    };

    const fetchData = async () => {
        setLoading(true);
        const query = new URLSearchParams({
            from: format(dateRange.from, "yyyy-MM-dd"),
            to: format(dateRange.to, "yyyy-MM-dd"),
            ...(selectedCard ? { card: selectedCard } : {}),
        });

        try {
            const res = await fetch(`/api/admin/sales/analysis?${query}`);
            if (res.ok) {
                setData(await res.json());
            }
        } finally {
            setLoading(false);
        }
    };

    const maxAmount = data?.byAmount.length ? data.byAmount[0].totalAmount : 1;
    const maxCount = data?.byCount.length ? data.byCount[0].count : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold whitespace-nowrap">카드 지출 분석</h1>
                    {/* Card Selector next to title */}
                    <select
                        className="select select-bordered select-md text-base max-w-xs"
                        value={selectedCard}
                        onChange={(e) => setSelectedCard(e.target.value)}
                    >
                        <option value="">전체 카드</option>
                        {data?.availableCards?.map((card) => (
                            <option key={card} value={card}>{card}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-base-100 rounded-lg border p-1">
                        <input
                            type="date"
                            className="input input-sm input-ghost"
                            value={format(dateRange.from, "yyyy-MM-dd")}
                            onChange={(e) => e.target.value && setDateRange({ ...dateRange, from: new Date(e.target.value + "T00:00:00") })}
                        />
                        <span className="text-base-content/50">~</span>
                        <input
                            type="date"
                            className="input input-sm input-ghost"
                            value={format(dateRange.to, "yyyy-MM-dd")}
                            onChange={(e) => e.target.value && setDateRange({ ...dateRange, to: new Date(e.target.value + "T00:00:00") })}
                        />
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={handleSearch}>
                        조회
                    </button>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Summary */}
                    <div className="stat bg-base-100 shadow rounded-lg border">
                        <div className="stat-title">총 지출액</div>
                        <div className="stat-value text-error">{data.summary.totalAmount.toLocaleString()}원</div>
                        <div className="stat-desc">{data.summary.totalCount}건 결제</div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-lg border">
                        <div className="stat-title">최다 지출처</div>
                        <div className="stat-value text-primary truncate">
                            {data.byAmount[0]?.merchant || "-"}
                        </div>
                        <div className="stat-desc">{data.byAmount[0]?.totalAmount.toLocaleString() ?? 0}원</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenditure Amount Analysis */}
                <div className="bg-base-100 p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex justify-between">
                        <span>지출 금액 순위 (Top 100)</span>
                        <span className="text-sm font-normal text-gray-500">단위: 원</span>
                    </h3>
                    {loading ? <div className="text-center py-10"><span className="loading loading-spinner"></span></div> : (
                        <div className="space-y-3">
                            {data?.byAmount.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium truncate max-w-[70%]">{idx + 1}. {item.merchant}</span>
                                        <span className={`font-bold ${item.totalAmount < 0 ? 'text-info' : ''}`}>{item.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-base-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${item.totalAmount < 0 ? 'bg-info' : 'bg-error'}`}
                                            style={{ width: `${Math.min(Math.abs(item.totalAmount) / maxAmount * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {data?.byAmount.length === 0 && <div className="text-center text-gray-400 py-4">데이터가 없습니다.</div>}
                        </div>
                    )}
                </div>

                {/* Frequency Analysis */}
                <div className="bg-base-100 p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex justify-between">
                        <span>자주 가는 곳 (Top 20)</span>
                        <span className="text-sm font-normal text-gray-500">단위: 건</span>
                    </h3>
                    {loading ? <div className="text-center py-10"><span className="loading loading-spinner"></span></div> : (
                        <div className="space-y-3">
                            {data?.byCount.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium truncate max-w-[70%]">{idx + 1}. {item.merchant}</span>
                                        <span className="font-bold text-primary">{item.count}건</span>
                                    </div>
                                    <div className="w-full bg-base-200 rounded-full h-2.5">
                                        <div
                                            className="bg-primary h-2.5 rounded-full"
                                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {data?.byCount.length === 0 && <div className="text-center text-gray-400 py-4">데이터가 없습니다.</div>}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}
