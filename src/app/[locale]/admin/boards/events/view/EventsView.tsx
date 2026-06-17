"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEventsList } from "../hooks/useEventsList";
import { useEventDetail } from "../hooks/useEventDetail";
import type { AdminPostListItem } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsonFetch } from "@/lib/fetch";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteResult =
  | { ok: true; data: { deletedCount: number } }
  | { ok: false; error: string };

function formatIso(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : "-";
}

export default function EventsView() {
  const t = useTranslations("adminBoards");
  const { list, loading, error, refresh } = useEventsList();
  const {
    detail,
    loading: loadingDetail,
    error: errorDetail,
    load: loadDetail,
    clear: clearDetail,
  } = useEventDetail();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // AlertDialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

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

  const onDeleteSelected = useCallback(() => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setPendingDeleteIds(ids);
    setConfirmAction(() => async () => {
      try {
        const result = await jsonFetch<DeleteResult>("/api/admin/boards/events", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!result.ok) {
          alert(t("common.deleteFailPrefix", { error: result.error }));
          return;
        }

        setSelected(new Set());
        await refresh();
        if (detail && ids.includes(detail.id)) clearDetail();
      } catch (e) {
        alert(e instanceof Error ? e.message : "unknown error");
      }
    });
    setConfirmOpen(true);
  }, [selected, detail, clearDetail, refresh, t]);

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("events.pageTitle")}</h1>
          <p className="text-sm opacity-70 mt-1">{t("events.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {t("common.refresh")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            title={t("common.deleteSelected")}
          >
            {t("common.deleteSelected")}
          </Button>
          <Link
            href="/admin/boards/events/new"
            className="inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 rounded-md"
          >
            {t("common.write")}
          </Link>
        </div>
      </div>

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
                    aria-label={t("common.selectAll")}
                    checked={allSelected}
                    onChange={(e) => onToggleAll(e.currentTarget.checked)}
                  />
                </TableHead>
                <TableHead>{t("common.colTitle")}</TableHead>
                <TableHead>{t("common.colPeriod")}</TableHead>
                <TableHead>{t("common.colPublished")}</TableHead>
                <TableHead>{t("common.colCreatedAt")}</TableHead>
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
                    <TableCell>
                      {formatIso(row.eventStartAt)} ~{" "}
                      {formatIso(row.eventEndAt)}
                    </TableCell>
                    <TableCell>{row.isPublished ? "Y" : "N"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {loading ? <div className="mt-2 text-sm">{t("common.loading")}</div> : null}
          {list.length === 0 && !loading ? (
            <div className="mt-2 text-sm opacity-70">{t("common.noData")}</div>
          ) : null}
        </CardContent>
      </Card>

      {/* 상세 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">{t("common.postView")}</h2>
          {detail ? (
            <Button variant="ghost" size="sm" onClick={clearDetail}>
              {t("common.close")}
            </Button>
          ) : null}
        </div>

        {loadingDetail ? (
          <Alert>
            <AlertDescription>{t("common.loading")}</AlertDescription>
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
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{detail.visibility}</Badge>
                <Badge variant="secondary">
                  {detail.isPublished ? t("common.published") : t("common.unpublished")}
                </Badge>
              </div>

              <h3 className="text-lg font-bold mb-2">{detail.title}</h3>

              <div className="text-xs opacity-70 mb-3">
                {t("common.period")}: {formatIso(detail.eventStartAt)} ~{" "}
                {formatIso(detail.eventEndAt)}
              </div>

              <div className="text-xs opacity-70 mb-4">
                {t("common.createdAt")}: {new Date(detail.createdAt).toLocaleString()}
                {detail.publishedAt
                  ? ` · ${t("common.publishedAt")}: ${new Date(detail.publishedAt).toLocaleString()}`
                  : ""}
              </div>

              {detail.bannerUrl ? (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">{t("common.banner")}</div>
                  <a
                    className="link link-primary text-sm break-all"
                    href={detail.bannerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {detail.bannerUrl}
                  </a>
                </div>
              ) : null}

              {detail.ctaLinkUrl ? (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">{t("common.ctaLink")}</div>
                  <a
                    className="link link-primary text-sm break-all"
                    href={detail.ctaLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {detail.ctaLinkUrl}
                  </a>
                </div>
              ) : null}

              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: detail.bodyHtml ?? "" }}
              />

              {detail.bodyRaw ? (
                <details className="mt-4">
                  <summary className="cursor-pointer">
                    {t("common.bodyRaw")}
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
            {t("common.clickToView")}
          </div>
        )}
      </div>
    </div>

    {/* Confirm Dialog */}
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("common.confirmDescEvents", { count: pendingDeleteIds.length })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => { confirmAction?.(); setConfirmAction(null); }}>{t("common.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
