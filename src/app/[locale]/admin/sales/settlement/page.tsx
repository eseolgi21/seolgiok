
"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

type MonthlySettlement = {
    month: string; // YYYY-MM
    salesAmount: number;
    costAmount: number;
    netProfit: number;
    count: number;
};

type DailyData = {
    date: string;
    salesAmount: number;
    costAmount: number;
};

export default function SettlementPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<MonthlySettlement[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSettlement = useCallback(async () => {
        setLoading(true);
        try {
            // Re-use the stats API with year mode implies full year daily data.
            // Or create a new dedicated API.
            // For now, let's just fetch year data from stats API and aggregate locally for "Settlement Table"
            // Ideally backend does aggregation.

            const res = await fetch(`/api/admin/sales/stats?type=year&year=${year}`);
            if (res.ok) {
                const json = await res.json();
                const dailyData: DailyData[] = json.data;

                // Aggregate by month
                const monthlymap = new Map<string, MonthlySettlement>();

                // Initialize all 12 months
                for (let i = 1; i <= 12; i++) {
                    const mKey = `${year}-${String(i).padStart(2, '0')}`;
                    monthlymap.set(mKey, { month: mKey, salesAmount: 0, costAmount: 0, netProfit: 0, count: 0 });
                }

                dailyData.forEach(d => {
                    const mKey = d.date.substring(0, 7); // YYYY-MM
                    const current = monthlymap.get(mKey);
                    if (current) {
                        current.salesAmount += d.salesAmount;
                        current.costAmount += d.costAmount;
                        current.netProfit += (d.salesAmount - d.costAmount);
                        current.count += 1;
                    }
                });

                setData(Array.from(monthlymap.values()));
            }
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchSettlement();
    }, [fetchSettlement]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">월별 손익 정산</h1>
                <div className="flex items-center gap-4">
                    <button className="btn btn-sm btn-circle" onClick={() => setYear(year - 1)}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-semibold min-w-32 text-center">
                        {year}년
                    </span>
                    <button className="btn btn-sm btn-circle" onClick={() => setYear(year + 1)}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-lg border shadow-sm">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr className="bg-base-200">
                            <th>월</th>
                            <th className="text-right">매출 Total</th>
                            <th className="text-right">매입 Total</th>
                            <th className="text-right">순수익</th>
                            <th className="text-center">상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-10"><span className="loading loading-spinner"></span></td></tr>
                        ) : data.map((row) => (
                            <tr key={row.month} className="hover">
                                <td className="font-bold text-lg">{row.month.split("-")[1]}월</td>
                                <td className="text-right font-medium text-primary">
                                    {row.salesAmount.toLocaleString()}
                                </td>
                                <td className="text-right font-medium text-secondary">
                                    {row.costAmount.toLocaleString()}
                                </td>
                                <td className={`text-right font-bold text-lg ${row.netProfit >= 0 ? 'text-success' : 'text-error'}`}>
                                    {row.netProfit.toLocaleString()}
                                </td>
                                <td className="text-center">
                                    {row.count > 0 ? (
                                        <div className="badge badge-outline">데이터 {row.count}건</div>
                                    ) : (
                                        <span className="text-base-content/30">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-base-200 font-bold text-lg">
                            <td>합계</td>
                            <td className="text-right text-primary">{data.reduce((a, b) => a + b.salesAmount, 0).toLocaleString()}</td>
                            <td className="text-right text-secondary">{data.reduce((a, b) => a + b.costAmount, 0).toLocaleString()}</td>
                            <td className="text-right">
                                {data.reduce((a, b) => a + b.netProfit, 0).toLocaleString()}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
