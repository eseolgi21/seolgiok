export type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  countryCode: string | null;
  createdAt: string; // ISO
};

export type UserInfoDetail = {
  id: string;
  userId: string;
  referralCode: string | null;
  level: number; // int >= 1
  googleOtpEnabled: boolean;
  googleOtpSecret: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type ListApiOk = {
  ok: true;
  data: UserRow[];
  page: number;
  pageSize: number;
  total: number;
};
export type ListApiErr = { ok: false; error: string };
export type ListApiResponse = ListApiOk | ListApiErr;

export type DetailApiOk = { ok: true; data: UserInfoDetail | null };
export type DetailApiErr = { ok: false; error: string };
export type DetailApiResponse = DetailApiOk | DetailApiErr;

// PATCH: level 업데이트
export type UpdateLevelPayload = {
  userId: string;
  level: number; // int >= 1
};

export type UpdateLevelOk = {
  ok: true;
  data: { userId: string; level: number };
};
export type UpdateLevelErr = { ok: false; error: string };
export type UpdateLevelResponse = UpdateLevelOk | UpdateLevelErr;

export type UseUsersListReturn = {
  loading: boolean;
  error: string | null;
  users: UserRow[];

  detailLoading: boolean;
  detail: UserInfoDetail | null;
  isDetailOpen: boolean;

  // 상세 열기/닫기
  openDetail: (userId: string) => void;
  closeDetail: () => void;

  // 새로고침(목록)
  refresh: () => void;

  // 레벨 수정 상태/동작
  editLevel: number | null;
  setEditLevel: (n: number) => void;
  savingLevel: boolean;
  saveLevel: () => void;

  // 페이지네이션
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
};
