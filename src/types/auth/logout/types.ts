// src/types/auth/logout/types.ts
import type { ApiResponse } from "@/types/auth/types";

/** 로그아웃 에러 코드 */
export type LogoutError = "UNKNOWN";

/** 성공 payload (빈 객체) */
export type LogoutSuccess = Record<string, never>;

/** 최종 응답 타입 */
export type LogoutResponse = ApiResponse<LogoutSuccess, LogoutError>;
