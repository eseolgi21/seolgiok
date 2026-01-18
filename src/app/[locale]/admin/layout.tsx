// src/app/admin/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
// import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

const DRAWER_ID = "admin-drawer";
// 모바일 헤더 높이(필요하면 조정)
const NAV_H_PX = 48;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) 세션 가져오기
  const session = await auth();
  const level = session?.user?.level ?? 0;

  // 2) 어드민 판정(21 이상)
  const isAdmin = level >= 21;

  // 3) 어드민이 아니면 루트로 리다이렉트
  if (!isAdmin) {
    redirect("/");
  }

  // ✅ 단일 Drawer 레이아웃(모바일: 오버레이, 데스크톱: 항상 열림)
  return (
    <div className="drawer lg:drawer-open min-h-dvh bg-base-200 text-base-content">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />

      {/* 본문 + 모바일 헤더 */}
      <div className="drawer-content">
        <div className="lg:hidden sticky top-0 z-20 bg-base-100/90 backdrop-blur border-b">
          <div className="navbar min-h-12 px-2" style={{ height: NAV_H_PX }}>
            <div className="flex-1">
              <label
                htmlFor={DRAWER_ID}
                aria-label="open sidebar"
                className="btn btn-ghost btn-sm"
              >
                ☰
              </label>
            </div>
            <div className="flex-none px-2 text-sm font-semibold">Admin</div>
          </div>
        </div>

        <main id="main" role="main" className="px-3 py-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* 사이드바 */}
      <div className="drawer-side z-40 lg:z-0">
        {/* 모바일에서 헤더(z-20)보다 위 */}
        <label
          htmlFor={DRAWER_ID}
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>

        <aside
          className="w-72 max-w-[80vw] bg-base-100 border-r min-h-dvh"
          // ✅ 모바일일 때만 헤더 높이 + safe-area-inset-top 만큼 상단 패딩
          style={{
            paddingTop: `calc(${NAV_H_PX}px + env(safe-area-inset-top))`,
          }}
        >
          {/* 데스크톱에선 패딩을 제거하고 싶다면 아래 래퍼로 클래스 보정 */}
          <div className="lg:pt-0 p-3">
            <nav className="menu p-0">
              {/* 기존 메뉴 컴포넌트 */}
              <AdminSidebar />
            </nav>
            <div className="mt-3 text-xs text-base-content/60">© Admin</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
