// src/app/api/admin/users/list/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { requireAdmin } from "@/lib/middleware/admin-auth";

// 공용 셀렉트: 목록
const userListSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  countryCode: true,
  createdAt: true,
  info: { select: { level: true } },
} as const;

// 상세: UserInfo by userId (googleOtpSecret 제외 — 암호화된 시크릿은 API 외부 노출 금지)
const userInfoSelect = {
  id: true,
  userId: true,
  referralCode: true,
  level: true,
  googleOtpEnabled: true,
  createdAt: true,
  updatedAt: true,
  storeId: true,
  store: { select: { name: true } },
} as const;

const IdParamSchema = z.string().min(1);

// PATCH payload (레벨 업데이트 + 소속 매장 변경)
const PatchPayloadSchema = z.object({
  userId: z.string().min(1),
  level: z.number().int().min(1),
  storeId: z.string().min(1).nullable().optional(),
});

// 페이지네이션 파라미터 스키마
const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// DELETE payload
const DeletePayloadSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
});

/**
 * adminId를 루트로 하여 "모든" 하위(산하) userId를 BFS로 수집
 */
async function collectAllDownlineIds(rootUserId: string): Promise<Set<string>> {
  const visited = new Set<string>(); // 산하 누적
  let frontier: string[] = [rootUserId]; // 현재 레벨
  const MAX_DEPTH = 20;
  const TAKE_PER_ROUND = 5000;

  for (let depth = 0; depth < MAX_DEPTH && frontier.length > 0; depth += 1) {
    const edges = await prisma.referralEdge.findMany({
      where: { parentId: { in: frontier } },
      select: { childId: true },
      take: TAKE_PER_ROUND,
    });
    if (edges.length === 0) break;

    const nextLevel: string[] = [];
    for (const e of edges) {
      const child = e.childId;
      if (!visited.has(child)) {
        visited.add(child);
        nextLevel.push(child);
      }
    }
    frontier = nextLevel;
  }
  return visited; // root 제외
}

// GET /api/admin/users/list
// - 목록: ?id 미지정 → 슈퍼어드민(level≥99)은 전체, 그 외는 "본인 + 산하" 리스트(페이지네이션)
// - 상세: ?id=USER_ID → 슈퍼어드민은 모든 유저, 그 외는 "본인 또는 산하"일 때만 UserInfo 반환
export async function GET(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const adminId = session!.user.id!;
  const adminLevel = session!.user.level ?? 0;
  const isSuperAdmin = adminLevel >= 99;

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  // 슈퍼어드민이 아닌 경우에만 downline 수집
  let allowedIdsSet: Set<string>;
  if (isSuperAdmin) {
    allowedIdsSet = new Set(); // 슈퍼어드민은 필터 없이 전체 조회 (아래에서 분기)
  } else {
    const downlineSet = await collectAllDownlineIds(adminId);
    allowedIdsSet = new Set<string>([adminId, ...downlineSet]);
  }

  // 상세
  if (idParam !== null) {
    const parse = IdParamSchema.safeParse(idParam);
    if (!parse.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    if (!isSuperAdmin && !allowedIdsSet.has(idParam)) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: idParam },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const info = await prisma.userInfo.findUnique({
      where: { userId: idParam },
      select: userInfoSelect,
    });

    return NextResponse.json({ ok: true, data: info ?? null });
  }

  // 목록 (페이지네이션)
  const pq = PageQuerySchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  });
  const { page, pageSize } = pq.success ? pq.data : { page: 1, pageSize: 20 };

  // 슈퍼어드민: 전체 유저 / 일반 어드민: allowedIds 필터
  const whereClause = isSuperAdmin
    ? {}
    : allowedIdsSet.size === 0
      ? { id: { in: [] as string[] } }
      : { id: { in: Array.from(allowedIdsSet) } };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      select: userListSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = rows.map(({ info, ...r }) => ({
    ...r,
    level: info?.level ?? 1,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ ok: true, data, page, pageSize, total });
}

// PATCH /api/admin/users/list
// - body: { userId, level }
// - 동작: "관리자 본인 또는 산하(모든 레벨) 유저"의 기존 UserInfo가 존재할 때만 level 수정
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const adminId = session!.user.id!;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const parsed = PatchPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PAYLOAD" },
      { status: 400 }
    );
  }

  const { userId, level, storeId } = parsed.data;

  const adminLevel = session!.user.level ?? 0;
  const isSuperAdmin = adminLevel >= 99;

  if (!isSuperAdmin) {
    const downlineSet = await collectAllDownlineIds(adminId);
    const allowedIdsSet = new Set<string>([adminId, ...downlineSet]);
    if (!allowedIdsSet.has(userId)) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }
  }

  // 사용자 및 UserInfo 존재 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "USER_NOT_FOUND" },
      { status: 404 }
    );
  }

  const info = await prisma.userInfo.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (!info) {
    return NextResponse.json(
      { ok: false, error: "USER_INFO_NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const updated = await prisma.userInfo.update({
      where: { userId },
      data: {
        level,
        ...(storeId !== undefined ? { storeId } : {}),
      },
      select: { userId: true, level: true, storeId: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { ok: false, error: "STORE_NOT_FOUND" },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "UPDATE_FAILED" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/list
// - body: { userIds: string[] }
// - 슈퍼어드민: 본인 제외 전체 삭제 가능 / 일반 어드민: 산하 유저만 삭제 가능
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const adminId = session!.user.id!;
  const adminLevel = session!.user.level ?? 0;
  const isSuperAdmin = adminLevel >= 99;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = DeletePayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const { userIds } = parsed.data;

  // 본인 삭제 방지
  if (userIds.includes(adminId)) {
    return NextResponse.json({ ok: false, error: "CANNOT_DELETE_SELF" }, { status: 400 });
  }

  // 권한 확인: 일반 어드민은 산하 유저만 삭제 가능
  if (!isSuperAdmin) {
    const downlineSet = await collectAllDownlineIds(adminId);
    const forbidden = userIds.find((id) => !downlineSet.has(id));
    if (forbidden) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const result = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
