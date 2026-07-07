// src/app/[locale]/admin/stores/types/index.ts
// 실제 API 응답 필드명 기준 (src/app/api/admin/stores/route.ts 참고)

export type Store = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  updatedBy: string | null;
  _count: { members: number };
};

// GET (목록/상세) 공통 응답
export type StoreListOk = { ok: true; data: Store[] };
export type StoreListErr = { ok: false; code: string };
export type StoreListResponse = StoreListOk | StoreListErr;

export type StoreDetailOk = { ok: true; data: Store };
export type StoreDetailErr = { ok: false; code: string };
export type StoreDetailResponse = StoreDetailOk | StoreDetailErr;

// POST (생성) 요청/응답
export type CreateStorePayload = {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone?: string;
  isActive?: boolean;
};
export type CreateStoreOk = { ok: true; data: Store };
export type CreateStoreErr = { ok: false; code: string };
export type CreateStoreResponse = CreateStoreOk | CreateStoreErr;

// PATCH (부분 수정) 요청/응답
export type UpdateStorePayload = {
  id: string;
  name?: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  timezone?: string;
  isActive?: boolean;
};
export type UpdateStoreOk = { ok: true; data: Store };
export type UpdateStoreErr = { ok: false; code: string };
export type UpdateStoreResponse = UpdateStoreOk | UpdateStoreErr;

// DELETE (선택 삭제) 요청/응답
export type DeleteStoresPayload = { ids: string[] };
export type DeleteStoresOk = { ok: true; deleted: number };
export type DeleteStoresErr = { ok: false; code: string }; // code: "STORE_IN_USE" 등
export type DeleteStoresResponse = DeleteStoresOk | DeleteStoresErr;

// 매장 생성/수정 폼 상태 (문자열 입력 → 제출 시 숫자 변환)
export type StoreFormState = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  timezone: string;
  isActive: boolean;
};

export type UseStoresListReturn = {
  loading: boolean;
  stores: Store[];
  refresh: () => void;

  // 생성/수정 다이얼로그
  isFormOpen: boolean;
  formMode: "create" | "edit";
  form: StoreFormState;
  setForm: (patch: Partial<StoreFormState>) => void;
  openCreateForm: () => void;
  openEditForm: (store: Store) => void;
  closeForm: () => void;
  submitting: boolean;
  submitForm: () => Promise<void>;

  // 활성/비활성 토글
  togglingId: string | null;
  toggleActive: (store: Store) => void;

  // 선택 삭제
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  clearSelection: () => void;
  deleteSelected: () => Promise<void>;
  deletingSelected: boolean;

  // 스낵바(토스트) 알림
  snackbar: { open: boolean; message: string; severity: "success" | "error" };
  closeSnackbar: () => void;
};
