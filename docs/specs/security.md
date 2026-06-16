<!-- Last updated: 2026-06-17 -->

# seolgiok 보안 명세

> **읽기 전용 감사 문서** — 코드 수정 없이 실제 소스 파일을 분석해 작성했다.
> 보안 관련 코드 변경 시 반드시 `security-expert` 에이전트 리뷰가 필요하다.

---

## 인증 아키텍처

### NextAuth 5 설정 (`src/lib/auth/auth.ts`, `src/lib/auth/auth.config.ts`)

| 항목 | 값 |
|---|---|
| 패키지 | `next-auth@5.0.0-beta.31` |
| Provider | `Credentials` (단일) — OAuth 미사용 |
| 세션 방식 | JWT (쿠키 기반) |
| JWT 알고리즘 | `HS256` (jose `SignJWT` 직접 구현) |
| 서명 시크릿 | `AUTH_SECRET` 환경 변수 |
| 토큰 기본 만료 | 30일 (`maxAge ?? 30 * 24 * 60 * 60`) |
| 신뢰 호스트 | `AUTH_TRUST_HOST === "true"` 일 때만 활성화 |
| 로그인 페이지 | `/auth/login` |

### 인증 흐름

```
클라이언트 POST /api/(site)/auth/login
  │
  ├─ 1) prisma.user.findFirst (username/email citext 일치)
  │       미발견 → DUMMY_HASH bcrypt.compare 실행 (타이밍 공격 방어) → 401 INVALID_CREDENTIALS
  │
  ├─ 2) bcrypt.compare(password, user.passwordHash) ← 사전 검증
  │       실패 → 401 INVALID_CREDENTIALS 즉시 반환 (NextAuth 호출 생략)
  │
  ├─ 3) signIn("credentials", { username, password, redirect: false })
  │       NextAuth 내부 authorize() 재검증 (bcrypt 2회 실행)
  │
  └─ 4) 성공 → NextAuth가 HS256 JWT 쿠키 발급
```

> **변경사항 (2026-06-17)**: 로그인 API가 단일 에러 코드 `INVALID_CREDENTIALS`만 반환.
> 구 코드 `USER_NOT_FOUND` / `INVALID_PASSWORD`는 폐기됨 → 계정 열거 공격 방어.
> DUMMY_HASH 더미 bcrypt compare 추가 → 타이밍 공격 방어.

> **주의**: 로그인 라우트(`/api/(site)/auth/login`)는 bcrypt를 두 번 실행한다.
> 한 번은 pre-check에서, 한 번은 NextAuth `authorize()`에서. CPU 오버헤드 존재.

### 보호된 라우트 (`src/lib/auth/auth.config.ts` — `authorized` 콜백)

`src/middleware.ts` 파일은 존재하지 않는다. 라우트 보호는 `auth.config.ts`의 `authorized` 콜백으로만 수행된다.

| 경로 | 규칙 |
|---|---|
| `/admin/**` | 로그인 필수 — 미인증 시 로그인 페이지로 리다이렉트 |
| `/auth/**` | 로그인 상태에서 접근 시 `/admin`으로 리다이렉트 |
| 그 외 | 공개 허용 |

### API 라우트 레벨 권한 검사

`authorized` 콜백은 페이지 접근만 제어한다. API 라우트는 각 핸들러에서 `auth()`를 호출해 세션을 직접 검증한다.

| 최소 level | 허용 동작 | 적용 API |
|---|---|---|
| 10 | 읽기 전용 | 매출·매입 분석, 정산 조회, 기간별 수익, 필터 조회 |
| 20 | 정산 생성 | `profit/settlement` POST |
| 21 | 쓰기 (일반 관리) | 매출·매입 목록/생성/업로드/확정, 카테고리, 아이템, 필터 관리 |
| 인증만 (level 무관) | 사용자 관리 읽기 | `/api/admin/users/list` GET |

세션 없을 때 응답: `{ status: 401, body: { ok: false, error: "UNAUTHORIZED" } }`

### JWT 페이로드에 포함되는 커스텀 클레임

```typescript
// jwt 콜백에서 token.level = user.level 추가
// session 콜백에서 session.user.level, session.user.id(token.sub) 주입
```

---

## 암호화 패턴

### AES-256-GCM 구현 (`src/lib/crypto.ts`)

| 항목 | 값 |
|---|---|
| 알고리즘 | `aes-256-gcm` (Node.js 내장 `node:crypto`) |
| 키 길이 | 32 바이트 (256 bit) |
| IV | `crypto.randomBytes(12)` — GCM 표준 12 바이트, 매 암호화마다 신규 생성 |
| 인증 태그 | `cipher.getAuthTag()` — 16 바이트 GCM 태그 |
| 직렬화 형식 | `AesGcmCipher { cipherTextB64, ivB64, tagB64 }` — 모두 base64 |
| 키 소스 | 환경 변수 `CRED_ENC_KEY_B64` (base64, 32 바이트로 디코드) |

### 공개 함수 목록

| 함수 | 시그니처 | 역할 |
|---|---|---|
| `getAes256GcmKeyFromEnv()` | `() → Buffer` | `CRED_ENC_KEY_B64`에서 키 로드. 미설정 또는 길이 불일치 시 throw |
| `encryptAesGcm(plain, key)` | `(string, Buffer) → AesGcmCipher` | 문자열 암호화. IV 자동 생성 |
| `decryptAesGcm(cipher, key)` | `(AesGcmCipher, Buffer) → string` | AES-256-GCM 복호화 (2026-06-17 추가) |

> **변경사항 (2026-06-17)**: `decryptAesGcm` 함수가 `crypto.ts`에 추가됨.
> `AesGcmCipher { ivB64, tagB64, cipherTextB64 }` 구조를 받아 복호화 후 plaintext 반환.

### 암호화 대상 필드 (현재 코드에서 확인)

`encryptAesGcm` / `decryptAesGcm` / `getAes256GcmKeyFromEnv` 함수는 `src/lib/crypto.ts`에 정의되어 있으며, 현재 소스 코드 내에서 이 함수들을 호출하는 곳은 발견되지 않았다. 구현은 완료되었으나 실제 필드 암호화 적용이 없는 상태다.

### Excel 파일 암호화 복호화 (`officecrypto-tool`)

매출/매입 Excel 업로드 API에서 암호로 보호된 파일을 처리한다.
- `src/app/api/admin/accounting/sales/upload/route.ts`
- `src/app/api/admin/accounting/purchase/upload/route.ts`

```typescript
const decrypted = await officeCrypto.decrypt(fileBuffer, { password: password.trim() });
```

이 복호화는 AES-256-GCM 유틸과 무관하며, Excel 파일 자체 암호 해제용이다.

---

## 2FA / OTP

### Google Authenticator 설정

| 항목 | 값 |
|---|---|
| 라이브러리 | `otpauth@9.5.1` |
| QR 코드 생성 | `qrcode@1.5.4` |
| 발급자 표시 이름 | 환경 변수 `OTP_ISSUER` |

### DB 스키마 (`prisma/schema/User.prisma` — `UserInfo` 모델)

```prisma
googleOtpEnabled Boolean @default(false)
googleOtpSecret  String?
```

OTP 시크릿은 `UserInfo.googleOtpSecret`에 평문으로 저장된다.

> **변경사항 (2026-06-17)**: `googleOtpSecret` 필드가 `GET /api/admin/users/list` API 응답에서 제외됨.
> `userInfoSelect` 객체에서 `googleOtpSecret: true` 제거 → API 외부로 OTP 시크릿 노출 차단.
> UI(`admin/users/list/view/ListView.tsx`)에서도 해당 테이블 행 제거됨.
> 단, DB 저장 자체는 아직 평문 — `CRED_ENC_KEY_B64` 활용한 AES-256-GCM 암호화 적용은 미완성.

### OTP 검증 플로우

소스 코드에서 `otpauth` 라이브러리를 직접 호출하는 API 라우트가 발견되지 않았다. OTP 등록/검증 로직의 구현 위치를 추가 확인이 필요하다 (프론트엔드 또는 별도 라우트에 있을 수 있음).

---

## 입력 검증

### Zod 스키마 기반 검증

API 라우트 전반에서 Zod(`zod@4.4.3`)를 사용해 요청 본문을 검증한다.

| 위치 | 검증 내용 |
|---|---|
| `api/(site)/auth/signup/route.ts` | username 정규식(`/^[a-z0-9_]{4,16}$/`), email 형식, 비밀번호 정책, name 길이, 약관 동의 |
| `api/(site)/auth/resolve-user/route.ts` | query 길이 min 1 / max 254 |
| `api/admin/accounting/sales/create/route.ts` | 날짜·아이템명·금액·옵션 필드 타입 검증 |
| `api/admin/accounting/purchase/create/route.ts` | 동일 패턴 |
| `api/admin/users/list/route.ts` | userId 길이, level 정수 min 1 |

### 비밀번호 정책 (`signup` Zod 스키마)

```
길이: 8 ~ 18자
조건: 영문자 포함, 숫자 포함, 대문자 포함, 특수문자 포함 (4가지 모두 충족 필수)
```

### sanitize-html 적용

`sanitize-html@2.17.4`를 사용한다.

| 위치 | 방식 | 적용 대상 |
|---|---|---|
| `api/admin/boards/announcements/route.ts` (POST, PATCH) | `sanitizeHtmlAllowBasic()` 커스텀 함수 | 게시판 공지 본문 저장 전 |
| `api/admin/boards/events/route.ts` (POST, PATCH) | `sanitizeHtmlAllowBasic()` 커스텀 함수 | 이벤트 본문 저장 전 |
| `app/[locale]/(site)/announcements/[id]/page.tsx` | `sanitizeHtml()` 직접 사용 (`dangerouslySetInnerHTML`) | 공개 공지 본문 렌더링 |

#### `sanitizeHtmlAllowBasic()` 구현 (`gaurd/announcements.ts`, `gaurd/events.ts`)

> **주의**: 이 함수는 `sanitize-html` 라이브러리를 직접 사용하지 않는 커스텀 정규식 구현이다.

```typescript
// script/style/iframe 태그와 내용 제거 (정규식)
// on* 이벤트 핸들러 속성 제거 (정규식)
```

정규식 기반 sanitize는 우회 위험이 있다. 저장 단계에서는 `sanitize-html` 라이브러리를 직접 사용하는 것이 더 안전하다.

공개 렌더링 단계(`announcements/[id]/page.tsx`)는 `sanitize-html` 라이브러리를 직접 사용하며, `allowedTags`에 `img`, `figure`, `figcaption`, `iframe`을 추가로 허용한다.

### citext 컬럼 (대소문자 무시 비교)

PostgreSQL `citext` 확장을 사용한다 (`Base.prisma: extensions = [citext]`).

| 모델 | 컬럼 | 타입 |
|---|---|---|
| `User` | `username` | `@db.Citext @unique` |
| `User` | `email` | `@db.Citext @unique` |

citext를 사용하므로 `WHERE username = 'ADMIN'`과 `WHERE username = 'admin'`이 동일하게 처리된다. 로그인 시 `.toLowerCase()` 변환과 DB 레벨 citext가 이중으로 대소문자를 무시한다.

---

## 세션 규칙

### AUTH_SECRET 사용 방식

| 항목 | 내용 |
|---|---|
| 용도 | JWT HS256 서명 시크릿 |
| 사용 위치 | `auth.config.ts` — `jwt.encode`/`jwt.decode` 내 `new TextEncoder().encode(secret)` |
| 소스 | `next-auth`가 `process.env.AUTH_SECRET`을 자동으로 `secret` 파라미터로 전달 |

### 세션 만료

```typescript
const maxAgeInSeconds = maxAge ?? 30 * 24 * 60 * 60; // 기본 30일
```

JWT `exp` 클레임으로 만료가 설정된다. 갱신(sliding expiry) 로직은 코드에서 발견되지 않았다.

### 로그아웃 처리 (`api/(site)/auth/logout/route.ts`)

```typescript
await signOut({ redirect: false });
return NextResponse.json({ ok: true });
```

`signOut`으로 세션 쿠키를 무효화한다. 서버 사이드 리다이렉트 없이 JSON 응답만 반환하며, 클라이언트가 리다이렉트를 처리한다.

### Prisma 연결 (`src/lib/prisma.ts`)

| 항목 | 내용 |
|---|---|
| 어댑터 | `@prisma/adapter-pg` (`pg.Pool` 기반) |
| 연결 문자열 | `process.env.DATABASE_URL` |
| 싱글톤 | `globalThis` 캐시 — 개발 환경에서 핫리로드 시 연결 재사용 |
| 프로덕션 | 싱글톤 캐시 미적용 (매 모듈 로드마다 새 인스턴스) |
| 쿼리 로깅 | 주석 처리됨 (`// log: ["query", "error", "warn"]`) |

> **주의**: 프로덕션에서 `globalForPrisma.prisma`에 저장하지 않아 `PrismaClient` 인스턴스가 과도하게 생성될 수 있다. Railway 서버리스 환경에서는 연결 풀 소진 위험이 있다.

---

## 보안 의존성

`package.json`에서 확인한 보안 관련 패키지 목록.

| 패키지 | 버전 | 용도 |
|---|---|---|
| `next-auth` | `5.0.0-beta.31` | 인증 프레임워크 (베타 버전) |
| `bcryptjs` | `3.0.2` | 비밀번호 해싱 (bcrypt) |
| `jose` | `6.2.3` | JWT 서명/검증 (HS256) |
| `sanitize-html` | `2.17.4` | HTML XSS 방어 |
| `otpauth` | `9.5.1` | Google OTP/TOTP 생성·검증 |
| `qrcode` | `1.5.4` | OTP QR 코드 생성 |
| `zod` | `4.4.3` | 입력 스키마 검증 |
| `officecrypto-tool` | `0.0.19` | 암호화 Excel 파일 복호화 |
| `ethers` | `6.15.0` | (사용 목적 확인 필요 — 블록체인 라이브러리) |

> **주의**: `next-auth@5.0.0-beta.31`은 베타 버전이다. 프로덕션 보안 픽스 반영 여부를 주기적으로 확인해야 한다.

---

## 보안 체크리스트

코드 변경 시 반드시 검토해야 할 항목.

### 신규 API 라우트 추가 시

- [ ] 핸들러 최상단에서 `auth()` 호출 후 세션 확인
- [ ] 필요한 최소 `level` 레벨 기준 명확히 정의
- [ ] 요청 본문은 Zod 스키마로 검증 (`safeParse` 사용)
- [ ] HTML을 저장하는 경우 `sanitize-html` 라이브러리 직접 적용 (정규식 대체 금지)

### 인증 로직 변경 시

- [ ] `AUTH_SECRET` 로테이션 계획 수립 (기존 세션 일괄 무효화됨)
- [ ] `trustHost` 설정이 프로덕션에서 `AUTH_TRUST_HOST=true`로만 활성화되는지 확인
- [ ] `security-expert` 에이전트 리뷰 필수

### 암호화 관련 변경 시

- [ ] `encryptAesGcm` — IV 재사용 금지 (현재 구현은 `randomBytes(12)` 자동 생성, 유지 필수)
- [ ] `CRED_ENC_KEY_B64` 키 로테이션 시 기존 암호화 데이터 마이그레이션 계획 선행
- [ ] `decryptAesGcm` 구현 전 `security-expert` 설계 검토 필수
- [ ] `security-expert` 에이전트 리뷰 필수

### 비밀번호 처리

- [ ] `bcrypt.hash(password, 12)` 고정 — `BCRYPT_ROUNDS` 환경 변수가 설정되어 있어도 현재 코드는 12를 하드코딩 사용 중 (확인 필요)
- [ ] 비밀번호를 로그에 출력하지 않는지 확인
- [x] 에러 메시지에서 사용자 존재 여부 노출 금지 → `INVALID_CREDENTIALS` 단일 코드 사용 (2026-06-17 수정)

### Prisma 스키마 변경 시

- [ ] citext 의존 필드 변경 시 대소문자 처리 로직 재검토
- [ ] `db-expert` 에이전트 전담 처리
- [ ] `domain-expert` 리뷰 필수

---

## 알려진 보안 제약

### AUTH_TRUST_HOST 설정

```typescript
trustHost: process.env.AUTH_TRUST_HOST === "true"
```

`AUTH_TRUST_HOST=true`는 NextAuth가 `X-Forwarded-Host` 헤더를 신뢰하게 한다. Railway와 같이 리버스 프록시 뒤에 배포할 때 필요하지만, 잘못된 환경에서 활성화하면 호스트 헤더 인젝션 공격에 취약해진다.

- **로컬 개발**: `AUTH_TRUST_HOST` 미설정 또는 `false`
- **Railway 프로덕션**: `AUTH_TRUST_HOST=true` 필수 (Railway 프록시를 신뢰해야 세션 쿠키가 정상 동작)

### 사용자 열거 공격 (User Enumeration) — 수정됨

~~로그인 API가 `USER_NOT_FOUND`와 `INVALID_PASSWORD`를 구분해서 응답한다.~~

**2026-06-17 수정**: 에러 코드를 `INVALID_CREDENTIALS`로 통합. 존재하지 않는 사용자 처리 시 DUMMY_HASH로 더미 bcrypt compare 실행하여 타이밍 공격도 방어.

Rate Limiting은 아직 적용되지 않았다.

### bcrypt 이중 실행

`/api/(site)/auth/login` 경로에서 bcrypt가 두 번 실행된다 (pre-check + NextAuth `authorize`). 의도적인 설계라면 주석으로 명시 권장.

### 관리자 단일 Provider

OAuth/SSO 없이 Credentials Provider만 사용한다. 비밀번호 분실 복구 흐름(이메일 재설정 등)이 코드에서 확인되지 않았다.

### OTP 시크릿 평문 저장

`UserInfo.googleOtpSecret`이 DB에 평문으로 저장된다. DB 침해 시 OTP 시크릿이 노출되며, 공격자가 TOTP 코드를 생성할 수 있다. `CRED_ENC_KEY_B64`를 활용한 AES-256-GCM 암호화 적용을 권장한다.

### Content Security Policy 설정됨 (2026-06-17)

`next.config.ts`에 `SECURITY_HEADERS` 상수로 보안 헤더가 추가됨.

| 헤더 | 값 |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (프로덕션만) |

> `source: "/(.*)"` 패턴으로 모든 경로에 적용.

### next-auth 베타 버전

`next-auth@5.0.0-beta.31`은 프로덕션 준비 완료 버전이 아니다. 안정 버전 출시 시 업그레이드를 검토해야 한다.
