// src/app/admin/users/list/view/ListView.tsx
"use client";

import type { UseUsersListReturn, UserRow, UserInfoDetail } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
}) {
  const { rows, onDetail, page, pageSize, total, setPage } = props;

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
              <TableCell>{u.countryCode ?? "-"}</TableCell>
              <TableCell>{formatDate(u.createdAt)}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onDetail(u.id)}>
                  상세보기
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ✅ 페이지네이션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          총 {total}명 · {startIdx}~{endIdx} 표시중 (페이지 {page}/{totalPages})
        </div>

        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none"
            disabled={isFirstPage}
            onClick={goPrev}
          >
            이전
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
            다음
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur z-50 flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">UserInfo 상세</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              닫기
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
                              {savingLevel ? "저장 중..." : "레벨 저장"}
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
                  <AlertDescription>해당 사용자의 UserInfo 가 없습니다.</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={onClose}>
            확인
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
    page,
    pageSize,
    total,
    setPage,
  } = props;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">어드민 · 유저 리스트</h1>
        <Button onClick={refresh}>
          새로고침
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
          <span>불러오는 중…</span>
        </div>
      ) : (
        <UsersTable
          rows={users}
          onDetail={openDetail}
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
