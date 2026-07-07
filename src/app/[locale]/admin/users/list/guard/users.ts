import { z } from "zod";
import type {
  DeleteUsersResponse,
  DetailApiResponse,
  ListApiResponse,
  StoreOptionListResponse,
  UpdateLevelPayload,
  UpdateLevelResponse,
  UserInfoDetail,
  UserRow,
} from "../types";

// 목록 행 스키마 (nullable 허용)
export const UserRowSchema = z.object({
  id: z.string().min(1),
  username: z.string().nullable(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  countryCode: z.string().length(2).nullable(),
  createdAt: z.string().min(1), // ISO 문자열(서버에서 toISOString)
  level: z.number().int().min(1).default(1),
});

// 목록 API 응답 (페이지네이션 메타 포함)
export const ListApiOkSchema = z.object({
  ok: z.literal(true),
  data: z.array(UserRowSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});

export const ListApiErrSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const ListApiResponseSchema = z.union([
  ListApiOkSchema,
  ListApiErrSchema,
]);

// 상세 스키마 (referralCode nullable, level >= 1)
// googleOtpSecret은 API에서 보안상 제외되므로 스키마에 포함하지 않음
export const UserInfoDetailSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  referralCode: z.string().nullable(),
  level: z.number().int().min(1),
  googleOtpEnabled: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  storeId: z.string().nullable(),
  store: z.object({ name: z.string() }).nullable(),
});

// 매장 배정 Select 옵션 (/api/admin/stores GET 응답 중 일부 필드만 사용)
export const StoreOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  isActive: z.boolean(),
});

export const StoreOptionListOkSchema = z.object({
  ok: z.literal(true),
  data: z.array(StoreOptionSchema),
});
export const StoreOptionListErrSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
});
export const StoreOptionListResponseSchema = z.union([
  StoreOptionListOkSchema,
  StoreOptionListErrSchema,
]);

export function parseStoreOptionListResponse(json: unknown): StoreOptionListResponse {
  const parsed = StoreOptionListResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}

export const DetailApiOkSchema = z.object({
  ok: z.literal(true),
  data: UserInfoDetailSchema.nullable(),
});

export const DetailApiErrSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const DetailApiResponseSchema = z.union([
  DetailApiOkSchema,
  DetailApiErrSchema,
]);

// Update Level (+ 매장 배정 storeId)
export const UpdateLevelPayloadSchema = z.object({
  userId: z.string().min(1),
  level: z.number().int().min(1),
  storeId: z.string().min(1).nullable().optional(),
});

export const UpdateLevelOkSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    userId: z.string().min(1),
    level: z.number().int().min(1),
    storeId: z.string().nullable(),
  }),
});

export const UpdateLevelErrSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const UpdateLevelResponseSchema = z.union([
  UpdateLevelOkSchema,
  UpdateLevelErrSchema,
]);

export function parseListResponse(json: unknown): ListApiResponse {
  const parsed = ListApiResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseDetailResponse(json: unknown): DetailApiResponse {
  const parsed = DetailApiResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseUpdateLevelResponse(json: unknown): UpdateLevelResponse {
  const parsed = UpdateLevelResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "INVALID_RESPONSE" };
  return parsed.data;
}

export function isUserRow(x: unknown): x is UserRow {
  return UserRowSchema.safeParse(x).success;
}

export function isUserInfoDetail(x: unknown): x is UserInfoDetail {
  return UserInfoDetailSchema.safeParse(x).success;
}

// Delete
export const DeleteUsersPayloadSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
});

export const DeleteUsersOkSchema = z.object({
  ok: z.literal(true),
  deleted: z.number().int().min(0),
});

export const DeleteUsersErrSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const DeleteUsersResponseSchema = z.union([
  DeleteUsersOkSchema,
  DeleteUsersErrSchema,
]);

export function parseDeleteUsersResponse(json: unknown): DeleteUsersResponse {
  const parsed = DeleteUsersResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "INVALID_RESPONSE" };
  return parsed.data;
}

export function toUpdateLevelPayload(
  userId: string,
  level: number,
  storeId?: string | null
): UpdateLevelPayload {
  const payload: UpdateLevelPayload =
    storeId !== undefined ? { userId, level, storeId } : { userId, level };
  const ok = UpdateLevelPayloadSchema.safeParse(payload);
  if (!ok.success) {
    throw new Error("INVALID_PAYLOAD");
  }
  return payload;
}
