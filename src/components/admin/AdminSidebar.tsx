"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavNode = {
  label: string;
  href?: string;
  children?: NavNode[];
};

const navTree: NavNode[] = [
  { label: "대시보드", href: "/admin/dashboard" },
  {
    label: "유저 관리",
    children: [{ label: "유저 목록", href: "/admin/users/list" }],
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
      { label: "매입 내역 (엑셀)", href: "/admin/purchase/list" },
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
      { label: "순수익 정산", href: "/admin/profit/settlement" },
    ],
  },
  {
    label: "게시판 관리",
    children: [
      { label: "공지사항", href: "/admin/boards/announcements" },
      { label: "이벤트", href: "/admin/boards/events" },
    ],
  },
];

function normalizePath(s: string) {
  return s.replace(/\/+$/, "") || "/";
}

function isActivePath(pathname: string | null, href?: string): boolean {
  if (!href || !pathname) return false;
  return normalizePath(pathname) === normalizePath(href);
}

function anyChildActive(pathname: string | null, node: NavNode): boolean {
  if (isActivePath(pathname, node.href)) return true;
  if (node.children) {
    for (const c of node.children) {
      if (anyChildActive(pathname, c)) return true;
    }
  }
  return false;
}

function NavGroup({
  node,
  pathname,
}: {
  node: NavNode;
  pathname: string | null;
}) {
  const active = anyChildActive(pathname, node);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <span>{node.label}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children?.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isActivePath(pathname, child.href)}
                >
                  <Link href={child.href ?? "#"}>{child.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-3">
          <span className="text-base font-bold">설기옥 관리자</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navTree.map((node) => {
              if (node.children) {
                return (
                  <NavGroup key={node.label} node={node} pathname={pathname} />
                );
              }
              return (
                <SidebarMenuItem key={node.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, node.href)}
                  >
                    <Link href={node.href ?? "#"}>{node.label}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
