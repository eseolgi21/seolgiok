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
| `test-harness-engineer` | sonnet | `e2e/tests/**/*.spec.ts` Playwright 스펙·픽스처·`playwright.config.ts` 작성·유지 전담 (앱 코드 수정 X, 실패 트리아지 후 앱 버그는 도메인 전문가에 위임) |
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
- **`e2e/tests/*.spec.ts` 작성·수정, Playwright 실패 원인 파악** → `test-harness-engineer` (시나리오 정의는 `qa-lead`, 실패가 앱 버그로 판명되면 해당 도메인 전문가로 재위임)

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
├── tests/         — Playwright 구조화 스위트 (*.spec.ts, 26개)
│   ├── public/    — 공개 페이지 (about, home, menu) — 3개
│   ├── admin/     — 관리자 (boards, dashboard, guard, i18n, items,
│   │                multi-store-regression, profit, purchase, sales,
│   │                stores, users) — 11개
│   ├── auth/      — 로그인·회원가입 — 2개
│   ├── staff/     — 직원 셀프서비스 (attendance, awards, handover,
│   │                notices, payslips, suggestions) — 6개
│   └── prod/      — 레벨별 통합 시나리오 (admin/manager/staff/user-level) — 4개
├── *.cjs          — 애드혹 Playwright 스크립트 (구조화 스위트 이전 유물,
│                     package.json "type":"module" 때문에 .cjs 필수, 병존 중)
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
- **E2E: Playwright 구조화 스위트** — `playwright.config.ts` 기준 `e2e/tests/{public,admin,staff,auth,prod}/*.spec.ts` (총 26개 spec 파일).
  `npm run test:e2e`(headless, list reporter) / `npm run test:e2e:ui`(UI 모드) / `npm run test:e2e:report`(HTML 리포트 열기) 로 실행.
  `webServer` 설정으로 로컬(`localhost:3000`)이면 `npm run dev`를 자동 기동(`reuseExistingServer: true`), 원격 URL(`PLAYWRIGHT_BASE_URL`이 `https://`)이면 생략.
- **E2E 보조/애드혹 스크립트** — `seolgiok/e2e/*.cjs` 7개 (find-admin, handover-photo-upload, handover-r2-upload, handover-v3, level-system, payslip, staff-register), `node e2e/<스크립트>.cjs` 로 개별 실행. 구조화 스위트(26개 spec, 총 147개 test)와 커버리지 대조 감사 완료(2026-07-22, 아래 표) — 전량 `e2e/` 루트에 유지(완전커버 판정 없음).

### 레거시 `.cjs` ↔ 구조화 스위트 커버리지 대조 (2026-07-22 감사)

| `.cjs` 파일 | 대응 `.spec.ts` | 상태 | 판단 근거 |
|---|---|---|---|
| `find-admin.cjs` | 없음 | 미커버 | assertion 없이 admin 로그인 후 staff 페이지 텍스트에 "admin" 문자열이 노출되는지 로그만 남기는 1회성 진단 스크립트. 반복 리그레션 대상이 아니라 스펙화 부적합(정당화 (b)) — 현재 위치 존속. |
| `staff-register.cjs` | `admin/users.spec.ts`(부분), `prod/staff-level.spec.ts`(부분, API 레벨) | 미커버 | 어드민이 유저 목록에서 "직원 등록"/"직원 해제" 버튼을 클릭 → 버튼 상태 토글 → 헤더 "직원 포털" 버튼 노출/소실이라는 UI 상호작용 자체는 어떤 spec.ts에도 없음. level 10 부여가 접근권한에 미치는 API 효과는 `prod/staff-level.spec.ts`가 fixture(`provisionStaffUser`, PATCH 직접 호출)로 검증하지만, 버튼 클릭 경로(UI)는 미검증. → 이관계획(a): `e2e/tests/admin/users.spec.ts`에 등록/해제 버튼 토글 + 헤더 버튼 노출 케이스 추가 필요 — 실물 셀렉터 확인이 선행돼야 해 후속 과제로 등록(이번 작업 범위 밖, 즉시 미구현). |
| `level-system.cjs` | `admin/users.spec.ts`(부분), `admin/multi-store-regression.spec.ts`(부분), `prod/manager-level.spec.ts`(부분) | 부분커버 | 계정 프로비저닝 패턴(회원가입→레벨 PATCH)은 `e2e/fixtures/provision-user.ts`로 이미 TS 이식됨(파일 상단 주석에 "e2e/level-system.cjs의 계정 프로비저닝 패턴을 TS로 이식" 명시). 남은 갭: ① 어드민 등급 Select 드롭다운 UI(3옵션 노출 + 어드민 옵션 미노출 검증), ② `/api/admin/staff/handover/items` level10→401 / level15→200 게이트, ③ `/staff/handover/manage` 스텝 리다이렉트, ④ 매니저 인수인계 항목 CRUD(UI 추가). → 이관계획(a): 후속 과제로 `admin/users.spec.ts`(Select UI) + 신규/확장 spec(권한 게이트·리다이렉트·CRUD)에 분산 이관 필요, 즉시 미구현. |
| `payslip.cjs` | `staff/payslips.spec.ts` | 부분커버 | 핵심 보안 로직(어드민 업로드→직원 목록/파일 200→타인 파일 403 IDOR)은 `staff/payslips.spec.ts`로 완전 대체됨. 남은 갭: ① 존재하지 않는 payslip ID 접근 시 404, ② 미인증 상태 `/api/staff/payslips`·`/api/admin/staff/payslips` 401, ③ UI 요소(사이드바 메뉴·업로드 버튼·PDF iframe 미리보기) 노출 확인. → 이관계획(a): ①·②는 `guard.spec.ts` 패턴 재사용해 추가 용이 — 후속 과제(우선순위 중), ③은 코스메틱 UI 체크로 우선순위 낮음, 즉시 미구현. |
| `handover-v3.cjs` | `prod/manager-level.spec.ts`(부분), `admin/multi-store-regression.spec.ts`(부분) | 부분커버 | 승인 제출(STAFF)→매니저 컨펌, 매장 경계 위반 시 404는 이미 대체됨. 남은 갭(우선순위 높음 — 상태전이 회귀 위험): ① 체크 토글(POST/DELETE), ② 중복 컨펌→409 `ALREADY_CONFIRMED`, ③ STAFF 결제취소(PENDING→삭제), ④ CONFIRMED 상태에서 STAFF 취소 시도→409, ⑤ STAFF→admin PATCH 접근→401, ⑥ 비인증 upload→401. → 이관계획(a): `staff/handover.spec.ts` 확장 또는 신규 `staff/handover-approvals.spec.ts`로 TC-1/4/6/7/8/9 이관 필요 — 후속 과제로 등록, 즉시 미구현(범위·리스크 고려한 의도적 보류). |
| `handover-photo-upload.cjs` | 없음 | 미커버 | 과거 버그수정(#2 CSP img-src, #3 업로드 API JSON 안전성) 검증용 회귀 스크립트로, R2 환경변수 설정 여부에 따라 조건 분기하는 assertion이 많아 결정적(deterministic) 스펙화가 어려움. 정당화 (b) — 현재 위치 존속. |
| `handover-r2-upload.cjs` | 없음 | 미커버 | 실제 R2 자격증명(`R2_ENDPOINT` 등)과 운영 CDN(`cdn.seolgiok.com`)에 대한 라이브 네트워크 HEAD 요청이 필요한 인프라 통합 검증 스크립트. 로컬/CI에 시크릿이 없으면 실행 자체가 불가능해 반복 가능한 Playwright 회귀 스위트에 부적합. 정당화 (b) — 현재 위치 존속. |

**결론**: 7개 중 구조화 스위트로 완전 대체(완전커버) 판정된 스크립트는 없음 → `e2e/legacy/` 이동 없음, 전량 `e2e/` 루트 유지. 부분커버 3건(`level-system`, `payslip`, `handover-v3`)의 갭은 위 표에 이관계획을 남겼고, 미커버 3건(`find-admin`, `handover-photo-upload`, `handover-r2-upload`)은 스펙화 부적합 근거를 남겼다. 회귀 확인: 정리 작업(문서 갱신만, 파일 이동 없음) 직후 `npm run test:e2e` 실행 결과 **147 passed, 0 failed** (26개 spec 파일 기준, 실패 0건 — 회귀 없음).

### 미래 로드맵 (미구현)

- `tests/harness/<기능명>/` — Mock(DB·외부 API), 입력, 기대값 구조
- `src/core/` (순수 로직) + `src/infra/` (실 의존성) 분리
- `package.json`에 `"test": "node --test"` 추가
