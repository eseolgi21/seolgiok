// src/types/auth/types.ts

/** API 성공 공통 형태: payload 제네릭으로 주입 */
export type ApiSuccess<TPayload = Record<string, unknown>> = {
  ok: true;
} & TPayload;

/** API 에러 공통 형태: 코드 문자열과 선택적 메시지 */
export type ApiError<TCode extends string = string> = {
  ok: false;
  code: TCode;
  message?: string;
};

/** API 응답 유니온 */
export type ApiResponse<
  TPayload = Record<string, unknown>,
  TCode extends string = string
> = ApiSuccess<TPayload> | ApiError<TCode>;

/** 백엔드에서 프론트로 내려주는 사용자 안전 정보 */
export type ApiUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  countryCode: string | null;
  createdAt: string; // ISO string
  level: number;
};
