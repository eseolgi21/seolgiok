// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ApiError, ApiSuccess, ApiUser } from "@/types/auth/types";
import type { SignupError, SignupResponse } from "@/types/auth/signup/types";
import { Prisma } from "@/generated/prisma";
// import { UserModelSchema } from "@/generated/zod/schemas";
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

  agreeTerms: z.literal(true),
  agreePrivacy: z.literal(true),
});

type SignupBody = z.infer<typeof SignupBodySchema>;

/** ---------------- 출력 스키마 (DB → 계약 DTO) ---------------- */
const UserOutputBase = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  countryCode: z.string().nullable(),
  createdAt: z.date(),
});

const ApiUserOutputSchema = UserOutputBase.transform((u) => {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name ?? "",
    countryCode: u.countryCode ?? null,
    createdAt: (u.createdAt as unknown as Date).toISOString(),
  } satisfies Omit<ApiUser, "level">;
});

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
    const { username, email, password, name }: SignupBody = parsed.data;

    // 2) 중복 체크
    const [byU, byE] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { email } }),
    ]);
    if (byU) return bad("USERNAME_TAKEN", undefined, 409);
    if (byE) return bad("EMAIL_TAKEN", undefined, 409);

    // 3) 생성 트랜잭션 (User + UserInfo)
    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.$transaction(async (tx) => {
      // User 생성
      const u = await tx.user.create({
        data: {
          username,
          email,
          name,
          passwordHash,
          countryCode: null,
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
