// src/app/[locale]/admin/boards/announcements/view/AnnouncementsView.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAnnouncementsList } from "../hooks/useAnnouncementsList";
import { useAnnouncementDetail } from "../hooks/useAnnouncementDetail";
import type { AdminPostListItem } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DeleteResult =
  | { ok: true; data: { deletedCount: number } }
  | { ok: false; error: string };

async function jsonFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `HTTP ${res.status} ${res.statusText} — non-JSON: ${text.slice(0, 300)}`
    );
  }
  const data = (await res.json()) as unknown;
  return data as T;
}

export default function AnnouncementsListView() {
  const { list, loading, error, refresh } = useAnnouncementsList();
  const {
    detail,
    loading: loadingDetail,
    error: errorDetail,
    load: loadDetail,
    clear: clearDetail,
  } = useAnnouncementDetail();

  // 선택 상태
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const onToggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const allIds = useMemo(() => list.map((r) => r.id), [list]);
  const allSelected = useMemo(
    () => allIds.length > 0 && allIds.every((id) => selected.has(id)),
    [allIds, selected]
  );
  const hasSelection = selected.size > 0;

  const onToggleAll = useCallback(
    (checked: boolean) => {
      if (checked) setSelected(new Set(allIds));
      else setSelected(new Set());
    },
    [allIds]
  );

  const onRowClick = (row: AdminPostListItem) => {
    void loadDetail(row.id);
  };

  const onDeleteSelected = useCallback(async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const ask = window.confirm(`${ids.length}개의 게시글을 삭제할까요?`);
    if (!ask) return;
    try {
      const result = await jsonFetch<DeleteResult>(
        "/api/admin/boards/announcements",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }
      );
      if (!result.ok) {
        alert(`[삭제 실패] ${result.error}`);
        return;
      }
      // 성공
      setSelected(new Set());
      await refresh();
      // 상세에서 보고 있던 글이 삭제되었으면 상세 비우기
      if (detail && ids.includes(detail.id)) clearDetail();
    } catch (e) {
      alert(e instanceof Error ? e.message : "unknown error");
    }
  }, [selected, detail, clearDetail, refresh]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 헤더 + 액션 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">공지 게시판</h1>
          <p className="text-sm opacity-70 mt-1">제목 기준 목록</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            새로고침
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            title="선택 삭제"
          >
            선택 삭제
          </Button>
          <Link
            href="/admin/boards/announcements/new"
            className="inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 rounded-md"
          >
            글쓰기
          </Link>
        </div>
      </div>

      {/* 목록 섹션 */}
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                    aria-label="전체 선택"
                    checked={allSelected}
                    onChange={(e) => onToggleAll(e.currentTarget.checked)}
                  />
                </TableHead>
                <TableHead>제목</TableHead>
                <TableHead>발행</TableHead>
                <TableHead>작성</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => {
                const checked = selected.has(row.id);
                return (
                  <TableRow key={row.id}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                        checked={checked}
                        onChange={(e) =>
                          onToggleOne(row.id, e.currentTarget.checked)
                        }
                      />
                    </TableCell>
                    <TableCell
                      className="font-medium cursor-pointer"
                      onClick={() => onRowClick(row)}
                    >
                      {row.title}
                    </TableCell>
                    <TableCell>{row.isPublished ? "Y" : "N"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {loading ? <div className="mt-2 text-sm">불러오는 중…</div> : null}
          {list.length === 0 && !loading ? (
            <div className="mt-2 text-sm opacity-70">데이터가 없습니다.</div>
          ) : null}
        </CardContent>
      </Card>

      {/* 게시글 보기 섹션 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">게시글 보기</h2>
          {detail ? (
            <Button variant="ghost" size="sm" onClick={clearDetail}>
              닫기
            </Button>
          ) : null}
        </div>

        {loadingDetail ? (
          <Alert>
            <AlertDescription>불러오는 중…</AlertDescription>
          </Alert>
        ) : null}
        {errorDetail ? (
          <Alert variant="destructive">
            <AlertDescription>{errorDetail}</AlertDescription>
          </Alert>
        ) : null}

        {detail ? (
          <Card>
            <CardContent className="p-5">
              <div className="mb-2">
                <Badge variant="secondary" className="mr-2">{detail.visibility}</Badge>
                <Badge variant="secondary">
                  {detail.isPublished ? "발행" : "미발행"}
                </Badge>
              </div>
              <h3 className="text-lg font-bold mb-2">{detail.title}</h3>
              <div className="text-xs opacity-70 mb-4">
                작성: {new Date(detail.createdAt).toLocaleString()}
                {detail.publishedAt
                  ? ` · 발행: ${new Date(detail.publishedAt).toLocaleString()}`
                  : ""}
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: detail.bodyHtml ?? "" }}
              />
              {detail.bodyRaw ? (
                <details className="mt-4">
                  <summary className="cursor-pointer">
                    원문(bodyRaw) 보기
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">
                    {detail.bodyRaw}
                  </pre>
                </details>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="text-sm opacity-70">
            행을 클릭하면 게시글이 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
