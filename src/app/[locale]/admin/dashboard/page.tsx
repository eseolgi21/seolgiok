
"use client";

// import { useTranslations } from "next-intl";
// import { useTranslations } from "next-intl";
import {
    UsersIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default function AdminDashboardPage() {
    // const t = useTranslations("admin");
    const [stats, setStats] = useState({
        sales: 0,
        purchase: 0,
        profit: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const now = new Date();
            const from = format(startOfMonth(now), "yyyy-MM-dd");
            const to = format(endOfMonth(now), "yyyy-MM-dd");

            try {
                const res = await fetch(`/api/admin/accounting/stats?from=${from}&to=${to}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            label: "이번 달 매출",
            value: `₩${stats.sales.toLocaleString()}`,
            change: "Sales",
            icon: CurrencyDollarIcon,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            label: "이번 달 매입",
            value: `₩${stats.purchase.toLocaleString()}`,
            change: "Cost",
            icon: ArrowTrendingDownIcon,
            color: "text-red-600",
            bg: "bg-red-100",
        },
        {
            label: "이번 달 순수익",
            value: `₩${stats.profit.toLocaleString()}`,
            change: "Profit",
            icon: ArrowTrendingUpIcon,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            label: "전체 사용자",
            value: "1,234",
            change: "+12%",
            icon: UsersIcon,
            color: "text-purple-600",
            bg: "bg-purple-100",
        },
    ];

    return (
        <div className="space-y-6">
            {/* 헤더 섹션 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        설기옥 관리자 페이지 - 실시간 경영 현황
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* 추가 액션 버튼들 (필요시) */}
                    <button className="btn btn-sm btn-outline">리포트 다운로드</button>
                </div>
            </div>

            {/* 통계 카드 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-5">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="badge badge-sm badge-ghost">
                                    {stat.change}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 메인 콘텐츠 영역 (차트/테이블 등) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽 2/3: 메인 차트 또는 현황 */}
                <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title text-base font-bold">월별 수익 추이</h2>
                        <div className="h-64 flex items-center justify-center bg-base-50 rounded-box mt-4 border border-dashed border-base-300">
                            <span className="text-gray-400">차트 영역 (준비 중)</span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 1/3: 최근 활동 또는 알림 */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title text-base font-bold">최근 활동</h2>
                        <ul className="mt-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-[#d4b886]" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">새로운 유저 가입</p>
                                        <p className="text-xs text-gray-500">2분 전</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
