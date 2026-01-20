// src/app/admin/components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
//import { useToast } from "@/components/ui";

/* ---------------------- 타입 & 데이터 ---------------------- */
type NavNode = {
  label: string;
  href?: string;
  children?: NavNode[];
};

const navTree: NavNode[] = [
  { label: "대시보드", href: "/admin/dashboard" },

  {
    label: "유저 관리",
    children: [
      { label: "유저 목록", href: "/admin/users/list" },
    ],
  },

  {
    label: "품목 관리",
    children: [
      { label: "품목 분류 설정", href: "/admin/items" },
      { label: "엑셀 필터 설정", href: "/admin/items/filters" },
    ],
  },

  {
    label: "매입 관리",
    children: [
      { label: "매입 내역 (엑셀)", href: "/admin/purchase" },
      { label: "매입 분석", href: "/admin/purchase/analysis" },
    ],
  },
  {
    label: "매출 관리",
    children: [
      { label: "매출 내역 (엑셀)", href: "/admin/sales/list" },
      { label: "매출 분석", href: "/admin/sales/analysis" },
    ],
  },
  {
    label: "순수익 관리",
    children: [
      { label: "순수익 분석 (월별)", href: "/admin/profit/analysis" },
      { label: "순수익 분석 (기간별)", href: "/admin/profit/period" },
    ],
  },

  {
    label: "게시판 관리",
    children: [
      { label: "공지사항", href: "/admin/boards/announcements" }, //
      { label: "이벤트", href: "/admin/boards/events" }, //
    ],
  },

];

/* ---------------------- 유틸 ---------------------- */
function normalizePath(s: string) {
  return s.replace(/\/+$/, "") || "/";
}
function isActivePath(pathname: string | null, href?: string): boolean {
  if (!href || !pathname) return false;
  return normalizePath(pathname) === normalizePath(href);
}
function anyChildActive(pathname: string | null, node: NavNode): boolean {
  if (isActivePath(pathname, node.href)) return true;
  if (node.children && node.children.length > 0) {
    for (const c of node.children) {
      if (anyChildActive(pathname, c)) return true;
    }
  }
  return false;
}
function nodeKey(prefix: string[], node: NavNode) {
  return [...prefix, node.label].join(" / ");
}
function depthPaddingClass(depth: number): string {
  if (depth <= 0) return "pl-4";
  if (depth === 1) return "pl-6";
  return "pl-8";
}

/* ---------------------- 하위 컴포넌트 ---------------------- */
function Leaf({
  node,
  active,
  depth = 0,
}: {
  node: NavNode;
  active: boolean;
  depth?: number;
}) {
  const pad = depthPaddingClass(depth);
  return (
    <li>
      <Link
        href={node.href ?? "#"}
        className={[
          "w-full rounded-lg px-3 py-2 text-sm",
          pad,
          active
            ? "bg-primary text-primary-content"
            : "hover:bg-base-200 text-base-content/80",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
        {node.label}
      </Link>
    </li>
  );
}

// 1) NavGroup의 props에 openKeys 추가, open boolean 대신 내부에서 계산
function NavGroup({
  node,
  pathTrail,
  pathname,
  openKeys,
  onToggle,
}: {
  node: NavNode;
  pathTrail: string[];
  pathname: string | null;
  openKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const k = nodeKey(pathTrail, node);
  const active = anyChildActive(pathname, node);
  const isOpen = openKeys.has(k);

  return (
    <li className="rounded-lg">
      <button
        type="button"
        onClick={() => onToggle(k)}
        aria-expanded={isOpen}
        className={[
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
          active
            ? "bg-primary/10 text-base-content"
            : "hover:bg-base-200 text-base-content/80",
        ].join(" ")}
      >
        <span className="font-medium">{node.label}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className={[
            "h-4 w-4 transition-transform",
            isOpen ? "rotate-180" : "rotate-0",
          ].join(" ")}
        />
      </button>

      {isOpen && node.children && (
        <ul className="menu mt-1 space-y-1">
          {node.children.map((child) => {
            const ck = nodeKey([...pathTrail, node.label], child);
            if (child.children && child.children.length > 0) {
              return (
                <NavGroup
                  key={ck}
                  node={child}
                  pathTrail={[...pathTrail, node.label]}
                  pathname={pathname}
                  openKeys={openKeys}
                  onToggle={onToggle}
                />
              );
            }
            return (
              <Leaf
                key={ck}
                node={child}
                active={isActivePath(pathname, child.href)}
                depth={1}
              />
            );
          })}
        </ul>
      )}
    </li>
  );
}

/* ---------------------- 메뉴 루트 ---------------------- */
function AdminSidebarMenu() {
  const pathname = usePathname();

  const defaultOpen = useMemo(() => {
    const open = new Set<string>();
    const dfs = (nodes: NavNode[], trail: string[]) => {
      for (const n of nodes) {
        const k = nodeKey(trail, n);
        if (n.children && n.children.length > 0) {
          if (anyChildActive(pathname, n)) open.add(k);
          dfs(n.children, [...trail, n.label]);
        }
      }
    };
    dfs(navTree, []);
    return open;
  }, [pathname]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(defaultOpen);

  useEffect(() => {
    // URL이 변경되어 defaultOpen이 달라지면, 
    // "현재 활성화된 경로"에 해당하는 메뉴를 *추가로* 펼쳐준다. (기존에 펼친 것은 유지)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenKeys((prev) => {
      const next = new Set(prev);
      defaultOpen.forEach((k) => next.add(k));
      return next;
    });
  }, [defaultOpen]);

  const anyActive = useMemo(() => {
    const walk = (nodes: NavNode[]): boolean => {
      for (const n of nodes) {
        if (isActivePath(pathname, n.href)) return true;
        if (n.children && walk(n.children)) return true;
      }
      return false;
    };
    return walk(navTree);
  }, [pathname]);

  // 2) 불필요한 opened 제거
  const onToggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ul className="menu p-2">
      {navTree.map((node) => {
        const k = nodeKey([], node);
        if (node.children && node.children.length > 0) {
          return (
            <NavGroup
              key={k}
              node={node}
              pathTrail={[]}
              pathname={pathname}
              openKeys={openKeys}
              onToggle={onToggle}
            />
          );
        }
        return (
          <Leaf
            key={k}
            node={node}
            active={
              anyActive
                ? isActivePath(pathname, node.href)
                : node.href === "/admin"
            }
            depth={0}
          />
        );
      })}
    </ul>
  );
}

/* ---------------------- 사이드바 컨테이너 ---------------------- */
/**
 * daisyUI drawer 레이아웃 기반의 사이드바
 * - 외부 레이아웃에서 drawer 토글을 제어하려면 같은 id의 checkbox를 사용하세요.
 */
export default function AdminSidebar() {
  return (
    <aside
      className="card w-64 bg-base-100 p-2"
      data-theme="" // 페이지 전역 테마 상속 (테마 코드와 호환)
    >
      <AdminSidebarMenu />
    </aside>
  );
}
