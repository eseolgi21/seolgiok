// src/types/auth/login/types.ts
import type { ApiResponse, ApiUser } from "@/types/auth/types";

/** 로그인 에러 코드 */
export type LoginError = "INVALID_CREDENTIALS" | "VALIDATION_ERROR" | "UNKNOWN";

/** 성공 payload */
export type LoginSuccess = { user: ApiUser };

/** 최종 응답 타입 */
export type LoginResponse = ApiResponse<LoginSuccess, LoginError>;
