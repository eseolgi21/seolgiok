# seolgiok

한식당 경영관리 시스템 — 회계(매출/매입/정산), 추천인 네트워크, 게시판(공지·이벤트·고객지원), 5개 국어 지원.

## 아키텍처

```
브라우저
  └─ Next.js 16 App Router (SSR, [locale] 세그먼트)
        ├─ src/app/[locale]/(site)/   — 공개 페이지 (홈·메뉴·안내·공지)
        ├─ src/app/[locale]/admin/    — 관리자 대시보드 (매출·매입·정산·게시판·회원·매장·직원관리)
        ├─ src/app/[locale]/staff/    — 직원 셀프서비스 (출퇴근·인수인계·급여명세·공지·수상·건의)
        └─ src/app/api/               — API Routes
              ├─ (site)/auth/         — 로그인·회원가입·NextAuth callback
              ├─ user/                — 개인 설정(키워드·엑셀매핑)
              ├─ staff/               — 직원 셀프서비스 API
              └─ admin/               — 회계·게시판·회원·매장·직원 관리 API

NextAuth 5 (세션 기반) → Prisma 7 → PostgreSQL (Railway)
AES-256-GCM 암호화(CRED_ENC_KEY_B64) · Google OTP/2FA

멀티 매장(프랜차이즈) 지원 — `Store` 모델 기준으로 `UserInfo`·`AttendanceLog`·인수인계 5개
모델(`HandoverItem`/`HandoverShiftSlot`/`HandoverCheck`/`HandoverComment`/`HandoverApproval`)이
모두 `storeId`로 소속 매장을 구분한다. `src/lib/middleware/store-scope.ts`의
`resolveStoreScope()`가 세션 레벨에 따라 전체(`ALL`, level≥21 ADMIN) 또는 소속 매장 한정
(`OWN`, level≥15 MANAGER)으로 조회 범위를 결정한다. 옛 싱글톤 지오펜싱 화면
(`admin/staff/attendance/location/*`)은 삭제되었고 `admin/stores`(매장 CRUD, 다중 매장 지원)로
대체되었다.
```

## 코드 트리

```
seolgiok/
├─ src/
│   ├─ app/
│   │   ├─ [locale]/
│   │   │   ├─ (site)/          — 공개 페이지
│   │   │   ├─ admin/           — 관리자 페이지 (sales, purchase, profit, boards, users, items, stores, staff, dashboard)
│   │   │   │                     stores/ — 매장 CRUD (멀티 매장, admin-expert 소관)
│   │   │   └─ staff/           — 직원 셀프서비스 (attendance/, handover/, payslips/, notices/, awards/, suggestions/)
│   │   └─ api/
│   │       ├─ (site)/auth/     — 인증 API
│   │       ├─ user/            — 회원 개인 API
│   │       ├─ staff/           — 직원 API (attendance/, handover/, payslips/, notices/, awards/, suggestions/)
│   │       └─ admin/           — 관리자 API (accounting/, boards/, users/, stores/, staff/)
│   │             stores/route.ts              — 매장 CRUD (GET/POST/PATCH/DELETE)
│   │             staff/handover/checks/route.ts — 인수인계 체크 기록 (site-expert 소관 예외)
│   ├─ components/
│   │   ├─ ui/                  — 공통 UI (feedback/, overlay/)
│   │   └─ admin/               — 관리자 전용 컴포넌트
│   ├─ lib/
│   │   ├─ auth/                — NextAuth 5 config·세션 핸들러
│   │   ├─ middleware/           — store-scope.ts(resolveStoreScope), admin-auth.ts(requireAdmin)
│   │   ├─ timezone.ts          — IANA 타임존 기준 자정 계산 (멀티 매장 DST 대응, kst.ts와 분리)
│   │   ├─ prisma.ts            — Prisma 싱글톤
│   │   └─ crypto.ts            — AES-256-GCM 암복호화
│   ├─ i18n/messages/           — 5개 언어 번역 (en, ja, ko, vi, zh)
│   ├─ types/auth/              — 인증 관련 타입 (login, signup, logout, resolve-user)
│   └─ generated/prisma/        — Prisma 자동 생성 클라이언트
├─ prisma/
│   └─ schema/                  — 모듈형 스키마 10파일
│       ├─ Base.prisma          — generator·datasource 설정
│       ├─ User.prisma          — User, UserInfo(+storeId), SearchKeyword, ExcelMapping
│       ├─ Country.prisma       — Country
│       ├─ ReferralEdge.prisma  — ReferralEdge (REFERRER/SPONSOR 엣지)
│       ├─ Board.prisma         — Post, Comment, Attachment, SupportAssignment
│       ├─ Sales.prisma         — DailySales, CardTransaction, SaleItem
│       ├─ Purchase.prisma      — PurchaseItem
│       ├─ Item.prisma          — ItemClassification, ItemCategory, ExcelFilter
│       ├─ Profit.prisma        — Settlement
│       └─ Staff.prisma         — AttendanceLog(+storeId), Store(@@unique([name])), HandoverItem/ShiftSlot/Check/Comment/Approval(모두 storeId 필수), EmployeeVote, Payslip
└─ public/                      — 정적 파일
```

## 절대 규칙 (전역)

- **응답 언어**: 항상 한국어로 응답한다.
- **금액은 KRW 정수 전용** — 부동소수점 직접 연산 절대 금지. DB 저장·연산 모두 정수.
- **모든 UI는 5개 로케일 필수** — en, ja, ko, vi, zh. 하드코딩 문자열 금지, 반드시 `next-intl` 키 사용.
- **운영 DB 직접 SQL 변경 금지** — `SELECT` read-only만 허용.
- **Git 히스토리 작업은 `deploy-manager` 에이전트 전용** — `commit`·`push` 등.
- **Prisma 마이그레이션(스키마 변경 실행)은 `db-expert` 전용** — `prisma migrate dev`, `prisma db push` 등. `domain-expert`는 리뷰만 담당(코드 수정 X).
- **인증은 NextAuth 5 세션 패턴만** — 자체 JWT 발급 금지. `auth()` / `getSession()` 사용.
- **암호화 데이터 직접 수정 금지** — `src/lib/crypto.ts`의 AES 유틸리티 경유만 허용.
- **i18n 변경은 `i18n-expert` 경유** — 번역 키 추가·수정·로케일 라우팅 변경 시 반드시 i18n-expert 호출.
- **보안 관련 코드 변경 후 `security-expert` 리뷰 필수** — 신규 API Route·인증 로직·암호화 패턴 변경 시.

## 모델 사용 전략 (토큰 절감)

| Tier | 모델 | 트리거 | 예시 |
|---|---|---|---|
| T1 | haiku | 스크립트화 가능, 정답 고정 | 로그 grep, 타입체크, 파일 찾기, import 정리 |
| T2 | sonnet | 단일 영역 코드 읽기/수정 | 버그 수정, UI 변경, 스키마 필드 추가 |
| T3 | opus | 도메인 로직·보안·멀티시스템·설계 | 회계 연산 로직, 추천인 네트워크 쿼리, 보안 취약점 |

### 위임 원칙

1. **단순 작업 → `routine-tasks`(haiku) 우선**: grep/로그/타입체크는 직접 실행 말고 haiku에 위임
2. **독립 작업 병렬 호출**: 복수 Agent 동시 디스패치로 컨텍스트 절감
3. **코드 작성은 sonnet, 검증은 opus**: `domain-expert`는 diff 리뷰 전담 — 코드 수정 안 함

## 에이전트 팀 (`.claude/agents/`)

| 에이전트 | 모델 | 담당 |
|---|---|---|
| `pm` | sonnet | 제품 기획·기능 우선순위·PRD |
| `product-planner` | sonnet | FRD·화면 기획·플로우·엣지 케이스 정의 |
| `ui-ux-designer` | sonnet | 디자인 시스템·UX 플로우·레이아웃 스펙 |
| `growth-pm` | sonnet | 성장 전략·온보딩·리텐션·KPI |
| `domain-expert` | **opus** | 도메인 로직 리뷰 전담·Prisma 마이그레이션 리뷰 (코드 수정 X, 실행은 db-expert) |
| `db-expert` | **opus** | Prisma 스키마 변경·마이그레이션·seed 스크립트 전담 |
| `qa-lead` | sonnet | 테스트 시나리오·리그레션·배포 판단 |
| `deploy-manager` | sonnet | git add·commit·push·배포 상태 체크 |
| `routine-tasks` | **haiku** | 타입체크·로그 스캔·탐색·포맷 등 반복 작업 |
| `code-compliance-checker` | **haiku** | CLAUDE.md 규칙 위반·문서-코드 일치 검사 |
| `doc-keeper` | **haiku** | 코드 변경 후 문서 자동 동기화 |
| `doc-generator` | sonnet | docs/ 문서 초기 생성·업데이트 |
| `i18n-expert` | sonnet | 5개 로케일 번역 키 추가·누락 감지·하드코딩 탐지 |
| `security-expert` | **opus** | 보안 감사 전용 (코드 수정 X) — 인증·암호화·XSS·인젝션 리뷰 |
| `site-expert` | sonnet | 공개 사이트·인증·개인계정·직원 출퇴근 코드 작성 (`(site)/` + `api/(site)/` + `api/user/` + `staff/` + `api/staff/`). 예외로 `admin/staff/handover/*`(인수인계, 직원 도메인)도 담당 |
| `admin-expert` | sonnet | 관리자 전체 코드 작성 (`admin/` + `api/admin/` — 회계·게시판·회원·매장). `admin/staff/handover/*`는 site-expert 소관 예외 |

### 호출 가이드

- **1개 파일 고치기** → 해당 sonnet 전문가 직접 호출
- **여러 영역 교차** → 메인이 조율, 각 sonnet 에이전트 병렬 디스패치
- **"이 함수 어디 쓰나", "타입 에러 있나", "로그 스캔"** → `routine-tasks` (haiku)
- **도메인 핵심 로직 변경** → sonnet이 먼저 코드 작성 → `domain-expert` (opus)에 diff만 전달
- **Prisma 스키마 변경** → `db-expert` 전담 (절대 규칙)
- **UI 비주얼/레이아웃/테마** → `ui-ux-designer` (상태·로직은 담당 엔지니어로 분리)

## 공통 실행 명령

```bash
npm run dev       # 개발 모드 (Turbopack, :3000)
npm run build     # 프로덕션 빌드 (Prisma generate 포함)
npm run lint      # ESLint 검사
npm run generate  # Prisma 클라이언트 재생성
npm run seed      # DB 시드 (prisma/seed.ts)
```

## 크로스 프로젝트 변경

다른 프로젝트 직접 수정 금지. 루트(`brand-seolgiok`) orchestration으로 처리.

## 환경 변수

```
DATABASE_URL          — PostgreSQL 연결 문자열 (Railway 제공)
AUTH_SECRET           — NextAuth 5 세션 시크릿 (random base64)
AUTH_TRUST_HOST       — NextAuth 신뢰 호스트 설정 (true on Railway)
CRED_ENC_KEY_B64      — AES-256-GCM 32바이트 키 (base64 인코딩)
OTP_ISSUER            — Google Authenticator 표시 이름
BCRYPT_ROUNDS         — 비밀번호 해싱 라운드 수 (기본 12)
NEXT_PUBLIC_BRAND_NAME — 브랜드명 (공개, 클라이언트 노출)
```

---

## Harness Engineering

### E2E 테스트 파일 위치 (절대 규칙)

**E2E 관련 모든 파일·폴더는 반드시 `seolgiok/e2e/` 아래에 생성한다.**

```
seolgiok/e2e/
├── *.cjs          — Playwright 테스트 스크립트 (package.json "type":"module" 때문에 .cjs 필수)
├── screenshots/   — 테스트 중 캡처한 스크린샷
├── .auth/         — Playwright 인증 상태 저장 (storageState)
└── results/       — 테스트 결과 JSON
```

- 프로젝트 루트, `/tmp`, `scratchpad/` 등 다른 위치에 E2E 파일 생성 금지
- `seolgiok/e2e/` 는 `.gitignore`에 등록되어 있어 커밋되지 않음
- 테스트 완료 후 스크린샷·결과 파일은 세션이 끝날 때까지 보존 (즉시 삭제 금지)

### 현재 방식 (운영 중)

- **`npm run lint`** — ESLint 전체 검사
- **`docs/qa/test-cases.md` (TC-01~TC-48)** — 기능별 수동 시나리오 검증 기준
- **`docs/qa/checklist.md`** — 배포 전·코드 변경 후 체크리스트
- **코드 변경 후 전문 에이전트 diff 리뷰** — 회계 로직은 `domain-expert`, 보안은 `security-expert`
- **E2E: Playwright** — `seolgiok/e2e/*.cjs` 스크립트, `node e2e/<스크립트>.cjs` 로 실행

### 미래 로드맵 (미구현)

- `tests/harness/<기능명>/` — Mock(DB·외부 API), 입력, 기대값 구조
- `src/core/` (순수 로직) + `src/infra/` (실 의존성) 분리
- `package.json`에 `"test": "node --test"` 추가
