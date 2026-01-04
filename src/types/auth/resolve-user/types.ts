// src/types/auth/resolve-user/types.ts
import type { ApiError, ApiSuccess } from "../types";

/** 에러 코드 */
export type ResolveUserError = "INVALID_INPUT" | "NOT_FOUND" | "UNKNOWN";

/** 이 라우트가 돌려주는 최소 사용자 형태 */
export type ResolvedUser = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
};

/** 응답 타입: 성공은 user 필드, 실패는 code/message */
export type ResolveUserResponse =
  | ApiSuccess<{ user: ResolvedUser }>
  | ApiError<ResolveUserError>;

export type ResolveUserPayload = {
  /** 유저명 또는 이메일 (trim 후 1~254자) */
  query: string;
};
