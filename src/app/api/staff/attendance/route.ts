import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { haversineDistanceMeters, isValidLatitude, isValidLongitude } from "@/lib/geo";
import { startOfDayInTimeZone, DEFAULT_TIMEZONE } from "@/lib/timezone";

// 트랜잭션 콜백 내부에서 "이미 같은 타입으로 처리됨"을 던져 트랜잭션을 롤백시키되,
// 바깥 catch에서 P2034(직렬화 충돌)와 구분해 기존 400 응답으로 매핑하기 위한 마커.
class AlreadyClockedError extends Error {
  constructor(public readonly type: "CLOCK_IN" | "CLOCK_OUT") {
    super("ALREADY_CLOCKED");
  }
}

// 브라우저 Geolocation은 스푸핑에 취약하며(DevTools 위치 오버라이드, API 직접 호출로 임의
// 좌표 전송 등) 이 구현은 그런 스푸핑을 완화하지 않는 운영적 억제 수단이다.

export const dynamic = "force-dynamic";

const PostBodySchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  latitude: z.number(),
  longitude: z.number(),
});

export async function GET() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  // 배정된 매장의 timezone 기준으로 "오늘" 경계를 계산한다. 아직 매장에 배정되지 않은
  // 직원(storeId=null)은 조회 전용 폴백으로 DEFAULT_TIMEZONE(Asia/Seoul)을 사용한다 —
  // 읽기 전용 GET이라 안전하며, 매장 배정 전에도 과거 로그 조회는 막지 않는다.
  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: { storeId: true, store: { select: { timezone: true } } },
  });
  const timezone = userInfo?.storeId && userInfo.store ? userInfo.store.timezone : DEFAULT_TIMEZONE;
  const todayStart = startOfDayInTimeZone(timezone);

  const logs = await prisma.attendanceLog.findMany({
    where: { userId, clockedAt: { gte: todayStart } },
    orderBy: { clockedAt: "asc" },
  });

  const last = logs.at(-1);
  return NextResponse.json({ ok: true, logs, lastType: last?.type ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user!.id as string;

  const parsed = PostBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID_LOCATION" }, { status: 400 });
  }
  const { type, latitude, longitude } = parsed.data;

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return NextResponse.json({ ok: false, code: "INVALID_LOCATION" }, { status: 400 });
  }

  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: {
      storeId: true,
      store: {
        select: { latitude: true, longitude: true, radiusMeters: true, timezone: true },
      },
    },
  });

  // 매장 미배정 직원은 출퇴근 자체를 완전 차단한다 — 예외 없음.
  if (!userInfo?.storeId) {
    return NextResponse.json({ ok: false, code: "STORE_NOT_ASSIGNED" }, { status: 400 });
  }

  const store = userInfo.store;
  if (!store) {
    // storeId는 있으나 참조하는 Store 행이 없는 데이터 정합성 파괴 상태(방어적 케이스).
    return NextResponse.json(
      { ok: false, code: "STORE_LOCATION_NOT_CONFIGURED" },
      { status: 400 }
    );
  }

  const distanceMeters = haversineDistanceMeters(
    { lat: latitude, lng: longitude },
    { lat: store.latitude, lng: store.longitude }
  );

  if (distanceMeters > store.radiusMeters) {
    return NextResponse.json(
      {
        ok: false,
        code: "OUT_OF_RANGE",
        distanceMeters,
        radiusMeters: store.radiusMeters,
      },
      { status: 400 }
    );
  }

  const storeId = userInfo.storeId;
  const todayStart = startOfDayInTimeZone(store.timezone);

  // 조회(마지막 로그 확인) → 생성(신규 로그)을 Serializable 격리 수준의 단일 트랜잭션으로
  // 묶어 TOCTOU 레이스(동시 더블클릭/재시도로 동일 타입 로그 중복 생성)를 차단한다.
  try {
    const log = await prisma.$transaction(
      async (tx) => {
        const last = await tx.attendanceLog.findFirst({
          where: { userId, clockedAt: { gte: todayStart } },
          orderBy: { clockedAt: "desc" },
        });

        if (last?.type === type) {
          throw new AlreadyClockedError(type);
        }

        return tx.attendanceLog.create({
          data: { userId, type, latitude, longitude, distanceMeters, storeId },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return NextResponse.json({ ok: true, log }, { status: 201 });
  } catch (error) {
    if (error instanceof AlreadyClockedError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.type === "CLOCK_IN" ? "ALREADY_CLOCKED_IN" : "ALREADY_CLOCKED_OUT",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { ok: false, code: "CONCURRENT_REQUEST" },
        { status: 409 }
      );
    }

    throw error;
  }
}
