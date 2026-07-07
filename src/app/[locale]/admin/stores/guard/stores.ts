// src/app/[locale]/admin/stores/guard/stores.ts
// admin/users/list/guard/users.ts 패턴 참고: zod 응답 검증 스키마 + 파서 모음.
// 클라이언트에서도 import하는 순수 파서 모듈이므로 서버 전용 코드(auth 등)를 포함하지 않는다.
//
// 서버 전용 access 체크(requireStoresAccess)는 ./requireStoresAccess.ts로 분리됨.

import { z } from "zod";
import type {
  CreateStoreResponse,
  DeleteStoresResponse,
  StoreDetailResponse,
  StoreListResponse,
  UpdateStoreResponse,
} from "../types";

// ===== 응답 스키마 =====

const StoreSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  address: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().int(),
  timezone: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  updatedBy: z.string().nullable(),
  _count: z.object({ members: z.number().int().min(0) }),
});

export const StoreListOkSchema = z.object({
  ok: z.literal(true),
  data: z.array(StoreSchema),
});
export const StoreListErrSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
});
export const StoreListResponseSchema = z.union([StoreListOkSchema, StoreListErrSchema]);

export const StoreDetailOkSchema = z.object({ ok: z.literal(true), data: StoreSchema });
export const StoreDetailErrSchema = z.object({ ok: z.literal(false), code: z.string() });
export const StoreDetailResponseSchema = z.union([StoreDetailOkSchema, StoreDetailErrSchema]);

export const CreateStoreOkSchema = z.object({ ok: z.literal(true), data: StoreSchema });
export const CreateStoreErrSchema = z.object({ ok: z.literal(false), code: z.string() });
export const CreateStoreResponseSchema = z.union([CreateStoreOkSchema, CreateStoreErrSchema]);

export const UpdateStoreOkSchema = z.object({ ok: z.literal(true), data: StoreSchema });
export const UpdateStoreErrSchema = z.object({ ok: z.literal(false), code: z.string() });
export const UpdateStoreResponseSchema = z.union([UpdateStoreOkSchema, UpdateStoreErrSchema]);

export const DeleteStoresOkSchema = z.object({ ok: z.literal(true), deleted: z.number().int().min(0) });
export const DeleteStoresErrSchema = z.object({ ok: z.literal(false), code: z.string() });
export const DeleteStoresResponseSchema = z.union([DeleteStoresOkSchema, DeleteStoresErrSchema]);

export function parseStoreListResponse(json: unknown): StoreListResponse {
  const parsed = StoreListResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseStoreDetailResponse(json: unknown): StoreDetailResponse {
  const parsed = StoreDetailResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseCreateStoreResponse(json: unknown): CreateStoreResponse {
  const parsed = CreateStoreResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseUpdateStoreResponse(json: unknown): UpdateStoreResponse {
  const parsed = UpdateStoreResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}

export function parseDeleteStoresResponse(json: unknown): DeleteStoresResponse {
  const parsed = DeleteStoresResponseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, code: "INVALID_RESPONSE" };
  return parsed.data;
}
