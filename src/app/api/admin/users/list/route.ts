// src/app/api/admin/users/list/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getUserId } from "@/lib/request-user";

// 공용 셀렉트: 목록
const userListSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  countryCode: true,
  createdAt: true,
} as const;

// 상세: UserInfo by userId
const userInfoSelect = {
  id: true,
  userId: true,
  referralCode: true,
  level: true,
  googleOtpEnabled: true,
  googleOtpSecret: true,
  createdAt: true,
  updatedAt: true,
} as const;

const IdParamSchema = z.string().min(1);

// PATCH payload (레벨 업데이트)
const PatchPayloadSchema = z.object({
  userId: z.string().min(1),
  level: z.number().int().min(1),
});

// 페이지네이션 파라미터 스키마
const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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
// - 목록: ?id 미지정 → "관리자 본인 + 산하(모든 레벨)" 사용자 리스트(페이지네이션)
// - 상세: ?id=USER_ID → "관리자 본인 또는 산하(모든 레벨)"일 때만 UserInfo 반환(없으면 data=null)
export async function GET(req: NextRequest) {
  const adminId = await getUserId();
  if (!adminId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // ✅ 산하(모든 레벨) 수집 + 본인 포함
  const downlineSet = await collectAllDownlineIds(adminId);
  const allowedIdsSet = new Set<string>([adminId, ...downlineSet]);
  const allowedIds = Array.from(allowedIdsSet);

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  // 상세
  if (idParam !== null) {
    const parse = IdParamSchema.safeParse(idParam);
    if (!parse.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    if (!allowedIdsSet.has(idParam)) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // 존재 체크
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
  if (allowedIds.length === 0) {
    return NextResponse.json({
      ok: true,
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
  }

  const pq = PageQuerySchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  });
  const { page, pageSize } = pq.success ? pq.data : { page: 1, pageSize: 20 };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where: { id: { in: allowedIds } } }),
    prisma.user.findMany({
      where: { id: { in: allowedIds } },
      select: userListSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ ok: true, data, page, pageSize, total });
}

// PATCH /api/admin/users/list
// - body: { userId, level }
// - 동작: "관리자 본인 또는 산하(모든 레벨) 유저"의 기존 UserInfo가 존재할 때만 level 수정
export async function PATCH(req: NextRequest) {
  const adminId = await getUserId();
  if (!adminId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

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

  const { userId, level } = parsed.data;

  // ✅ 산하(모든 레벨) + 본인 허용
  const downlineSet = await collectAllDownlineIds(adminId);
  const allowedIdsSet = new Set<string>([adminId, ...downlineSet]);

  if (!allowedIdsSet.has(userId)) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
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

  const updated = await prisma.userInfo.update({
    where: { userId },
    data: { level },
    select: { userId: true, level: true },
  });

  return NextResponse.json({ ok: true, data: updated });
}
