// src/types/auth/signup/types.ts

import { ApiResponse } from "../types";

export type Option = { value: string; label: string };

/** ---------- 백엔드 사용자 페이로드 ---------- */
export type ApiUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  countryCode: string | null;
  createdAt: string; // ISO
  level: number;
};

/** ---------- 회원가입 도메인 ---------- */
export type SignupError =
  | "VALIDATION_ERROR"
  | "USERNAME_TAKEN"
  | "EMAIL_TAKEN"
  | "COUNTRY_CODE_INVALID"
  | "COUNTRY_NOT_FOUND"
  | "REFERRER_NOT_FOUND"
  | "SPONSOR_NOT_FOUND"
  | "UNKNOWN";

export type SignupSuccess = { user: ApiUser };
export type SignupResponse = ApiResponse<SignupSuccess, SignupError>;

export type SignupBody = {
  username: string;
  email: string;
  password: string;
  name: string;
  referrer: string | null;
  sponsor: string | null;
  countryCode: string | null;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

/** resolve-user */
// export type ResolveUserPayload = {
//   id: string;
//   username?: string;
//   email?: string;
// };
// export type ResolveUserResponse = {
//   ok: boolean;
//   user?: ResolveUserPayload | null;
// };

/** ---------- 프론트 폼 상태 / 옵션 ---------- */
export type FormState = {
  username: string;
  email: string;
  password: string;
  password2: string;
  name: string;
  referrer: string;
  sponsor: string;
  countryCode: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

/** 유효성 결과 */
export type SignupValidation = {
  usernameOk: boolean;
  emailOk: boolean;
  pwLenOk: boolean;
  pwHasLetter: boolean;
  pwHasDigit: boolean;
  pwHasUpper: boolean;
  pwHasSymbol: boolean;
  pwAllOk: boolean;
  confirmOk: boolean;
  nameOk: boolean;
  agreementsOk: boolean;
  countryCodeOk: boolean;
};

/** ---------- 컴포넌트 Props(기존 각 파일에 있던 type 이동) ---------- */
// TopPart
export type TopPartValue = {
  username: string;
  email: string;
};

export type TopPartErrorText = {
  username: string;
  email: string;
};

export type TopPartProps = {
  value: TopPartValue;
  onChange: (next: TopPartValue) => void;
  disabled?: boolean;
  errorText?: TopPartErrorText;
};

// MiddlePart
export type ChecklistState = {
  len: boolean;
  letter: boolean;
  digit: boolean;
  upper: boolean;
  symbol: boolean;
  confirmShown: boolean;
  confirmOk: boolean;
};
export type MiddlePartProps = {
  password: string;
  password2: string;
  onPasswordChange: (v: string) => void;
  onPassword2Change: (v: string) => void;
  disabled?: boolean;
  checklist: ChecklistState;
};

// RowPart
export type RowPartValue = {
  name: string;
  countryCode: string;
  ref: string;
};

export type RowPartErrorText = {
  name: string;
  countryCode: string;
  ref: string;
};

export type RowPartProps = {
  value: RowPartValue;
  onChange: (next: RowPartValue) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  errorText?: RowPartErrorText;
};

// Agreements
export type AgreementsProps = {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  onChangeTerms: (v: boolean) => void;
  onChangePrivacy: (v: boolean) => void;
  submitted: boolean;
  disabled?: boolean;
  agreementsOk: boolean;
};

// SubmitBar
export type SubmitBarProps = {
  loading: boolean;
  disabled?: boolean;
};

/** 셀렉트에 사용할 국가 옵션 (필요 시 추가/정렬 가능) */
export const COUNTRY_OPTIONS: Option[] = [
  { value: "", label: "국가 선택" },
  { value: "KR", label: "Korea, Republic of (KR)" },
  { value: "US", label: "United States (US)" },
  { value: "JP", label: "Japan (JP)" },
  { value: "CN", label: "China (CN)" },
  { value: "TW", label: "Taiwan (TW)" },
  { value: "HK", label: "Hong Kong (HK)" },
  { value: "SG", label: "Singapore (SG)" },
  { value: "TH", label: "Thailand (TH)" },
  { value: "VN", label: "Vietnam (VN)" },
  { value: "PH", label: "Philippines (PH)" },
  { value: "ID", label: "Indonesia (ID)" },
  { value: "MY", label: "Malaysia (MY)" },
  { value: "AU", label: "Australia (AU)" },
  { value: "CA", label: "Canada (CA)" },
  { value: "GB", label: "United Kingdom (GB)" },
  { value: "DE", label: "Germany (DE)" },
  { value: "FR", label: "France (FR)" },
  { value: "ES", label: "Spain (ES)" },
  { value: "IT", label: "Italy (IT)" },
  { value: "IN", label: "India (IN)" },
  { value: "BR", label: "Brazil (BR)" },
  { value: "MX", label: "Mexico (MX)" },
];
