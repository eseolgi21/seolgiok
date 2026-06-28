// src/app/admin/users/list/view/ListView.tsx
"use client";

import type { UseUsersListReturn, UserRow, UserInfoDetail } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";

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

// ✅ UsersTable: 페이지네이션 UI/로직 추가
function UsersTable(props: {
  rows: UserRow[];
  onDetail: (userId: string) => void;
  onToggleStaff: (userId: string, level: number) => void;
  togglingStaffId: string | null;
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
}) {
  const { rows, onDetail, onToggleStaff, togglingStaffId, page, pageSize, total, setPage } = props;
  const t = useTranslations("adminUsers");

  // 총 페이지 수
  const totalPagesRaw = total / pageSize;
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0
      ? Math.ceil(totalPagesRaw)
      : 1;

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const goPrev = () => {
    if (!isFirstPage) {
      setPage(page - 1);
    }
  };

  const goNext = () => {
    if (!isLastPage) {
      setPage(page + 1);
    }
  };

  // 현재 페이지의 시작~끝 index (사람이 보는 번호용)
  // 예: page=2, pageSize=20 → startIdx=21, endIdx=40 (단 total 넘어가면 total로 보정)
  const startIdx = (page - 1) * pageSize + 1;
  const endIdxRaw = page * pageSize;
  const endIdx = endIdxRaw > total ? total : endIdxRaw;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
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
            <TableRow key={u.id}>
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
              <TableCell colSpan={7} className="text-center">
                {t("table.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ✅ 페이지네이션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("table.totalCount", { total })} · {t("table.showing", { start: startIdx, end: endIdx, page, totalPages })}
        </div>

        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none"
            disabled={isFirstPage}
            onClick={goPrev}
          >
            {t("table.prev")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-x-0 cursor-default hover:bg-background"
            disabled
          >
            {page} / {totalPages}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none"
            disabled={isLastPage}
            onClick={goNext}
          >
            {t("table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel(props: {
  open: boolean;
  loading: boolean;
  detail: UserInfoDetail | null;
  onClose: () => void;

  // level edit
  editLevel: number | null;
  setEditLevel: (n: number) => void;
  savingLevel: boolean;
  onSaveLevel: () => void;
}) {
  const {
    open,
    loading,
    detail,
    onClose,
    editLevel,
    setEditLevel,
    savingLevel,
    onSaveLevel,
  } = props;
  const t = useTranslations("adminUsers");
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur z-50 flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("detail.title")}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("detail.close")}
            </Button>
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
                            <Input
                              type="number"
                              min={1}
                              className="h-8 text-sm w-32"
                              value={editLevel ?? ""}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isFinite(v)) {
                                  setEditLevel(v);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={onSaveLevel}
                              disabled={
                                savingLevel || !editLevel || editLevel < 1
                              }
                            >
                              {savingLevel ? t("detail.savingLevel") : t("detail.saveLevel")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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
          <Button variant="outline" onClick={onClose}>
            {t("detail.confirm")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ✅ ListView에서 UsersTable로 page 관련 prop 전달
export default function ListView(props: UseUsersListReturn) {
  const {
    loading,
    error,
    users,
    detailLoading,
    detail,
    isDetailOpen,
    openDetail,
    closeDetail,
    refresh,
    editLevel,
    setEditLevel,
    savingLevel,
    saveLevel,
    toggleStaff,
    togglingStaffId,
    page,
    pageSize,
    total,
    setPage,
  } = props;
  const t = useTranslations("adminUsers");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("page.title")}</h1>
        <Button onClick={refresh}>
          {t("refresh")}
        </Button>
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
      />
    </div>
  );
}
