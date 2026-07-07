// src/app/api/admin/stores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

export const dynamic = "force-dynamic";

const SUPPORTED_TIMEZONES = Intl.supportedValuesOf("timeZone");

// ===== 필드 단위 Zod 스키마 =====

const nameSchema = z.string().min(1).max(100);
const addressSchema = z.string().max(300).nullable().optional();
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);
const radiusMetersSchema = z.number().int().min(10).max(2000);
const timezoneSchema = z
  .string()
  .refine((v) => SUPPORTED_TIMEZONES.includes(v), { message: "INVALID_TIMEZONE" });
const isActiveSchema = z.boolean().optional();

const StoreCreateSchema = z.object({
  name: nameSchema,
  address: addressSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  radiusMeters: radiusMetersSchema,
  timezone: timezoneSchema.optional(),
  isActive: isActiveSchema,
});

const StorePatchSchema = z.object({
  id: z.string().min(1),
  name: nameSchema.optional(),
  address: addressSchema,
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  radiusMeters: radiusMetersSchema.optional(),
  timezone: timezoneSchema.optional(),
  isActive: isActiveSchema,
});

const StoreDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const storeInclude = {
  _count: { select: { members: true } },
} as const;

// GET /api/admin/stores
// - ?id 없음: 전체 매장 목록 (isActive 포함, 소속 직원 수 동봉)
// - ?id=STORE_ID: 매장 상세 + 소속 직원 수
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(21);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: storeInclude,
    });

    if (!store) {
      return NextResponse.json({ ok: false, code: "STORE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: store });
  }

  const stores = await prisma.store.findMany({
    include: storeInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: stores });
}

// POST /api/admin/stores
// - body: { name, address?, latitude, longitude, radiusMeters, timezone?, isActive? }
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin(21);
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = StoreCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { name, address, latitude, longitude, radiusMeters, timezone, isActive } = parsed.data;

  try {
    const store = await prisma.store.create({
      data: {
        name,
        address: address ?? null,
        latitude,
        longitude,
        radiusMeters,
        ...(timezone !== undefined ? { timezone } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        updatedBy: session!.user.id,
      },
    });

    return NextResponse.json({ ok: true, data: store }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: false, code: "STORE_NAME_DUPLICATE" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, code: "CREATE_FAILED" }, { status: 500 });
  }
}

// PATCH /api/admin/stores
// - body: { id, ...부분 수정 필드 }
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAdmin(21);
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = StorePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;

  const existing = await prisma.store.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, code: "STORE_NOT_FOUND" }, { status: 404 });
  }

  const data: Prisma.StoreUncheckedUpdateInput = { updatedBy: session!.user.id };
  if (rest.name !== undefined) data.name = rest.name;
  if (rest.address !== undefined) data.address = rest.address;
  if (rest.latitude !== undefined) data.latitude = rest.latitude;
  if (rest.longitude !== undefined) data.longitude = rest.longitude;
  if (rest.radiusMeters !== undefined) data.radiusMeters = rest.radiusMeters;
  if (rest.timezone !== undefined) data.timezone = rest.timezone;
  if (rest.isActive !== undefined) data.isActive = rest.isActive;

  try {
    const store = await prisma.store.update({
      where: { id },
      data,
      include: storeInclude,
    });

    return NextResponse.json({ ok: true, data: store });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: false, code: "STORE_NAME_DUPLICATE" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, code: "UPDATE_FAILED" }, { status: 500 });
  }
}

// DELETE /api/admin/stores
// - body: { ids: string[] } (bulk)
// - 소속 직원(UserInfo)이 있는 매장 삭제 시도 시 FK Restrict 위반(P2003) → 전체 롤백 + STORE_IN_USE
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin(21);
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = StoreDeleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { ids } = parsed.data;

  try {
    const result = await prisma.store.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ ok: false, code: "STORE_IN_USE" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, code: "DELETE_FAILED" }, { status: 500 });
  }
}
