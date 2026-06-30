<!-- Last updated: 2026-06-17 -->

# seolgiok 배포 런북

## 기술 스택

| 항목 | 버전 / 사양 |
|---|---|
| Node.js | **>=22.0.0** (package.json `engines` 필드 기준) |
| Next.js | ^16.2.6 (App Router, Turbopack) |
| React | 19.1.0 |
| TypeScript | ^5 (target: es2024) |
| ORM | Prisma 7 (`@prisma/client` ^7.8.0) |
| DB 드라이버 | `@prisma/adapter-pg` + `pg` ^8.20.0 |
| DB | PostgreSQL (Railway 호스팅, `citext` 익스텐션 사용) |
| 인증 | NextAuth 5 (`next-auth` ^5.0.0-beta.31) |
| 국제화 | next-intl ^4.12.0 (5개 로케일: ko/en/ja/zh/vi) |
| 암호화 | AES-256-GCM (`src/lib/crypto.ts`) |
| 스타일 | Tailwind CSS v4 + DaisyUI v5 |
| 빌드 도구 | Turbopack (개발), Next.js 빌드 (프로덕션) |

---

## 환경 변수

`.env.example` 기준으로 확인된 7개 변수.

| 변수명 | 필수 | 용도 | 예시값 / 생성 방법 |
|---|---|---|---|
| `DATABASE_URL` | 필수 | PostgreSQL 연결 문자열. Railway 콘솔에서 PostgreSQL 서비스 연결 시 자동 제공. | `postgresql://user:pass@host:5432/dbname` |
| `AUTH_SECRET` | 필수 | NextAuth 5 세션 서명·암호화 시크릿. 최소 32바이트 이상 랜덤 문자열. | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | 필수 | Railway 등 역방향 프록시 뒤에서 NextAuth가 요청 호스트를 신뢰하도록 설정. | `true` |
| `CRED_ENC_KEY_B64` | 필수 | AES-256-GCM 32바이트 키 (Base64 인코딩). 키 유실 시 암호화 데이터 복호화 불가. | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `OTP_ISSUER` | 필수 | Google Authenticator 등 OTP 앱에 표시될 발급자 이름. | `Seolgiok` |
| `BCRYPT_ROUNDS` | 선택 | 비밀번호 bcrypt 해싱 라운드 수. 높을수록 보안↑ 속도↓. 기본 권장값 12. | `12` |
| `NEXT_PUBLIC_BRAND_NAME` | 필수 | 클라이언트 측에 공개 노출되는 브랜드명. `NEXT_PUBLIC_` 접두사로 번들에 포함됨. | `seolgiok` |

> **주의**: `.env.example`에 예시값이 포함되어 있으나, 실제 시크릿 값을 절대 커밋하지 않는다. `.env.local` 또는 Railway Variables 탭에서 별도 관리한다.

---

## 로컬 개발 셋업

### 1. 사전 조건 확인

```bash
node --version   # v22.x 이상 필요
npm --version    # Node.js 22에 번들된 npm
psql --version   # PostgreSQL 클라이언트 (선택, 디버깅용)
```

### 2. 의존성 설치

```bash
cd /path/to/brand-seolgiok/seolgiok
npm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 각 변수를 실제 값으로 교체한다.

- `DATABASE_URL`: 로컬 PostgreSQL 인스턴스 또는 Railway 개발용 DB URL
- `AUTH_SECRET`: `openssl rand -base64 32` 결과값
- `CRED_ENC_KEY_B64`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` 결과값
- 나머지는 `.env.example` 기본값 그대로 사용 가능

### 4. Prisma 클라이언트 생성 및 DB 마이그레이션

```bash
# Prisma 클라이언트 및 Zod 스키마 코드 생성
npm run generate

# 로컬 개발 DB에 마이그레이션 적용 (새 마이그레이션 생성 포함)
# ※ 마이그레이션 실행은 domain-expert / db-expert 에이전트 전담
npx prisma migrate dev
```

> Prisma 스키마는 `prisma/schema/` 하위 9개 파일로 분리되어 있다 (`Base.prisma`, `User.prisma`, `ReferralEdge.prisma`, `Board.prisma`, `Sales.prisma`, `Purchase.prisma`, `Item.prisma`, `Profit.prisma`). 클라이언트 생성물은 `src/generated/prisma/`에 출력된다.

### 5. (선택) 시드 데이터 삽입

```bash
npm run seed
# 내부적으로 tsx prisma/seed.ts 실행
```

### 6. 개발 서버 실행

```bash
npm run dev
# Turbopack 모드, http://localhost:3000
```

---

## 빌드 & 배포

### npm scripts 전체 목록 (6개)

| 명령어 | 실제 실행 내용 | 용도 |
|---|---|---|
| `npm run dev` | `next dev --turbopack` | Turbopack 기반 개발 서버 실행 (포트 3000) |
| `npm run generate` | `prisma generate` | Prisma 클라이언트 + Zod 스키마 코드 재생성 |
| `npm run build` | `prisma generate && next build` | **프로덕션 빌드** — Prisma 생성 후 Next.js 빌드 |
| `npm run start` | `next start` | 빌드된 프로덕션 서버 시작 |
| `npm run lint` | `eslint` | ESLint 정적 분석 |
| `npm run seed` | `tsx prisma/seed.ts` | DB 시드 데이터 삽입 |

### 프로덕션 빌드 순서

```bash
# 1. 의존성 설치
npm install

# 2. 프로덕션 빌드 (Prisma generate 자동 포함)
npm run build
# 내부 순서: prisma generate → next build

# 3. 서버 시작
npm run start
```

> `npm run build` 내부에 `prisma generate`가 포함되어 있으므로 별도로 generate를 실행할 필요가 없다.

---

## Railway 배포

### Railway 접속 (linetrader 계정)

```bash
source ~/.zshrc              # RAILWAY_API_TOKEN=linetrader 토큰 기본 설정
# 또는 명시적 전환
railway-switch linetrader    # RAILWAY_API_TOKEN 설정 + whoami 확인

# seolgiok 프로젝트 연결 (최초 1회)
cd /Users/aidenyun/project/brand-seolgiok/seolgiok
railway link

# 배포 상태 / 로그 확인
railway status
railway logs -s seolgiok --lines 100
```

### 사전 조건

- Railway CLI 설치 (`npm install -g @railway/cli`)
- `railway link` 실행 완료 (seolgiok 프로젝트 연결)
- PostgreSQL 서비스가 동일 Railway 프로젝트에 연결되어 있을 것

### 환경변수 설정 (Railway 콘솔)

Railway 콘솔 → 해당 서비스 → **Variables** 탭에서 아래 변수를 설정한다.

```
DATABASE_URL          # Railway PostgreSQL 서비스 연결 시 자동 제공됨
AUTH_SECRET           # openssl rand -base64 32
AUTH_TRUST_HOST       # true (Railway 역방향 프록시 신뢰 필수)
CRED_ENC_KEY_B64      # node -e "..." 로 생성한 32바이트 Base64 키
OTP_ISSUER            # Seolgiok (또는 원하는 표시명)
BCRYPT_ROUNDS         # 12
NEXT_PUBLIC_BRAND_NAME # seolgiok
```

### 마이그레이션 (자동 적용)

`package.json`의 `start` 스크립트:
```json
"start": "prisma migrate deploy && next start"
```

Railway 배포(서버 재시작) 시 `prisma migrate deploy`가 **자동으로 실행**된다. 별도 수동 실행 불필요.

긴급 수동 실행이 필요한 경우:
```bash
railway run npx prisma migrate deploy
```

> 신규 마이그레이션 생성(`migrate dev`)은 반드시 로컬에서 수행 후 커밋해야 한다. 생성 전담: `db-expert` 에이전트.

### 배포 명령 (Railway CLI)

```bash
# Railway 프로젝트에 연결
railway link

# 배포 (main 브랜치 기준)
railway up
```

### Railway 빌드 설정

Railway가 자동 감지하는 경우 별도 설정 불필요. 수동 설정 시:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Node version**: 22.x (Railway 환경변수 `NIXPACKS_NODE_VERSION=22` 설정)

---

## 롤백

### 코드 롤백

```bash
# 이전 배포로 즉시 롤백 (Railway 콘솔)
# Railway 콘솔 → Deployments → 이전 배포 선택 → Rollback

# 또는 git revert 후 재배포
git revert <commit-hash>
git push origin main
```

### DB 마이그레이션 롤백

Prisma는 `migrate down` 명령을 지원하지 않는다. 롤백이 필요한 경우:

1. **신규 마이그레이션 생성**: 변경 사항을 되돌리는 새 마이그레이션을 작성한다.
2. `db-expert` 에이전트에 롤백 마이그레이션 설계를 위임한다.
3. 로컬에서 검증 후 `git push` → Railway에서 `prisma migrate deploy` 재실행.

> 운영 DB 직접 SQL 변경은 절대 금지 (`SELECT` read-only만 허용).

---

## 헬스체크

### 배포 후 확인 항목

**1. 애플리케이션 기동 확인**

```bash
# Railway 배포 로그에서 아래 메시지 확인
# "Ready on http://0.0.0.0:PORT"
# "▲ Next.js X.X.X"
```

**2. DB 연결 확인**

- Railway 콘솔 → 서비스 로그에서 Prisma 연결 오류(`P1001`, `P1002`) 없는지 확인.
- 로그인 페이지 접근 후 DB 에러 없이 로드되는지 확인.

**3. 핵심 페이지 접근 테스트**

| URL | 기대 동작 |
|---|---|
| `/` | 공개 홈 페이지 정상 렌더링 |
| `/ko/admin` | 로그인 미인증 시 로그인 페이지로 리다이렉트 |
| `/ko/admin/dashboard` | 로그인 후 관리자 대시보드 정상 렌더링 |

**4. NextAuth 세션 확인**

- 로그인 → 세션 쿠키 발급 확인 (브라우저 DevTools → Application → Cookies)
- `AUTH_TRUST_HOST=true` 미설정 시 CSRF 오류 발생 → Variables 탭 재확인

**5. OTP / 2FA 확인**

- 관리자 계정 OTP 등록 흐름 (`OTP_ISSUER` 값이 OTP 앱에 올바르게 표시되는지 확인)

**6. 암호화 기능 확인**

- `CRED_ENC_KEY_B64` 값이 잘못 설정된 경우 AES 복호화 오류 발생. 로그에서 `crypto` 관련 에러 없는지 확인.

**7. 국제화 확인**

- `/en/`, `/ja/`, `/zh/`, `/vi/`, `/ko/` 각 로케일 경로 정상 접근 확인.
