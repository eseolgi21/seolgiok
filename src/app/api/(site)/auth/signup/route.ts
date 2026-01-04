// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ApiError, ApiSuccess, ApiUser } from "@/types/auth/types";
import type { SignupError, SignupResponse } from "@/types/auth/signup/types";
import { EdgeType, Prisma } from "@/generated/prisma";
import { UserModelSchema } from "@/generated/zod/schemas";
import { randomBytes } from "crypto";
import { z } from "zod";

export const runtime = "nodejs";

/** ---------------- 공통 응답 헬퍼 ---------------- */
function bad(code: SignupError, message?: string, status = 400) {
  const body: ApiError<SignupError> = { ok: false, code, message };
  return NextResponse.json(body, { status });
}
function ok(user: ApiUser) {
  const body: ApiSuccess<{ user: ApiUser }> = { ok: true, user };
  return NextResponse.json(body);
}

/** ---------------- 유틸 ---------------- */
function makeReferralCode(username: string): string {
  const prefix = username
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const rand = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${prefix}${rand}`;
}

function isKnownPrismaError(
  e: unknown
): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError;
}

/** ---------------- 입력 스키마(Zod) ---------------- */
const SignupBodySchema = z.object({
  username: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .pipe(z.string().regex(/^[a-z0-9_]{4,16}$/)),

  email: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .pipe(z.string().email()),

  password: z
    .string()
    .min(8)
    .max(18)
    .refine((v) => /[A-Za-z]/.test(v), { message: "password needs letter" })
    .refine((v) => /\d/.test(v), { message: "password needs digit" })
    .refine((v) => /[A-Z]/.test(v), { message: "password needs uppercase" })
    .refine((v) => /[^A-Za-z0-9]/.test(v), {
      message: "password needs special",
    }),

  name: z.string().trim().min(1),

  countryCode: z
    .union([
      z
        .string()
        .trim()
        .transform((v) => v.toUpperCase())
        .pipe(z.string().length(2)),
      z.literal(""),
      z.null(), // ← 추가
    ])
    .transform((v) => (v === "" || v === null ? undefined : v)),

  referrer: z
    .union([z.string().trim(), z.literal(""), z.null()]) // ← null 허용
    .transform((v) => (v === "" || v === null ? undefined : v)),

  sponsor: z
    .union([z.string().trim(), z.literal(""), z.null()]) // ← null 허용
    .transform((v) => (v === "" || v === null ? undefined : v)),

  agreeTerms: z.literal(true),
  agreePrivacy: z.literal(true),
});

type SignupBody = z.infer<typeof SignupBodySchema>;

/** ---------------- 출력 스키마 (DB → 계약 DTO) ---------------- */
const ApiUserOutputSchema = UserModelSchema.pick({
  id: true,
  username: true,
  email: true,
  name: true,
  countryCode: true,
  createdAt: true,
}).transform((u) => {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name ?? "",
    countryCode: u.countryCode ?? null,
    createdAt: (u.createdAt as unknown as Date).toISOString(),
  } satisfies Omit<ApiUser, "level">;
});

/** ---------------- 추천인/후원인 해석 로직 ---------------- */
/**
 * 사용자가 입력한 문자열을 다음 우선순위로 사용자 id를 해석한다:
 * 1) email (insensitive)
 * 2) username (insensitive)
 * 3) user id (exact)
 * 4) UserInfo.referralCode (insensitive) → userId
 *
 * 일치 시 { id } 반환, 없으면 null
 */
async function resolveUserIdByQuery(
  query: string
): Promise<{ id: string } | null> {
  // user id (cuid/uuid 등 문자열 exact)
  const byId = await prisma.user.findUnique({
    where: { id: query },
    select: { id: true },
  });
  if (byId) return byId;

  // referralCode on UserInfo
  const info = await prisma.userInfo.findFirst({
    where: { referralCode: { equals: query, mode: "insensitive" } },
    select: { userId: true },
  });
  if (info) return { id: info.userId };

  // email
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(query);
  if (emailLike) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: query, mode: "insensitive" } },
      select: { id: true },
    });
    if (byEmail) return byEmail;
  }

  // username
  const byUsername = await prisma.user.findFirst({
    where: { username: { equals: query, mode: "insensitive" } },
    select: { id: true },
  });
  if (byUsername) return byUsername;

  return null;
}

/** ---------------- 핸들러 ---------------- */
export async function POST(
  req: Request
): Promise<NextResponse<SignupResponse>> {
  try {
    // 1) 입력 파싱/검증/정규화
    const raw = (await req.json()) as unknown;
    const parsed = SignupBodySchema.safeParse(raw);
    if (!parsed.success) {
      return bad("VALIDATION_ERROR");
    }
    const {
      username,
      email,
      password,
      name,
      countryCode,
      referrer,
      sponsor,
    }: SignupBody = parsed.data;

    // 2) 중복 체크
    const [byU, byE] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { email } }),
    ]);
    if (byU) return bad("USERNAME_TAKEN", undefined, 409);
    if (byE) return bad("EMAIL_TAKEN", undefined, 409);

    // 3) 국가코드 검증(선택)
    if (countryCode) {
      const exists = await prisma.country.findUnique({
        where: { code: countryCode },
        select: { code: true },
      });
      if (!exists) return bad("COUNTRY_NOT_FOUND");
    }

    // 4) (선택) 상위 유저 조회: referrer / sponsor 모두 코드·아이디·이메일 지원
    const [refUser, spUser] = await Promise.all([
      referrer ? resolveUserIdByQuery(referrer) : Promise.resolve(null),
      sponsor ? resolveUserIdByQuery(sponsor) : Promise.resolve(null),
    ]);
    if (referrer && !refUser) return bad("REFERRER_NOT_FOUND");
    if (sponsor && !spUser) return bad("SPONSOR_NOT_FOUND");

    // 5) 생성 트랜잭션 (User + Edge + UserInfo)
    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.$transaction(async (tx) => {
      // User 생성
      const u = await tx.user.create({
        data: {
          username,
          email,
          name,
          passwordHash,
          countryCode: countryCode ?? null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          countryCode: true,
          createdAt: true,
        },
      });

      // ReferralEdge(옵션)
      if (refUser) {
        await tx.referralEdge.create({
          data: {
            type: EdgeType.REFERRER,
            parentId: refUser.id,
            childId: u.id,
          },
        });
      }
      if (spUser) {
        await tx.referralEdge.create({
          data: {
            type: EdgeType.SPONSOR,
            parentId: spUser.id,
            childId: u.id,
          },
        });
      }

      // UserInfo 생성
      let referralCode = makeReferralCode(username);
      for (let i = 0; i < 5; i++) {
        try {
          await tx.userInfo.create({
            data: {
              userId: u.id,
              referralCode,
            },
          });
          break;
        } catch (e) {
          if (isKnownPrismaError(e) && e.code === "P2002") {
            referralCode = makeReferralCode(username);
            if (i === 4) throw e;
          } else {
            throw e;
          }
        }
      }

      // 응답용 level 조회
      const info = await tx.userInfo.findUnique({
        where: { userId: u.id },
        select: { level: true },
      });

      return { u, level: info?.level ?? 1 };
    });

    // 6) 출력 정규화/검증
    const base = ApiUserOutputSchema.parse(created.u);
    const user: ApiUser = { ...base, level: created.level };

    return ok(user);
  } catch (e) {
    if (isKnownPrismaError(e)) {
      if (e.code === "P2002" || e.code === "P2003") {
        return bad("VALIDATION_ERROR");
      }
    }
    return bad("UNKNOWN", "Internal error", 500);
  }
}
