// src/app/[locale]/admin/stores/hooks/useStoresList.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Store, StoreFormState, UseStoresListReturn } from "../types";
import {
  parseCreateStoreResponse,
  parseDeleteStoresResponse,
  parseStoreListResponse,
  parseUpdateStoreResponse,
} from "../guard/stores";

const EMPTY_FORM: StoreFormState = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radiusMeters: "100",
  timezone: "Asia/Seoul",
  isActive: true,
};

export function useStoresList(): UseStoresListReturn {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setFormState] = useState<StoreFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const notify = useCallback((message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const setForm = useCallback((patch: Partial<StoreFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const isAllSelected = stores.length > 0 && stores.every((s) => selectedIds.has(s.id));
  const isIndeterminate = !isAllSelected && stores.some((s) => selectedIds.has(s.id));

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
      const allIds = stores.map((s) => s.id);
      const allSelected = allIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [stores]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stores", { cache: "no-store" });
      const json = (await res.json()) as unknown;
      const parsed = parseStoreListResponse(json);
      if (!parsed.ok) {
        notify(parsed.code, "error");
        return;
      }
      setStores(parsed.data);
    } catch {
      notify("NETWORK_ERROR", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const refresh = useCallback(() => {
    void fetchList();
  }, [fetchList]);

  const openCreateForm = useCallback(() => {
    setFormMode("create");
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((store: Store) => {
    setFormMode("edit");
    setEditingId(store.id);
    setFormState({
      name: store.name,
      address: store.address ?? "",
      latitude: String(store.latitude),
      longitude: String(store.longitude),
      radiusMeters: String(store.radiusMeters),
      timezone: store.timezone,
      isActive: store.isActive,
    });
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingId(null);
  }, []);

  const submitForm = useCallback(async () => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radiusMeters = Number(form.radiusMeters);

    if (
      !form.name.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radiusMeters)
    ) {
      notify("VALIDATION_ERROR", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (formMode === "create") {
        const res = await fetch("/api/admin/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            address: form.address.trim() || null,
            latitude,
            longitude,
            radiusMeters,
            timezone: form.timezone,
            isActive: form.isActive,
          }),
        });
        const json = (await res.json()) as unknown;
        const parsed = parseCreateStoreResponse(json);
        if (!parsed.ok) {
          notify(parsed.code, "error");
          return;
        }
        notify("createSuccess");
      } else {
        if (!editingId) return;
        const res = await fetch("/api/admin/stores", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name.trim(),
            address: form.address.trim() || null,
            latitude,
            longitude,
            radiusMeters,
            timezone: form.timezone,
            isActive: form.isActive,
          }),
        });
        const json = (await res.json()) as unknown;
        const parsed = parseUpdateStoreResponse(json);
        if (!parsed.ok) {
          notify(parsed.code, "error");
          return;
        }
        notify("updateSuccess");
      }
      setIsFormOpen(false);
      setEditingId(null);
      void fetchList();
    } catch {
      notify("NETWORK_ERROR", "error");
    } finally {
      setSubmitting(false);
    }
  }, [form, formMode, editingId, notify, fetchList]);

  const toggleActive = useCallback(
    async (store: Store) => {
      setTogglingId(store.id);
      try {
        const res = await fetch("/api/admin/stores", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: store.id, isActive: !store.isActive }),
        });
        const json = (await res.json()) as unknown;
        const parsed = parseUpdateStoreResponse(json);
        if (!parsed.ok) {
          notify(parsed.code, "error");
          return;
        }
        notify("toggleActiveSuccess");
        void fetchList();
      } catch {
        notify("NETWORK_ERROR", "error");
      } finally {
        setTogglingId(null);
      }
    },
    [notify, fetchList]
  );

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setDeletingSelected(true);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = (await res.json()) as unknown;
      const parsed = parseDeleteStoresResponse(json);
      if (!parsed.ok) {
        notify(parsed.code, "error"); // 예: STORE_IN_USE
        return;
      }
      notify("deleteSuccess");
      clearSelection();
      void fetchList();
    } catch {
      notify("NETWORK_ERROR", "error");
    } finally {
      setDeletingSelected(false);
    }
  }, [selectedIds, notify, clearSelection, fetchList]);

  const value: UseStoresListReturn = useMemo(
    () => ({
      loading,
      stores,
      refresh,
      isFormOpen,
      formMode,
      form,
      setForm,
      openCreateForm,
      openEditForm,
      closeForm,
      submitting,
      submitForm,
      togglingId,
      toggleActive,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      deleteSelected,
      deletingSelected,
      snackbar,
      closeSnackbar,
    }),
    [
      loading,
      stores,
      refresh,
      isFormOpen,
      formMode,
      form,
      setForm,
      openCreateForm,
      openEditForm,
      closeForm,
      submitting,
      submitForm,
      togglingId,
      toggleActive,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      isAllSelected,
      isIndeterminate,
      clearSelection,
      deleteSelected,
      deletingSelected,
      snackbar,
      closeSnackbar,
    ]
  );

  return value;
}
