// src/app/admin/users/list/view/ListView.tsx
"use client";

import type { UseUsersListReturn, UserRow, UserInfoDetail } from "../types";

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
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>username</th>
              <th>email</th>
              <th>name</th>
              <th>country</th>
              <th>created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, idx) => (
              <tr key={u.id}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.countryCode ?? "-"}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => onDetail(u.id)}>
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ 페이지네이션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-base-content/70">
          총 {total}명 · {startIdx}~{endIdx} 표시중 (페이지 {page}/{totalPages})
        </div>

        <div className="join">
          <button
            className={`join-item btn btn-sm ${isFirstPage ? "btn-disabled" : ""}`}
            disabled={isFirstPage}
            onClick={goPrev}
          >
            이전
          </button>

          <button className="join-item btn btn-sm btn-ghost no-animation cursor-default">
            {page} / {totalPages}
          </button>

          <button
            className={`join-item btn btn-sm ${isLastPage ? "btn-disabled" : ""}`}
            disabled={isLastPage}
            onClick={goNext}
          >
            다음
          </button>
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
    <div className="fixed inset-0 bg-base-100/60 backdrop-blur z-50 flex items-center justify-center">
      <div className="card w-full max-w-xl shadow-xl bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">UserInfo 상세</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              닫기
            </button>
          </div>

          {loading && <div className="loading loading-spinner loading-md" />}

          {!loading && (
            <>
              {detail ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <tbody>
                        <tr>
                          <th>userId</th>
                          <td>{detail.userId}</td>
                        </tr>
                        <tr>
                          <th>referralCode</th>
                          <td>{detail.referralCode}</td>
                        </tr>
                        <tr>
                          <th>level</th>
                          <td>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                className="input input-bordered input-sm w-32"
                                value={editLevel ?? ""}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  if (Number.isFinite(v)) {
                                    setEditLevel(v);
                                  }
                                }}
                              />
                              <button
                                className={`btn btn-sm ${
                                  savingLevel ? "btn-disabled" : "btn-primary"
                                }`}
                                onClick={onSaveLevel}
                                disabled={
                                  savingLevel || !editLevel || editLevel < 1
                                }
                              >
                                {savingLevel ? "저장 중..." : "레벨 저장"}
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th>googleOtpEnabled</th>
                          <td>{detail.googleOtpEnabled ? "true" : "false"}</td>
                        </tr>
                        <tr>
                          <th>googleOtpSecret</th>
                          <td>{detail.googleOtpSecret ?? "-"}</td>
                        </tr>
                        <tr>
                          <th>createdAt</th>
                          <td>{formatDate(detail.createdAt)}</td>
                        </tr>
                        <tr>
                          <th>updatedAt</th>
                          <td>{formatDate(detail.updatedAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="alert">
                  <span>해당 사용자의 UserInfo 가 없습니다.</span>
                </div>
              )}
            </>
          )}

          <div className="card-actions justify-end">
            <button className="btn" onClick={onClose}>
              확인
            </button>
          </div>
        </div>
      </div>
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
        <button className="btn btn-primary" onClick={refresh}>
          새로고침
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-md" />
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
