// src/app/admin/users/list/hooks/useUsersList.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseUsersListReturn, UserRow, UserInfoDetail } from "../types";
import {
  parseDetailResponse,
  parseListResponse,
  parseUpdateLevelResponse,
  toUpdateLevelPayload,
} from "../guard/users";
import { toast } from "sonner";

export function useUsersList(): UseUsersListReturn {

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detail, setDetail] = useState<UserInfoDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  // level edit state
  const [editLevel, setEditLevelState] = useState<number | null>(null);
  const [savingLevel, setSavingLevel] = useState<boolean>(false);

  // 직원 등록/해제 토글 상태
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  const setEditLevel = useCallback((n: number) => {
    setEditLevelState(n);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/users/list?${sp.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as unknown;
      const parsed = parseListResponse(json);
      if (!parsed.ok) {
        setError(parsed.error);
        toast.error("목록 로드 실패", { description: parsed.error });
      } else {
        setUsers(parsed.data);
        setTotal(parsed.total);
      }
    } catch {
      setError("NETWORK_ERROR");
      toast.error("네트워크 오류", { description: "잠시 후 다시 시도하세요." });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const fetchDetail = useCallback(
    async (userId: string) => {
      setDetailLoading(true);
      try {
        const url = `/api/admin/users/list?id=${encodeURIComponent(userId)}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as unknown;
        const parsed = parseDetailResponse(json);
        if (!parsed.ok) {
          toast.error("상세 로드 실패", { description: parsed.error });
          setDetail(null);
          setEditLevelState(null);
        } else {
          setDetail(parsed.data);
          setEditLevelState(parsed.data ? parsed.data.level : null);
        }
      } catch {
        toast.error("네트워크 오류", { description: "상세 조회 중 오류가 발생했습니다." });
        setDetail(null);
        setEditLevelState(null);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const openDetail = useCallback((userId: string) => {
    setDetailUserId(userId);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetail(null);
    setDetailUserId(null);
    setEditLevelState(null);
  }, []);

  const refresh = useCallback(() => {
    void fetchList();
  }, [fetchList]);

  // 초기 및 페이지 변경 시 목록 로드
  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // 상세 패널 열리면 해당 사용자 상세 로드
  useEffect(() => {
    if (detailOpen && detailUserId) {
      void fetchDetail(detailUserId);
    }
  }, [detailOpen, detailUserId, fetchDetail]);

  const toggleStaff = useCallback(async (userId: string, currentLevel: number) => {
    if (currentLevel >= 21) return; // 어드민 보호
    const newLevel = currentLevel >= 10 ? 1 : 10;
    setTogglingStaffId(userId);
    try {
      const payload = toUpdateLevelPayload(userId, newLevel);
      const res = await fetch("/api/admin/users/list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as unknown;
      const parsed = parseUpdateLevelResponse(json);
      if (!parsed.ok) {
        toast.error("저장 실패", { description: parsed.error });
        return;
      }
      const label = newLevel >= 10 ? "직원 등록" : "직원 해제";
      toast.success(`${label} 완료`);
      void fetchList();
    } catch {
      toast.error("네트워크 오류", { description: "저장 중 오류가 발생했습니다." });
    } finally {
      setTogglingStaffId(null);
    }
  }, [fetchList]);

  const saveLevel = useCallback(async () => {
    if (!detailUserId || editLevel === null) {
      toast.error("저장 불가", { description: "잘못된 입력입니다." });
      return;
    }
    setSavingLevel(true);
    try {
      const payload = toUpdateLevelPayload(detailUserId, editLevel);
      const res = await fetch("/api/admin/users/list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as unknown;
      const parsed = parseUpdateLevelResponse(json);
      if (!parsed.ok) {
        toast.error("저장 실패", { description: parsed.error });
        return;
      }
      toast.success("저장 완료", { description: `레벨이 ${parsed.data.level} 로 업데이트되었습니다.` });
      // 상세 재조회
      await fetchDetail(detailUserId);
    } catch {
      toast.error("네트워크 오류", { description: "저장 중 오류가 발생했습니다." });
    } finally {
      setSavingLevel(false);
    }
  }, [detailUserId, editLevel, fetchDetail]);

  const value: UseUsersListReturn = useMemo(
    () => ({
      loading,
      error,
      users,
      detailLoading,
      detail,
      isDetailOpen: detailOpen,
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
    }),
    [
      loading,
      error,
      users,
      detailLoading,
      detail,
      detailOpen,
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
    ]
  );

  return value;
}
