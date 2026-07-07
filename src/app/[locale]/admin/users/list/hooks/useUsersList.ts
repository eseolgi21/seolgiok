// src/app/admin/users/list/hooks/useUsersList.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseUsersListReturn, UserRow, UserInfoDetail, StoreOption } from "../types";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import {
  parseDeleteUsersResponse,
  parseDetailResponse,
  parseListResponse,
  parseStoreOptionListResponse,
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

  // 매장 배정 상태
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [storeOptionsLoading, setStoreOptionsLoading] = useState<boolean>(false);
  const [editStoreId, setEditStoreIdState] = useState<string | null>(null);

  // 직원 등록/해제 토글 상태
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  // 선택 삭제 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  // pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  const setEditLevel = useCallback((n: number) => {
    setEditLevelState(n);
  }, []);

  // 페이지 변경 시 선택 초기화
  const isAllSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const isIndeterminate = !isAllSelected && users.some((u) => selectedIds.has(u.id));

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = users.map((u) => u.id);
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  }, [users]);

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

  const setEditStoreId = useCallback((id: string | null) => {
    setEditStoreIdState(id);
  }, []);

  // 매장 배정 Select 옵션 로드 (isActive=true 매장 + 현재 배정된 매장이 비활성이어도 유지)
  const fetchStoreOptions = useCallback(
    async (currentStoreId: string | null, currentStoreName: string | null) => {
      setStoreOptionsLoading(true);
      try {
        const res = await fetch("/api/admin/stores", { cache: "no-store" });
        const json = (await res.json()) as unknown;
        const parsed = parseStoreOptionListResponse(json);
        if (!parsed.ok) {
          toast.error("매장 목록 로드 실패", { description: parsed.code });
          setStoreOptions([]);
          return;
        }
        const active = parsed.data.filter((s) => s.isActive);
        if (currentStoreId && !active.some((s) => s.id === currentStoreId)) {
          active.push({ id: currentStoreId, name: currentStoreName ?? currentStoreId, isActive: false });
        }
        setStoreOptions(active);
      } catch {
        toast.error("네트워크 오류", { description: "매장 목록 조회 중 오류가 발생했습니다." });
        setStoreOptions([]);
      } finally {
        setStoreOptionsLoading(false);
      }
    },
    []
  );

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
          setEditStoreIdState(null);
        } else {
          setDetail(parsed.data);
          setEditLevelState(parsed.data ? parsed.data.level : null);
          setEditStoreIdState(parsed.data ? parsed.data.storeId : null);
          void fetchStoreOptions(
            parsed.data ? parsed.data.storeId : null,
            parsed.data?.store ? parsed.data.store.name : null
          );
        }
      } catch {
        toast.error("네트워크 오류", { description: "상세 조회 중 오류가 발생했습니다." });
        setDetail(null);
        setEditLevelState(null);
        setEditStoreIdState(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchStoreOptions]
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
    setEditStoreIdState(null);
    setStoreOptions([]);
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
    if (currentLevel >= USER_LEVELS.ADMIN) return;
    const newLevel = currentLevel >= USER_LEVELS.STAFF ? USER_LEVELS.USER : USER_LEVELS.STAFF;
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

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setDeletingSelected(true);
    try {
      const res = await fetch("/api/admin/users/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      const json = (await res.json()) as unknown;
      const parsed = parseDeleteUsersResponse(json);
      if (!parsed.ok) {
        toast.error("삭제 실패", { description: parsed.error });
        return;
      }
      toast.success(`${parsed.deleted}명 삭제 완료`);
      clearSelection();
      void fetchList();
    } catch {
      toast.error("네트워크 오류", { description: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingSelected(false);
    }
  }, [selectedIds, clearSelection, fetchList]);

  const saveLevel = useCallback(async () => {
    if (!detailUserId || editLevel === null) {
      toast.error("저장 불가", { description: "잘못된 입력입니다." });
      return;
    }
    setSavingLevel(true);
    try {
      const payload = toUpdateLevelPayload(detailUserId, editLevel, editStoreId);
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
  }, [detailUserId, editLevel, editStoreId, fetchDetail]);

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
      storeOptions,
      storeOptionsLoading,
      editStoreId,
      setEditStoreId,
      toggleStaff,
      togglingStaffId,
      page,
      pageSize,
      total,
      setPage,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      deleteSelected,
      deletingSelected,
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
      storeOptions,
      storeOptionsLoading,
      editStoreId,
      setEditStoreId,
      toggleStaff,
      togglingStaffId,
      page,
      pageSize,
      total,
      setPage,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      deleteSelected,
      deletingSelected,
    ]
  );

  return value;
}
