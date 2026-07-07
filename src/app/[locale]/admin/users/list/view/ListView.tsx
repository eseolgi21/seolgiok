// src/app/admin/users/list/view/ListView.tsx
"use client";

import type { UseUsersListReturn, UserRow, UserInfoDetail, StoreOption } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { ASSIGNABLE_LEVELS } from "@/lib/constants/user-levels";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

function UsersTable(props: {
  rows: UserRow[];
  onDetail: (userId: string) => void;
  onToggleStaff: (userId: string, level: number) => void;
  togglingStaffId: string | null;
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}) {
  const {
    rows, onDetail, onToggleStaff, togglingStaffId,
    page, pageSize, total, setPage,
    selectedIds, toggleSelect, toggleSelectAll, isAllSelected, isIndeterminate,
  } = props;
  const t = useTranslations("adminUsers");

  const totalPagesRaw = total / pageSize;
  const totalPages = Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ? Math.ceil(totalPagesRaw) : 1;
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  // 전체선택 체크박스 indeterminate 처리
  const selectAllRef = useRef<HTMLInputElement>(null);
  if (selectAllRef.current) {
    selectAllRef.current.indeterminate = isIndeterminate;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-black"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                aria-label="전체 선택"
              />
            </TableHead>
            <TableHead>#</TableHead>
            <TableHead>username</TableHead>
            <TableHead>email</TableHead>
            <TableHead>name</TableHead>
            <TableHead>직원</TableHead>
            <TableHead>country</TableHead>
            <TableHead>created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u, idx) => (
            <TableRow
              key={u.id}
              className={selectedIds.has(u.id) ? "bg-muted/50" : ""}
            >
              <TableCell>
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-black"
                  checked={selectedIds.has(u.id)}
                  onChange={() => toggleSelect(u.id)}
                  aria-label={`${u.username ?? u.id} 선택`}
                />
              </TableCell>
              <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>
                {u.level < 21 && (
                  u.level >= 10 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 gap-1"
                      disabled={togglingStaffId === u.id}
                      onClick={() => onToggleStaff(u.id, u.level)}
                    >
                      {togglingStaffId === u.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <UserX className="h-3 w-3" />}
                      직원 해제
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 gap-1"
                      disabled={togglingStaffId === u.id}
                      onClick={() => onToggleStaff(u.id, u.level)}
                    >
                      {togglingStaffId === u.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <UserCheck className="h-3 w-3" />}
                      직원 등록
                    </Button>
                  )
                )}
              </TableCell>
              <TableCell>{u.countryCode ?? "-"}</TableCell>
              <TableCell>{formatDate(u.createdAt)}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onDetail(u.id)}>
                  {t("table.detail")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {t("table.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("table.totalCount", { total })} · {t("table.showing", { start: startIdx, end: endIdx, page, totalPages })}
        </div>
        <div className="flex">
          <Button variant="outline" size="sm" className="rounded-r-none" disabled={isFirstPage} onClick={() => setPage(page - 1)}>
            {t("table.prev")}
          </Button>
          <Button variant="outline" size="sm" className="rounded-none border-x-0 cursor-default hover:bg-background" disabled>
            {page} / {totalPages}
          </Button>
          <Button variant="outline" size="sm" className="rounded-l-none" disabled={isLastPage} onClick={() => setPage(page + 1)}>
            {t("table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

const NO_STORE_VALUE = "__NONE__";

function DetailPanel(props: {
  open: boolean;
  loading: boolean;
  detail: UserInfoDetail | null;
  onClose: () => void;
  editLevel: number | null;
  setEditLevel: (n: number) => void;
  savingLevel: boolean;
  onSaveLevel: () => void;
  storeOptions: StoreOption[];
  storeOptionsLoading: boolean;
  editStoreId: string | null;
  setEditStoreId: (id: string | null) => void;
}) {
  const {
    open, loading, detail, onClose, editLevel, setEditLevel, savingLevel, onSaveLevel,
    storeOptions, storeOptionsLoading, editStoreId, setEditStoreId,
  } = props;
  const t = useTranslations("adminUsers");
  if (!open) return null;

  const showStoreAssignment = editLevel !== null && editLevel >= 10;

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur z-50 flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("detail.title")}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>{t("detail.close")}</Button>
          </div>
          {loading && <Loader2 className="animate-spin h-6 w-6 mx-auto" />}
          {!loading && (
            <>
              {detail ? (
                <div className="space-y-4">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableHead>userId</TableHead>
                        <TableCell>{detail.userId}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableHead>referralCode</TableHead>
                        <TableCell>{detail.referralCode}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableHead>level</TableHead>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={editLevel !== null ? String(editLevel) : ""}
                              onValueChange={(v) => setEditLevel(Number(v))}
                            >
                              <SelectTrigger className="h-8 text-sm w-44">
                                <SelectValue placeholder={t("detail.selectLevelPlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {ASSIGNABLE_LEVELS.map(({ value, labelKey }) => (
                                  <SelectItem key={value} value={String(value)}>
                                    {t(`detail.${labelKey}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={onSaveLevel} disabled={savingLevel || editLevel === null}>
                              {savingLevel ? t("detail.savingLevel") : t("detail.saveLevel")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {showStoreAssignment && (
                        <TableRow>
                          <TableHead>{t("detail.storeLabel")}</TableHead>
                          <TableCell>
                            <Select
                              value={editStoreId ?? NO_STORE_VALUE}
                              onValueChange={(v) => setEditStoreId(v === NO_STORE_VALUE ? null : v)}
                              disabled={storeOptionsLoading}
                            >
                              <SelectTrigger className="h-8 text-sm w-56">
                                <SelectValue placeholder={t("detail.selectStorePlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_STORE_VALUE}>{t("detail.noStoreOption")}</SelectItem>
                                {storeOptions.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                    {!s.isActive ? ` (${t("detail.inactiveStoreSuffix")})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableHead>googleOtpEnabled</TableHead>
                        <TableCell>{detail.googleOtpEnabled ? "true" : "false"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableHead>createdAt</TableHead>
                        <TableCell>{formatDate(detail.createdAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableHead>updatedAt</TableHead>
                        <TableCell>{formatDate(detail.updatedAt)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>{t("detail.noUserInfo")}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={onClose}>{t("detail.confirm")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ListView(props: UseUsersListReturn) {
  const {
    loading, error, users,
    detailLoading, detail, isDetailOpen, openDetail, closeDetail,
    refresh, editLevel, setEditLevel, savingLevel, saveLevel,
    storeOptions, storeOptionsLoading, editStoreId, setEditStoreId,
    toggleStaff, togglingStaffId,
    page, pageSize, total, setPage,
    selectedIds, toggleSelect, toggleSelectAll,
    isAllSelected, isIndeterminate,
    deleteSelected, deletingSelected,
  } = props;
  const t = useTranslations("adminUsers");

  const selectedCount = selectedIds.size;

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("page.title")}</h1>
        <div className="flex items-center gap-2">
          {/* 선택 삭제 버튼 — 1개 이상 선택 시 표시 */}
          {selectedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  disabled={deletingSelected}
                >
                  {deletingSelected
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" />}
                  {t("selection.deleteSelected", { count: selectedCount })}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("selection.confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("selection.confirmDesc", { count: selectedCount })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("selection.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void deleteSelected()}
                  >
                    {t("selection.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={refresh}>{t("refresh")}</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>{t("loading")}</span>
        </div>
      ) : (
        <UsersTable
          rows={users}
          onDetail={openDetail}
          onToggleStaff={toggleStaff}
          togglingStaffId={togglingStaffId}
          page={page}
          pageSize={pageSize}
          total={total}
          setPage={setPage}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      <DetailPanel
        open={isDetailOpen}
        loading={detailLoading}
        detail={detail}
        onClose={closeDetail}
        editLevel={editLevel}
        setEditLevel={setEditLevel}
        savingLevel={savingLevel}
        onSaveLevel={saveLevel}
        storeOptions={storeOptions}
        storeOptionsLoading={storeOptionsLoading}
        editStoreId={editStoreId}
        setEditStoreId={setEditStoreId}
      />
    </div>
  );
}
