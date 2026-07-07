<!-- Last updated: 2026-07-07 (Phase 4 멀티매장 확장 마무리 - TC-72 화면 UX 최종 PASS 재확인 + TC-74 Store.name 유니크 제약 신규 추가, qa-lead) -->

# seolgiok 테스트 케이스

> **QA 전략**: 자동화 테스트 파일 없음 (`__tests__/sample.test.js` 는 플레이스홀더). CI = `npm run lint` 단일. 아래 케이스는 **수동 테스트** 기준이며, 향후 Playwright E2E 또는 Jest 단위 테스트로 자동화 예정.

---

## 테스트 환경

| 항목 | 값 |
|---|---|
| 런타임 | Node.js ≥ 22 |
| 프레임워크 | Next.js 16 App Router (Turbopack dev) |
| DB | PostgreSQL (Railway) — Prisma 7 |
| 인증 | NextAuth 5 (Credentials + JWT HS256) |
| 로케일 | ko / en / ja / vi / zh |
| 테스트 베이스 URL | `http://localhost:3000` |

**필수 환경 변수 (테스트 전 확인)**

```
DATABASE_URL
AUTH_SECRET
AUTH_TRUST_HOST
CRED_ENC_KEY_B64
OTP_ISSUER
BCRYPT_ROUNDS
NEXT_PUBLIC_BRAND_NAME
```

---

## 1. 인증 테스트

### TC-01 로그인 성공 (올바른 자격증명)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 유효한 username + password로 로그인 |
| **전제조건** | DB에 `username: testuser`, `passwordHash: bcrypt(Test@1234, 12)` 레코드 존재 |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "testuser", "password": "Test@1234" }` |
| **기대 결과** | HTTP 200, `{ "ok": true, "user": { "username": "testuser" } }` |
| **실패 기준** | HTTP ≠ 200 또는 `ok: false` |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/login.spec.ts`: 올바른 자격증명 로그인 성공 → 홈/admin 이동 실제 브라우저로 재현 확인 |

### TC-02 로그인 실패 — 존재하지 않는 사용자

| 항목 | 내용 |
|---|---|
| **시나리오명** | DB에 없는 사용자 로그인 시도 |
| **전제조건** | `nobody` 계정 없음 |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "nobody", "password": "Test@1234" }` |
| **기대 결과** | HTTP 401, `{ "ok": false, "code": "INVALID_CREDENTIALS" }` |
| **실패 기준** | 200 반환, 또는 코드가 `USER_NOT_FOUND` (구 코드 — 계정 열거 공격 가능) |
| **비고** | DUMMY_HASH bcrypt compare 실행으로 타이밍 공격 방어 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/login.spec.ts`: 존재하지 않는 계정 로그인 실패 실제 브라우저로 재현 확인 |

### TC-03 로그인 실패 — 비밀번호 불일치

| 항목 | 내용 |
|---|---|
| **시나리오명** | 올바른 사용자명 + 잘못된 비밀번호 |
| **전제조건** | `testuser` 존재 |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "testuser", "password": "WrongPass!9" }` |
| **기대 결과** | HTTP 401, `{ "ok": false, "code": "INVALID_CREDENTIALS" }` |
| **실패 기준** | 200 반환, 또는 코드가 `INVALID_PASSWORD` (구 코드 — 비밀번호 불일치 정보 노출) |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/login.spec.ts`: 틀린 비밀번호 로그인 실패(페이지 유지) 실제 브라우저로 재현 확인 |

### TC-04 이메일로 로그인

| 항목 | 내용 |
|---|---|
| **시나리오명** | username 대신 email 주소로 로그인 |
| **전제조건** | `testuser` 계정의 email = `test@example.com` |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "test@example.com", "password": "Test@1234" }` |
| **기대 결과** | HTTP 200, `{ "ok": true }` |
| **실패 기준** | 인증 실패 또는 HTTP ≠ 200 |

### TC-05 로그아웃

| 항목 | 내용 |
|---|---|
| **시나리오명** | 로그인 세션 종료 |
| **전제조건** | 로그인 상태 |
| **입력값** | `POST /api/(site)/auth/logout` |
| **기대 결과** | HTTP 200, 세션 쿠키 삭제됨, 이후 `/admin` 접근 시 `/auth/login` 리다이렉트 |
| **실패 기준** | 로그아웃 후 세션 유지 |

### TC-06 비인증 사용자 admin 접근 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 로그인 없이 `/admin` 경로 접근 |
| **전제조건** | 쿠키 없음 (비인증 상태) |
| **입력값** | 브라우저에서 `GET http://localhost:3000/ko/admin` |
| **기대 결과** | `/auth/login` (또는 로케일 포함 `/ko/auth/login`)으로 리다이렉트 |
| **실패 기준** | admin 페이지 콘텐츠가 그대로 노출 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/login.spec.ts`(`/ko/admin`, `/en/admin`), `e2e/tests/admin/guard.spec.ts`(`/ko/admin`, `/ko/admin/sales/list`, `/ko/admin/users/list`, `/ko/admin/boards/announcements`) 미인증 리다이렉트 실제 브라우저로 재현 확인 |

---

## 2. 회원가입 테스트

### TC-07 회원가입 성공

| 항목 | 내용 |
|---|---|
| **시나리오명** | 유효한 정보로 신규 계정 생성 |
| **전제조건** | `newuser01` 계정 미존재 |
| **입력값** | `POST /api/(site)/auth/signup` `{ "username": "newuser01", "email": "new@example.com", "password": "Valid@1234", "name": "홍길동", "agreeTerms": true, "agreePrivacy": true }` |
| **기대 결과** | HTTP 200, `{ "ok": true, "user": { "username": "newuser01" } }`, DB에 User + UserInfo(referralCode) 생성 |
| **실패 기준** | HTTP ≠ 200 또는 referralCode 미생성 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/signup.spec.ts`: 신규 회원가입 성공 후 로그인 페이지 이동 + 어드민 유저목록 API/UI에 신규 가입자 노출까지 실제 브라우저로 재현 확인 |

### TC-08 회원가입 실패 — 비밀번호 규칙 위반

| 항목 | 내용 |
|---|---|
| **시나리오명** | 대문자 없는 비밀번호로 가입 시도 |
| **전제조건** | 없음 |
| **입력값** | `password: "weakpass1!"` (대문자 없음) |
| **기대 결과** | HTTP 400, `{ "ok": false, "code": "VALIDATION_ERROR" }` |
| **실패 기준** | 가입 성공 또는 400 이외 오류 |

### TC-09 회원가입 실패 — username 중복

| 항목 | 내용 |
|---|---|
| **시나리오명** | 이미 존재하는 username으로 가입 |
| **전제조건** | `testuser` 계정 존재 |
| **입력값** | `username: "testuser"` |
| **기대 결과** | HTTP 409, `{ "ok": false, "code": "USERNAME_TAKEN" }` |
| **실패 기준** | 200 반환 또는 DB 중복 레코드 생성 |

### TC-10 회원가입 실패 — email 중복

| 항목 | 내용 |
|---|---|
| **시나리오명** | 이미 등록된 이메일로 가입 |
| **전제조건** | `test@example.com` 등록됨 |
| **입력값** | `email: "test@example.com"` |
| **기대 결과** | HTTP 409, `{ "ok": false, "code": "EMAIL_TAKEN" }` |
| **실패 기준** | 가입 성공 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/auth/signup.spec.ts`: 동일 이메일 재가입 시도 → EMAIL_TAKEN 응답 실제 브라우저로 재현 확인 |

---

## 3. 매출 관리 테스트

### TC-11 매출 수동 입력 성공 (KRW 정수 검증)

| 항목 | 내용 |
|---|---|
| **시나리오명** | level ≥ 21 사용자가 매출 항목 직접 입력 |
| **전제조건** | level=21 이상 세션 보유 |
| **입력값** | `POST /api/admin/accounting/sales/create` `{ "items": [{ "date": "2026-06-17", "itemName": "점심", "amount": 150000, "category": "식사", "paymentMethod": "카드" }] }` |
| **기대 결과** | HTTP 200, `{ "success": true, "count": 1 }`, DB `amount = 150000` (정수) |
| **실패 기준** | 부동소수점 저장(`150000.0`) 또는 HTTP ≠ 200 |

### TC-12 매출 입력 실패 — amount 0

| 항목 | 내용 |
|---|---|
| **시나리오명** | 금액 0으로 매출 입력 시도 |
| **전제조건** | level=21 이상 세션 |
| **입력값** | `amount: 0` |
| **기대 결과** | HTTP 400 또는 항목 저장 거부 |
| **실패 기준** | 0원 레코드 DB 저장 |

### TC-13 매출 입력 실패 — 권한 미달 (level < 21)

| 항목 | 내용 |
|---|---|
| **시나리오명** | level=10 사용자가 매출 입력 시도 |
| **전제조건** | level=10 세션 |
| **입력값** | `POST /api/admin/accounting/sales/create` (정상 바디) |
| **기대 결과** | HTTP 401, `{ "error": "Unauthorized" }` |
| **실패 기준** | 데이터 저장 성공 |

### TC-14 매출 확정(confirm) 처리

| 항목 | 내용 |
|---|---|
| **시나리오명** | 미확정 매출 항목을 확정 처리 |
| **전제조건** | `confirmed: false` 인 saleItem 존재, level ≥ 21 |
| **입력값** | `POST /api/admin/accounting/sales/confirm` (해당 ID 전달) |
| **기대 결과** | DB `confirmed = true` 업데이트 |
| **실패 기준** | `confirmed` 필드 미변경 |

---

## 4. 엑셀 업로드 테스트

### TC-15 매출 엑셀 업로드 성공

| 항목 | 내용 |
|---|---|
| **시나리오명** | 표준 컬럼(날짜·품목·금액)이 있는 xlsx 업로드 |
| **전제조건** | level=21 이상, 표준 xlsx 파일 준비 |
| **입력값** | `POST /api/admin/accounting/sales/upload` multipart/form-data, `file=<xlsx>` |
| **기대 결과** | HTTP 200, `{ "success": true, "count": N }`, 기존 미확정 항목 삭제 후 새 항목 저장 |
| **실패 기준** | 기존 미확정 데이터 미삭제, 또는 count = 0 |

### TC-16 매출 엑셀 업로드 — 암호화된 xlsx

| 항목 | 내용 |
|---|---|
| **시나리오명** | 비밀번호 걸린 xlsx 업로드 |
| **전제조건** | level=21 이상, officecrypto 복호화 가능한 파일 |
| **입력값** | `file=<encrypted.xlsx>`, `password=correct_password` |
| **기대 결과** | 복호화 후 정상 파싱, HTTP 200 |
| **실패 기준** | 복호화 오류 또는 빈 결과 |

### TC-17 매출 엑셀 업로드 — 잘못된 비밀번호

| 항목 | 내용 |
|---|---|
| **시나리오명** | 암호화된 xlsx에 틀린 비밀번호 제공 |
| **입력값** | `file=<encrypted.xlsx>`, `password=wrong_password` |
| **기대 결과** | HTTP 400, `{ "error": "비밀번호가 올바르지 않거나 복호화에 실패했습니다." }` |
| **실패 기준** | 200 반환 또는 다른 에러 메시지 |

### TC-18 매출 엑셀 업로드 — 필수 컬럼 누락

| 항목 | 내용 |
|---|---|
| **시나리오명** | 날짜 컬럼 없는 xlsx 업로드 |
| **입력값** | 날짜 헤더 없는 xlsx 파일 |
| **기대 결과** | HTTP 400, `Missing required columns: Date …` |
| **실패 기준** | 파싱 성공 또는 빈 에러 |

### TC-19 엑셀 업로드 — 한국어 날짜 형식 파싱 (`2026년 06월 17일`)

| 항목 | 내용 |
|---|---|
| **시나리오명** | `YYYY년 MM월 DD일` 형식 날짜 컬럼이 있는 xlsx |
| **기대 결과** | 날짜가 정상 파싱되어 DB 저장, `parseDateSafe` 함수 분기 실행 |
| **실패 기준** | null 날짜로 인해 행 스킵 |

### TC-20 매입 엑셀 업로드 성공

| 항목 | 내용 |
|---|---|
| **시나리오명** | 매입 표준 xlsx 업로드 |
| **전제조건** | level=21 이상, 매입 컬럼 포함 xlsx |
| **입력값** | `POST /api/admin/accounting/purchase/upload` multipart/form-data |
| **기대 결과** | HTTP 200, `{ "success": true }` |
| **실패 기준** | 파싱 실패 또는 HTTP ≠ 200 |

---

## 5. 정산(Settlement) 계산 테스트

### TC-21 정산 데이터 조회 — 순수익 계산 정확성

| 항목 | 내용 |
|---|---|
| **시나리오명** | 확정된 매출·매입 데이터 기반 순수익 계산 |
| **전제조건** | level ≥ 10, 특정 기간 확정 매출 1,000,000원 / 매입 400,000원 / 신고 현금매출 100,000원 |
| **입력값** | `GET /api/admin/accounting/profit/settlement?startDate=2026-06-01&endDate=2026-06-30` |
| **기대 결과** | `calculated.netProfit` = 1,000,000 − 400,000 − actualVAT (정수), `calculated.vat.actualVAT` = Math.round(((카드매출+100000)×0.1) − ((400000−제외금액)×0.1)) |
| **실패 기준** | 부동소수점 결과, 계산식 편차 |

### TC-22 신고 현금매출 저장 (Settlement upsert)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 신고 현금매출 입력 후 저장 |
| **전제조건** | level ≥ 20 |
| **입력값** | `POST /api/admin/accounting/profit/settlement` `{ "startDate": "2026-06-01", "endDate": "2026-06-30", "reportedCashSales": 500000 }` |
| **기대 결과** | DB `settlement.reportedCashSales = 500000` (정수), 동일 기간 재요청 시 upsert(update) 동작 |
| **실패 기준** | 정수 아닌 저장, 중복 레코드 생성 |

### TC-23 정산 조회 — 권한 미달 (level < 10)

| 항목 | 내용 |
|---|---|
| **시나리오명** | level=5 사용자 정산 데이터 조회 |
| **전제조건** | level=5 세션 |
| **입력값** | `GET /api/admin/accounting/profit/settlement?startDate=…&endDate=…` |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 데이터 반환 |

### TC-24 기간별 수익 조회 (period)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 일별 매출·매입·수익 집계 |
| **전제조건** | level ≥ 10, 대상 기간 내 확정 데이터 존재 |
| **입력값** | `GET /api/admin/accounting/profit/period?startDate=2026-06-01&endDate=2026-06-07` |
| **기대 결과** | `dailyStats` 7개 항목, `summary.totalProfit = totalSales − totalPurchase` (정수) |
| **실패 기준** | 날짜 범위 외 데이터 포함 또는 부동소수점 수익값 |

---

## 6. 추천인 코드 / 사용자 관리 테스트

### TC-25 추천인 코드 자동 생성 (회원가입 시)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 신규 가입 시 UserInfo.referralCode 자동 생성 |
| **전제조건** | 없음 |
| **입력값** | TC-07 회원가입 완료 후 DB 조회 |
| **기대 결과** | `UserInfo.referralCode` = `[A-Z0-9]{4}[A-F0-9]{6}` 형식, 중복 없음 |
| **실패 기준** | referralCode null 또는 형식 불일치 |

### TC-26 사용자 resolve — 이메일/username/referralCode 검색

| 항목 | 내용 |
|---|---|
| **시나리오명** | 이메일로 사용자 조회 |
| **전제조건** | `test@example.com` 등록된 사용자 |
| **입력값** | `GET /api/(site)/auth/resolve-user?query=test@example.com` |
| **기대 결과** | HTTP 200, `{ "ok": true, "user": { "email": "test@example.com" } }` |
| **실패 기준** | 404 반환 또는 다른 사용자 반환 |

### TC-27 사용자 level 변경 (관리자)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 산하 사용자의 level 수정 |
| **전제조건** | 요청자가 대상 userId의 상위 노드(산하 관계), UserInfo 존재 |
| **입력값** | `PATCH /api/admin/users/list` `{ "userId": "<target_id>", "level": 10 }` |
| **기대 결과** | HTTP 200, `{ "ok": true, "data": { "level": 10 } }` |
| **실패 기준** | 산하 관계 아닌 userId 수정 허용 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/fixtures/provision-user.ts`가 `PATCH /api/admin/users/list`(level/storeId 변경)를 다수 스펙(staff/*, admin/multi-store-regression 등)의 fixture 준비 단계에서 실제 호출·성공 확인, 항상 200 응답 |

### TC-28 사용자 level 변경 — 비산하 사용자 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 산하 관계 없는 사용자 level 수정 시도 |
| **전제조건** | 대상 userId가 요청자 산하 아님 |
| **입력값** | `PATCH /api/admin/users/list` `{ "userId": "<unrelated_id>", "level": 99 }` |
| **기대 결과** | HTTP 403, `{ "ok": false, "error": "FORBIDDEN" }` |
| **실패 기준** | 수정 성공 |

---

## 7. 게시판 테스트 (sanitize-html 검증)

### TC-29 공지사항 작성 성공

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 공지사항 작성 |
| **전제조건** | 유효 세션 (getUserId 반환 non-null) |
| **입력값** | `POST /api/admin/boards/announcements` `{ "title": "공지제목", "bodyRaw": "...", "bodyHtml": "<p>내용</p>", "visibility": "PUBLIC", "isPublished": true }` |
| **기대 결과** | HTTP 200, `{ "ok": true, "data": { "id": "..." } }` |
| **실패 기준** | HTTP ≠ 200 또는 DB 미저장 |

### TC-30 XSS 필터링 — sanitize-html

| 항목 | 내용 |
|---|---|
| **시나리오명** | 악의적 스크립트 태그 포함 HTML 저장 시도 |
| **전제조건** | 관리자 세션 |
| **입력값** | `bodyHtml: "<p>정상</p><script>alert('xss')</script>"` |
| **기대 결과** | DB 저장값 = `<p>정상</p>` (`<script>` 제거), HTTP 200 |
| **실패 기준** | `<script>` 태그 DB 저장 또는 HTTP 오류 |

### TC-31 공지사항 수정 (PATCH)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 기존 공지사항 제목·내용 수정 |
| **전제조건** | 대상 id의 NOTICE 게시글 존재 |
| **입력값** | `PATCH /api/admin/boards/announcements` `{ "id": "...", "title": "수정제목", "bodyHtml": "<p>수정</p>", "visibility": "PUBLIC", "isPublished": true }` |
| **기대 결과** | HTTP 200, DB 반영 |
| **실패 기준** | 404 또는 미반영 |

### TC-32 공지사항 일괄 삭제 (DELETE)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 복수 id 공지사항 삭제 |
| **전제조건** | 대상 id 목록 존재 |
| **입력값** | `DELETE /api/admin/boards/announcements` `{ "ids": ["id1", "id2"] }` |
| **기대 결과** | HTTP 200, `{ "ok": true, "data": { "deletedCount": 2 } }` |
| **실패 기준** | 다른 boardType 게시글 삭제 또는 count 불일치 |

### TC-33 비인증 공지사항 작성 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 로그인 없이 공지 작성 |
| **전제조건** | 세션 없음 |
| **입력값** | `POST /api/admin/boards/announcements` (정상 바디) |
| **기대 결과** | HTTP 401, `{ "ok": false, "error": "UNAUTHORIZED" }` |
| **실패 기준** | 게시글 생성 성공 |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/boards.spec.ts`: 미인증 공지 PATCH/DELETE, 미인증 이벤트 PATCH/DELETE 401 응답 실제 브라우저로 재현 확인(동일 미인증 차단 패턴) |

---

## 8. 권한 레벨별 API 접근 제어

### TC-34 level 경계 — level=9 사용자 정산 접근 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 10 미달 사용자 정산 API 접근 |
| **전제조건** | level=9 세션 |
| **입력값** | `GET /api/admin/accounting/profit/settlement?startDate=…&endDate=…` |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 데이터 반환 |

### TC-35 level 경계 — level=20 사용자 정산 저장 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 21 미달 사용자 매출 생성/업로드 API 접근 |
| **전제조건** | level=20 세션 |
| **입력값** | `POST /api/admin/accounting/sales/create` 또는 `upload` |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 데이터 저장 허용 |

### TC-36 사용자 목록 조회 — 비인증 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 세션 없이 사용자 목록 조회 |
| **전제조건** | 세션 없음 |
| **입력값** | `GET /api/admin/users/list` |
| **기대 결과** | HTTP 401, `{ "ok": false, "error": "UNAUTHORIZED" }` |
| **실패 기준** | 목록 반환 |

---

## 9. i18n 로케일 테스트

### TC-37 5개 로케일 페이지 접근 가능 여부

| 항목 | 내용 |
|---|---|
| **시나리오명** | 각 로케일로 공개 홈페이지 접근 |
| **입력값** | `GET /ko/`, `GET /en/`, `GET /ja/`, `GET /vi/`, `GET /zh/` |
| **기대 결과** | 각각 HTTP 200, 해당 언어 UI 렌더링 |
| **실패 기준** | 404 또는 언어 불일치 |

### TC-38 하드코딩 문자열 없음 확인

| 항목 | 내용 |
|---|---|
| **시나리오명** | UI에 하드코딩 한국어 문자열 없음 |
| **방법** | `grep -r '\"[가-힣]' src/app/` 실행 후 번역 키 없는 한국어 직접 출력 확인 |
| **기대 결과** | next-intl 번역 키 사용, 하드코딩 문자열 없음 |
| **실패 기준** | 번역 키 없는 하드코딩 문자열 발견 |

---

---

## 10. 권한 레벨 경계값 상세 TC

### TC-39 level=9 — profit 조회 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 10 미달 사용자 profit/detail 조회 |
| **전제조건** | level=9 세션 |
| **입력값** | `GET /api/admin/accounting/profit/detail?date=2026-06-01` |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 데이터 반환 |

### TC-40 level=10 — profit 조회 허용

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 10 사용자 정산 조회 허용 |
| **전제조건** | level=10 세션 |
| **입력값** | `GET /api/admin/accounting/profit/settlement?startDate=2026-06-01&endDate=2026-06-30` |
| **기대 결과** | HTTP 200, 데이터 반환 |
| **실패 기준** | 401 또는 403 |

### TC-41 level=10 — settlement POST 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 10 사용자 신고 현금매출 저장 시도 |
| **전제조건** | level=10 세션 |
| **입력값** | `POST /api/admin/accounting/profit/settlement` `{ "startDate": "2026-06-01", "endDate": "2026-06-30", "reportedCashSales": 100000 }` |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 저장 성공 |

### TC-42 level=20 — settlement POST 허용

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 20 사용자 신고 현금매출 저장 허용 |
| **전제조건** | level=20 세션 |
| **입력값** | `POST /api/admin/accounting/profit/settlement` (정상 바디) |
| **기대 결과** | HTTP 200, DB 저장 확인 |
| **실패 기준** | 401 |

### TC-43 level=20 — 매출 업로드 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 21 미달 사용자 매출 업로드 시도 |
| **전제조건** | level=20 세션 |
| **입력값** | `POST /api/admin/accounting/sales/upload` (xlsx 첨부) |
| **기대 결과** | HTTP 401 |
| **실패 기준** | 업로드 성공 |

### TC-44 level=21 — 매출 업로드 허용

| 항목 | 내용 |
|---|---|
| **시나리오명** | level 21 사용자 매출 업로드 허용 |
| **전제조건** | level=21 세션, 유효한 xlsx 파일 |
| **입력값** | `POST /api/admin/accounting/sales/upload` |
| **기대 결과** | HTTP 200 |
| **실패 기준** | 401 |

---

## 11. VAT 계산 수치 검증 TC

### TC-45 정산 VAT 수치 정확성

| 항목 | 내용 |
|---|---|
| **시나리오명** | 정산 API 부가세·순수익 계산 수치 검증 |
| **전제조건** | level ≥ 10, 해당 기간 DB 데이터: 카드매출 1,000,000, 현금매출(DB) 200,000 (∴ 신고현금 200,000 입력 시 실제 카드 800,000), 총매입 500,000 (인건비 100,000 포함) |
| **계산 기대값** | `salesVAT = Math.round((800000+200000)×0.1) = 100,000` `purchaseVAT = Math.round((500000-100000)×0.1) = 40,000` `actualVAT = 60,000` `netProfit = 총매출 - 총매입 - actualVAT` |
| **검증 포인트** | 모든 값이 정수(부동소수점 없음) |
| **실패 기준** | `100000.0` 같은 부동소수점 반환 또는 계산 편차 |

---

## 12. 엑셀 특수 케이스 TC

### TC-46 한국어 날짜 형식 파싱

| 항목 | 내용 |
|---|---|
| **시나리오명** | `2026년 06월 17일` 형식 날짜 열이 있는 xlsx 업로드 |
| **전제조건** | level=21, xlsx 파일의 날짜 컬럼 값이 `2026년 06월 17일` |
| **기대 결과** | `parseDateSafe` 분기 실행 → 정상 파싱, 행 스킵 없음 |
| **실패 기준** | null 날짜로 행 스킵 |

### TC-47 전각/반각 문자 정규화

| 항목 | 내용 |
|---|---|
| **시나리오명** | 전각 문자 품목명 검색 키워드 매칭 |
| **전제조건** | 검색 키워드 `ａＢＣ` (전각) |
| **기대 결과** | `toHalfWidth("ａＢＣ")` → `"aBC"` 정규화 후 `"abc"` 품목과 매칭 |
| **실패 기준** | 전각/반각 불일치로 매칭 실패 |

### TC-48 ReferralEdge 순환 참조 방지

| 항목 | 내용 |
|---|---|
| **시나리오명** | A→B 추천인 관계 등록 후 B→A 등록 시도 |
| **전제조건** | `ReferralEdge(parentId=A, childId=B, type=REFERRER)` 존재 |
| **입력값** | `ReferralEdge(parentId=B, childId=A, type=REFERRER)` 생성 시도 |
| **기대 결과** | `@@unique([childId, type])` 제약 위반 → DB 에러 또는 애플리케이션 에러 반환 |
| **실패 기준** | 순환 관계 레코드 생성 성공 |

---

## 13. 매장 지오펜싱 출퇴근 TC

> ⚠️ **Phase 1 멀티매장 확장으로 아래 TC-49~55는 구(舊) 단일 매장 `StoreLocation` 싱글톤 기준
> 설계 시점 문서다.** `StoreLocation` → `Store`(다중 매장) 재설계 이후에도 반경 계산·완전 차단
> 기조 자체는 동일 로직으로 `Store` 모델 기준으로 이관되어 보존되었음을 14장에서 재검증한다.
> 아래 원본 내용은 변경하지 않고 유지하되(과거 검증 이력 보존), 현재 코드 기준 최신 검증은
> 14장 TC-56~61을 따른다.
>
> 관련 파일(구): `src/lib/geo.ts`, `src/lib/kst.ts`, `src/lib/constants/store-location.ts`,
> `src/app/api/staff/attendance/route.ts`, `src/app/[locale]/staff/attendance/page.tsx`,
> `src/app/api/admin/staff/attendance/location/route.ts`,
> `src/app/[locale]/admin/staff/attendance/location/{page.tsx,StoreLocationView.tsx}`.
> `StoreLocation`은 `id="singleton"` 고정 싱글톤이며 `radiusMeters` 초과 시 `AttendanceLog`가
> 생성되지 않는다(CLOCK_IN·CLOCK_OUT 공통 적용).

### TC-49 반경 내 좌표로 CLOCK_IN 성공

| 항목 | 내용 |
|---|---|
| **시나리오명** | 매장 반경 내 좌표로 출근 버튼 클릭 |
| **전제조건** | level≥10 세션, `StoreLocation` 실좌표+반경(예: 100m) 설정됨 |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_IN", "latitude": <매장좌표>, "longitude": <매장좌표> }` |
| **기대 결과** | HTTP 201, `distanceMeters <= radiusMeters`, `AttendanceLog`에 `latitude/longitude/distanceMeters` 저장, GET 히스토리에 표시 |
| **실패 기준** | 201 이외 응답, 로그 미생성, 위치 컬럼 null |
| **검증 결과** | **PASS** (코드 추적) — `route.ts` POST: 인증(level≥10, 미변경) → zod 파싱 → 좌표 범위 검증 → `StoreLocation` 조회 → `haversineDistanceMeters` 계산 → `distanceMeters <= radiusMeters`면 기존 "동일 타입 연속 방지" 체크(`startOfKstDay()` 기준) 통과 후 `attendanceLog.create({ userId, type, latitude, longitude, distanceMeters })` → 201 응답. GET은 동일 로그를 `logs` 배열로 반환하고 `staff/attendance/page.tsx`의 `<List>`에 렌더링됨. |

### TC-50 반경 밖 좌표로 CLOCK_IN 시도 — 완전 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 매장에서 약 500m 떨어진 좌표로 출근 시도 |
| **전제조건** | level≥10 세션, `StoreLocation` 설정됨(반경 100m) |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_IN", "latitude": <500m 이탈 좌표>, "longitude": ... }` |
| **기대 결과** | HTTP 400 `{ ok:false, code:"OUT_OF_RANGE", distanceMeters, radiusMeters }`, `AttendanceLog` 생성되지 않음, 클라이언트에 "매장에서 {distance}m 떨어져 있습니다"류 메시지 표시 |
| **실패 기준** | 201 반환, 로그 생성, 또는 거리/반경 정보 없이 에러만 반환 |
| **검증 결과** | **PASS** (코드 추적) — `distanceMeters > storeLocation.radiusMeters`면 `attendanceLog.create` 호출 이전에 즉시 400 `OUT_OF_RANGE` 응답(로그 미생성 확정: return이 create보다 앞서 실행됨). 응답 바디에 `distanceMeters`/`radiusMeters` 포함. 클라이언트 `page.tsx`는 `data.code === "OUT_OF_RANGE"`일 때 `t("attendance.outOfRange", { distance: Math.round(data.distanceMeters), radius: data.radiusMeters })`로 메시지 표시. |

### TC-51 반경 내 CLOCK_IN 후 반경 밖에서 CLOCK_OUT 시도 — 퇴근도 검증됨

| 항목 | 내용 |
|---|---|
| **시나리오명** | 반경 내에서 CLOCK_IN 성공 후, 반경 밖으로 이동해 CLOCK_OUT 시도 |
| **전제조건** | 당일 마지막 로그가 `CLOCK_IN`(TC-49로 생성) |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_OUT", "latitude": <반경 밖 좌표>, ... }` |
| **기대 결과** | HTTP 400 `OUT_OF_RANGE`, 당일 마지막 로그가 여전히 `CLOCK_IN` (CLOCK_OUT 로그 미생성) |
| **실패 기준** | CLOCK_OUT이 반경 검증 없이 통과되거나, 새 로그가 생성됨 |
| **검증 결과** | **PASS** (코드 추적) — 거리 검증 블록(`distanceMeters > radiusMeters`)이 `type`(CLOCK_IN/CLOCK_OUT) 분기보다 앞에 위치하며 `type` 값과 무관하게 동일 로직 적용. "동일 타입 연속 방지"(`last?.type === type`) 체크와 `attendanceLog.create` 호출 자체가 거리 검증 실패 시 도달 불가능한 코드이므로, 반경 밖 CLOCK_OUT 시도는 로그 생성 이전에 차단됨 → 마지막 로그는 TC-49의 `CLOCK_IN` 그대로 유지. |

### TC-52 위치 권한 거부 시 API 호출 자체 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | 브라우저 위치 권한을 "차단" 상태로 두고 출퇴근 버튼 클릭 |
| **전제조건** | `navigator.geolocation.getCurrentPosition`이 `PERMISSION_DENIED`(code=1)로 실패하도록 설정 |
| **입력값** | 클릭 이벤트 (좌표 없음) |
| **기대 결과** | `/api/staff/attendance`로의 POST 요청 자체가 발생하지 않음, 에러 메시지("위치 권한이 거부되었습니다"류) 표시, 버튼 재활성화(로딩 해제) |
| **실패 기준** | 권한 거부 상태에서도 POST 요청 발생, 또는 버튼이 계속 비활성 상태로 멈춤 |
| **검증 결과** | **PASS** (코드 추적) — `page.tsx`의 `handleClock`: `getCurrentPosition()` Promise가 reject되면 `catch` 블록에서 `setLocating(false)` 후 `code`별 에러 메시지 설정하고 **즉시 `return`** — `setSubmitting(true)`/`fetch(...)` 라인에 도달하지 않으므로 네트워크 요청 자체가 발생하지 않음. `finally` 블록이 없는 이 경로에서도 `setLocating(false)`가 catch 내부에서 명시적으로 호출되어 `isBusy`가 `false`로 복귀 → 버튼(`Fab`) 재활성화됨. |

### TC-53 매장 위치 미설정/반경 0 상태에서 CLOCK_IN 시도

| 항목 | 내용 |
|---|---|
| **시나리오명** | `StoreLocation` row 없음(완전 미설정) 또는 seed placeholder(반경 0)인 상태에서 출근 시도 |
| **전제조건** | (a) `StoreLocation` 테이블에 singleton row 없음, 또는 (b) seed 상태 그대로(`latitude:0, longitude:0, radiusMeters:0`) |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_IN", "latitude": <임의 실좌표>, ... }` |
| **기대 결과** | (a)면 HTTP 400 `STORE_LOCATION_NOT_CONFIGURED`, (b)면 HTTP 400 `OUT_OF_RANGE`(반경 0이므로 항상 이탈) — 어느 쪽이든 로그 미생성 |
| **실패 기준** | 201 반환 또는 로그 생성 |
| **검증 결과** | **PASS** (코드 추적 + 실 DB 확인) — `storeLocation`이 `null`이면 `STORE_LOCATION_NOT_CONFIGURED` 즉시 반환. 로컬 DB를 `psql`로 직접 조회(read-only SELECT)한 결과 `prisma/seed.ts`가 생성한 실제 singleton row는 `latitude=0, longitude=0, radiusMeters=0`으로 **row는 존재**하는 상태이므로, 실제 배포 초기 상태는 (b) 분기 — 임의의 실좌표는 (0,0)으로부터 지구 반대편급 거리이므로 `distanceMeters > 0`이 항상 성립해 `OUT_OF_RANGE`로 차단됨. seed.ts 주석에도 "실좌표 설정 전까지 전 직원 출퇴근이 반경 0으로 인해 전면 차단됨"이라 명시. `STORE_LOCATION_NOT_CONFIGURED` 분기는 row 자체를 삭제해야 도달하는 코드 경로로, 로직상 존재하나 seed 이후에는 정상적으로 도달하지 않음 — 문서화 목적상 참고. |

### TC-54 관리자 매장 위치 저장 → 재배포 없이 즉시 반영

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 `/admin/staff/attendance/location`에서 좌표/반경 저장 |
| **전제조건** | level≥21 관리자 세션 |
| **입력값** | `PUT /api/admin/staff/attendance/location` `{ "name": "본점", "latitude": <실좌표>, "longitude": <실좌표>, "radiusMeters": 100 }` |
| **기대 결과** | 저장 직후(서버 재시작 없이) staff `POST /api/staff/attendance`의 반경 판정이 새 값 기준으로 즉시 동작 |
| **실패 기준** | 저장 후에도 이전 값으로 판정되거나 서버 재시작 필요 |
| **검증 결과** | **PASS** (코드 추적) — `api/staff/attendance/route.ts` POST는 요청마다 `prisma.storeLocation.findUnique({ where: { id: "singleton" } })`로 **매 요청 DB 조회**를 수행하며, 프로세스 메모리 캐시·환경변수·모듈 스코프 상수 등 어떤 형태의 캐싱도 존재하지 않음. 관리자 PUT은 동일 singleton row를 `upsert`로 갱신하므로 커밋 즉시 다음 staff POST 요청부터 새 값이 반영됨. |

### TC-55 관리자 PUT — 범위 밖 좌표/잘못된 반경 거부

| 항목 | 내용 |
|---|---|
| **시나리오명** | 위도 200(범위 밖) 또는 반경 0/2500(허용 범위 밖)으로 저장 시도 |
| **전제조건** | level≥21 관리자 세션 |
| **입력값** | `PUT /api/admin/staff/attendance/location` `{ "name":"본점", "latitude": 200, "longitude": 127, "radiusMeters": 100 }` 및 별도로 `radiusMeters: 0`, `radiusMeters: 2500` 케이스 |
| **기대 결과** | 좌표 범위 밖이면 HTTP 400 `INVALID_COORDINATES`, 반경이 10~2000 정수 범위 밖이면 HTTP 400 `INVALID_RADIUS`, 두 경우 모두 DB `StoreLocation` 값 미변경 |
| **실패 기준** | 200 반환 또는 DB 값이 잘못된 입력으로 갱신됨 |
| **검증 결과** | **PASS** (코드 추적) — `location/route.ts` PUT: zod로 타입만 검증한 뒤 `isValidLatitude`/`isValidLongitude`(-90~90, -180~180 범위, `src/lib/geo.ts`와 동일 로직을 로컬 함수로 재구현해 사용) 체크 → 실패 시 `INVALID_COORDINATES` 400, 뒤이어 `isValidRadius`(정수 & 10~2000) 체크 → 실패 시 `INVALID_RADIUS` 400. 두 검증 모두 `prisma.storeLocation.upsert(...)` 호출 **이전**에 위치하여 실패 시 DB에 어떤 쓰기도 발생하지 않음. |

**공통 검증 방법 및 한계**: `npm run dev`로 로컬 서버(포트 3000)를 기동해 인증 없는 상태로 `POST /api/staff/attendance`, `GET/PUT /api/admin/staff/attendance/location`을 curl로 호출 → 전부 401 `UNAUTHORIZED`로 즉시 차단되는 것을 실측 확인(좌표 유효성 이전에 인증 게이트가 먼저 동작함을 재확인). 로컬 DB에 시드된 계정들의 실제 비밀번호를 알 수 없어(문서상 테스트 계정 `testuser`/`admin@seolgiok.com` 자격증명 시도 모두 `INVALID_CREDENTIALS`) 세션 쿠키 확보 후의 성공 플로우(TC-49, 51, 54)까지 curl로 end-to-end 실측하지는 못했다. 대신 `psql`로 로컬 DB를 read-only 조회해 마이그레이션 적용 상태(`StoreLocation`, `AttendanceLog.latitude/longitude/distanceMeters` 컬럼 실존, seed placeholder row `radiusMeters=0` 확인)를 검증했고, 나머지는 `route.ts`/`geo.ts`/`kst.ts`/`page.tsx`/`StoreLocationView.tsx` 소스 전체를 직접 읽어 분기 순서·조건·early-return 위치를 라인 단위로 추적했다. Chrome DevTools Sensors 기반 브라우저 시뮬레이션은 이 환경(헤드리스 CLI, 세션 확보 불가)에서 시도하지 않았다.

---

## 14. 멀티매장 확장 Phase 1 TC (`Store` 모델 재설계)

> 관련 파일: `prisma/schema/Staff.prisma`(`Store`, `AttendanceLog.storeId`), `prisma/schema/User.prisma`(`UserInfo.storeId`),
> `src/lib/timezone.ts`(신규), `src/app/api/staff/attendance/route.ts`, `src/app/[locale]/staff/attendance/page.tsx`,
> `src/app/api/admin/stores/route.ts`(신규 CRUD), `src/app/api/admin/users/list/route.ts`(storeId PATCH),
> `src/app/[locale]/admin/users/list/*`, `src/components/admin/AdminSidebar.tsx`.
>
> **배경**: 기존 `StoreLocation` 싱글톤(`id="singleton"` 고정 1행)을 다중 매장을 지원하는 `Store` 모델로
> 재설계. `UserInfo.storeId`/`AttendanceLog.storeId`(둘 다 nullable) 추가, 마이그레이션 적용 + 기존
> STAFF(level≥10) 전 직원 20명을 "본점" 매장으로 백필 완료. 출퇴근 API는 매장 미배정(`storeId=null`)
> 직원을 예외 없이 완전 차단(`STORE_NOT_ASSIGNED`)한다.

### TC-56 매장 배정 직원의 정상 출근/퇴근 (반경 내)

| 항목 | 내용 |
|---|---|
| **시나리오명** | `storeId`가 배정된 직원이 소속 매장 반경 내 좌표로 CLOCK_IN 후 CLOCK_OUT |
| **전제조건** | level≥10 세션, `UserInfo.storeId` = 소속 `Store.id`(non-null), 좌표가 해당 `Store.latitude/longitude` 기준 `radiusMeters` 이내 |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_IN", "latitude": <매장좌표>, "longitude": <매장좌표> }` 이어서 동일 좌표로 `{ "type": "CLOCK_OUT", ... }` |
| **기대 결과** | 둘 다 HTTP 201, `AttendanceLog.storeId`가 해당 `Store.id`로 저장됨(TC-49 반경 판정 로직과 동일하되 판정 기준이 `Store` 테이블로 이관) |
| **실패 기준** | 401/400 오반환, `AttendanceLog.storeId`가 null로 저장됨 |
| **검증 결과** | **PASS** (코드 추적) — `route.ts` POST: `prisma.userInfo.findUnique`로 `storeId`+`store{latitude,longitude,radiusMeters,timezone}`를 조회 → `haversineDistanceMeters` 계산 → `distanceMeters <= store.radiusMeters`면 트랜잭션 내 `attendanceLog.create({..., storeId})`로 `storeId`를 명시적으로 저장. 반경 판정 로직 자체는 TC-49와 동일(`geo.ts` 재사용), 판정 기준 테이블만 `StoreLocation` 싱글톤 → 배정된 `Store` 행으로 이관됨. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/staff/attendance.spec.ts`: 매장 배정 직원의 반경 내 CLOCK_IN 성공 → 동일 반경 CLOCK_OUT 성공까지 실제 브라우저로 재현 확인(코드 추적 PASS를 실행 결과로 보강) |

### TC-57 매장 미배정 직원의 출근 시도 → `STORE_NOT_ASSIGNED` 완전 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | `storeId=null`인 직원이 출근 시도 |
| **전제조건** | level≥10 세션, `UserInfo.storeId = null` |
| **입력값** | `POST /api/staff/attendance` `{ "type": "CLOCK_IN", "latitude": <임의 실좌표>, "longitude": ... }` |
| **기대 결과** | HTTP 400 `{ ok:false, code:"STORE_NOT_ASSIGNED" }`, `AttendanceLog` 생성되지 않음, 클라이언트 `staffPortal.attendance.storeNotAssigned` 메시지 표시 |
| **실패 기준** | 201 반환, 로그 생성, 또는 반경 계산 시도(좌표 유효성 검증 이후 `storeId` 체크보다 먼저 반경 계산에 진입) |
| **검증 결과** | **PASS** (코드 추적) — `route.ts` POST: 좌표 zod 파싱·범위 검증 직후, `haversineDistanceMeters` 호출 **이전**에 `if (!userInfo?.storeId) return 400 STORE_NOT_ASSIGNED`가 위치. 예외 분기 없이 모든 미배정 직원에 무조건 적용됨(주석: "매장 미배정 직원은 출퇴근 자체를 완전 차단한다 — 예외 없음"). 클라이언트 `page.tsx`의 `switch(data.code)`에 `case "STORE_NOT_ASSIGNED": setErrorMessage(t("attendance.storeNotAssigned"))` 분기 존재, 5개 로케일(`staffPortal.json`)에 키 확인됨. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/staff/attendance.spec.ts`(매장 미배정 직원 CLOCK_IN → 400 STORE_NOT_ASSIGNED), `e2e/tests/admin/multi-store-regression.spec.ts`(5번 시나리오, 동일 코드 실제 브라우저로 재현 확인) |

### TC-58 타임존 다른 매장의 "오늘" 경계 계산 — `startOfDayInTimeZone` 자정 경계 단위 시나리오

| 항목 | 내용 |
|---|---|
| **시나리오명** | UTC+7(`Asia/Ho_Chi_Minh`) 매장 소속 직원의 "오늘" 판정이 서버 UTC나 KST(UTC+9)가 아닌 매장 로컬 자정 기준으로 계산됨 |
| **전제조건** | `Store.timezone = "Asia/Ho_Chi_Minh"`, 직원의 마지막 로그가 이 매장 로컬 기준 어제 23:50(KST 기준으로는 이미 오늘 새벽 01:50)에 생성됨 |
| **입력값(단위 시나리오)** | `startOfDayInTimeZone("Asia/Ho_Chi_Minh", <KST 기준 오늘 00:30 = UTC 전날 15:30>)` 호출 |
| **기대 결과** | 반환된 UTC instant가 `Asia/Ho_Chi_Minh` 기준 "오늘 00:00:00"에 해당하는 UTC 순간(=UTC 전날 17:00) — KST 자정(UTC 전날 15:00) 또는 서버 UTC 자정(당일 00:00 UTC)과는 다른 값이어야 함 |
| **실패 기준** | 반환값이 KST 또는 UTC 자정과 동일(=매장 로컬 타임존이 무시되고 있음), DST 경계에서 회귀 없이 반복 수렴 실패 |
| **검증 결과** | **PASS** (코드 추적) — `timezone.ts`의 `startOfDayInTimeZone`은 `Intl.DateTimeFormat({timeZone})`으로 대상 타임존의 civil wall-clock(연/월/일)을 얻은 뒤, `utcInstantForCivilMidnight`이 `Date.UTC` 1차 추정 → 같은 타임존으로 재포맷해 실제 00:00:00과의 오차(ms)를 구해 보정(최대 5회 반복)하는 방식으로 고정 오프셋(`kst.ts`의 UTC+9 산술)에 의존하지 않음. `Asia/Ho_Chi_Minh`(UTC+7, DST 없음)은 정시 오프셋이라 1회 반복으로 수렴하며, 30/45분 비정형 오프셋(인도·네팔 등)도 반복 보정으로 커버하도록 설계됨. `route.ts` GET/POST 모두 `store.timezone`(배정 매장의 타임존, 미배정 시 GET에 한해 `DEFAULT_TIMEZONE="Asia/Seoul"` 폴백)을 `startOfDayInTimeZone`에 전달해 "오늘" 로그 조회·동일 타입 연속 방지 판정 경계로 사용 — `kst.ts`(회계 도메인 전용, 손대지 않음)와는 완전히 분리된 모듈. |
| **비고** | 실제 UTC+7 매장 데이터가 로컬 DB에 없어 브라우저/curl E2E 실측은 불가. 순수 함수이므로 `node -e`로 `startOfDayInTimeZone`을 직접 호출하는 단위 테스트 스크립트 작성을 권장(향후 Jest 자동화 대상 1순위 — 로드맵 참조). |

### TC-59 관리자 매장 생성/수정/비활성화/삭제(`STORE_IN_USE` 차단)

| 항목 | 내용 |
|---|---|
| **시나리오명** | (a) `POST /api/admin/stores`로 신규 매장 생성 (b) `PATCH`로 좌표/반경/`isActive` 수정 (c) 소속 직원 있는 매장 `DELETE` 시도 |
| **전제조건** | level≥21 관리자 세션. (c)의 경우 대상 `Store`에 `UserInfo.storeId`로 참조하는 직원이 최소 1명 존재 |
| **입력값** | (a) `POST /api/admin/stores` `{ name, latitude, longitude, radiusMeters, timezone? }` (b) `PATCH /api/admin/stores` `{ id, radiusMeters: <신규값>, isActive: false }` (c) `DELETE /api/admin/stores` `{ ids: ["<소속직원 있는 storeId>"] }` |
| **기대 결과** | (a) HTTP 201 신규 row (b) HTTP 200 반영, `isActive=false`로 비활성화 (c) HTTP 400 `{ ok:false, code:"STORE_IN_USE" }`, 매장·소속 직원 레코드 모두 미변경(롤백) |
| **실패 기준** | (a)/(b) 400/500 오반환 (c) 200 반환되며 매장이 삭제되거나 소속 직원의 `storeId`가 orphan 처리됨 |
| **검증 결과** | **PASS** (코드 추적) — `admin/stores/route.ts`: POST/PATCH는 zod(`nameSchema` max 100, `addressSchema` max 300, `radiusMetersSchema` 10~2000 정수, `timezoneSchema`가 `Intl.supportedValuesOf("timeZone")` 화이트리스트 검증)로 유효성 확인 후 `prisma.store.create`/`update`(PATCH는 존재 확인 후 undefined 필드만 부분 갱신). DELETE는 `prisma.store.deleteMany`를 시도하되 `UserInfo.storeId`가 `Store`를 `onDelete: Restrict`로 참조(`Staff.prisma`)하므로 소속 직원이 있으면 FK 위반 `P2003`이 던져지고, catch에서 `error.code === "P2003"`이면 `STORE_IN_USE` 400으로 매핑 — Prisma 트랜잭션 특성상 위반 시 전체 쓰기가 롤백되어 매장·직원 레코드 모두 변경 없음. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/stores.spec.ts`: (a) 생성(201) (b) 상세조회(200) (c) 일부 필드(radiusMeters/address) PATCH 수정 성공 (d) 좌표/반경/타임존 검증 실패 400 6종 (e) 소속 직원 있는 매장 삭제 시도 → 400 STORE_IN_USE (f) 소속 직원 없는 매장 삭제 성공 — 전부 실제 브라우저로 재현 확인. 단 `isActive` 비활성화 단독 PATCH는 이번 스펙에서 별도 검증되지 않음(radiusMeters/address 조합만 실행) |

### TC-60 관리자 `admin/users/list`에서 직원 매장 배정/해제 (`PATCH storeId`)

| 항목 | 내용 |
|---|---|
| **시나리오명** | 관리자가 산하 직원의 `storeId`를 다른 매장으로 재배정하거나 `null`로 해제 |
| **전제조건** | level≥21 관리자 세션, 대상 `userId`가 요청자 산하(TC-28 산하 관계 체크와 동일 게이트 적용 여부 확인 대상) |
| **입력값** | `PATCH /api/admin/users/list` `{ "userId": "<target_id>", "storeId": "<new_store_id>" }` 및 별도로 `{ "userId": "<target_id>", "storeId": null }`(배정 해제) |
| **기대 결과** | HTTP 200, `UserInfo.storeId` 갱신 확인(`select`에 `storeId` 포함), 해제 시 해당 직원은 이후 출퇴근 시도에서 TC-57(`STORE_NOT_ASSIGNED`)로 즉시 차단됨 |
| **실패 기준** | `storeId` 미반영, 존재하지 않는 `storeId`로 갱신 성공(FK 무결성 깨짐), 산하 관계 아닌데도 갱신 허용 |
| **검증 결과** | **PASS** (코드 추적) — `admin/users/list/route.ts` PATCH: `PatchPayloadSchema`에 `storeId: z.string().min(1).nullable().optional()` 추가, `level`과 함께 **동일한 산하 관계 게이트**(`isSuperAdmin` 아니면 `collectAllDownlineIds(adminId)` 기반 `allowedIdsSet.has(userId)` 체크, TC-28과 완전히 같은 코드 경로) 통과 후에만 `prisma.userInfo.update`에 도달 — level·storeId 패치가 분기 없이 같은 권한 게이트를 공유하므로 TC-28 회귀 없음. `storeId !== undefined`일 때만 업데이트 데이터에 포함되는 부분 갱신이며, 응답 `select`에 `storeId` 포함되어 즉시 반영 확인 가능. 존재하지 않는 `storeId` 전달 시 `UserInfo.storeId → Store` FK(`onDelete: Restrict`)가 걸려 Prisma `P2003`을 던지고, catch 블록에서 `e.code === "P2003"`이면 `{ ok:false, error:"STORE_NOT_FOUND" }` 400으로 명시적으로 매핑되어 `UPDATE_FAILED` 500으로 새지 않음(`prisma.user.findUnique`/`prisma.userInfo.findUnique`로 대상 존재 확인 후 update 시도하는 흐름도 유지됨). |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/fixtures/provision-user.ts`의 `provisionStaffUser`/`provisionManagerUser`/`cleanupUser`가 `PATCH /api/admin/users/list`로 `storeId` 배정·해제(`null`)를 22개 스펙 전반의 fixture 단계에서 실제 호출·200 성공 확인(예: `e2e/tests/staff/attendance.spec.ts`, `e2e/tests/admin/multi-store-regression.spec.ts`) |

### TC-61 (회귀) 마이그레이션 후 기존 20명 백필 계정의 정상 출퇴근 — 최우선 검증

| 항목 | 내용 |
|---|---|
| **시나리오명** | `StoreLocation` → `Store` 마이그레이션 이전부터 존재하던 STAFF(level≥10) 20명이 백필된 `storeId`("본점")로 마이그레이션 이후에도 정상 출퇴근 가능한지 확인 |
| **전제조건** | 마이그레이션 + 백필 적용 완료 상태의 로컬 DB |
| **검증 방법** | `psql` read-only SELECT로 직접 재검증(2026-07-06, qa-lead 독립 확인) |
| **입력값** | `SELECT count(*) FROM "Store";` / `SELECT count(*) FROM "UserInfo" WHERE "storeId" IS NOT NULL AND level >= 10;` / `SELECT count(*) FROM "UserInfo" WHERE level >= 10;` / `SELECT count(*) FROM "UserInfo" WHERE "storeId" IS NULL AND level >= 10;` |
| **기대 결과** | `Store` 1행("본점"), `storeId IS NOT NULL AND level>=10` = 20, 전체 `level>=10` = 20(즉 미배정 0명) |
| **실패 기준** | `storeId`가 NULL인 level≥10 행이 1건이라도 존재(= 회귀, 마이그레이션 후 해당 직원 출퇴근 완전 차단됨) |
| **검증 결과** | **PASS (실측)** — 독립 SELECT 재검증 결과: `Store` 테이블 1행(`본점`, `radiusMeters=100`, `timezone=Asia/Seoul`, `isActive=true`), `storeId IS NOT NULL AND level>=10` = **20**, `level>=10` 전체 = **20**, `storeId IS NULL AND level>=10` = **0**. 백필 인원수·전체 STAFF 수·미배정 수 세 지표가 모두 db-expert 보고값(20명)과 정확히 일치하며 회귀 없음. 코드 레벨로도 `route.ts`의 반경 계산(`haversineDistanceMeters`)·완전 차단 기조(반경 초과 시 `attendanceLog.create` 도달 불가)가 TC-49~51과 동일하게 보존되어 있어, 백필된 20명은 마이그레이션 이후에도 매장 반경 내에서 정상 출퇴근된다. |

---

## 15. 멀티매장 확장 Phase 2 (`Handover` 5개 모델 storeId 격리)

> 관련 파일: `prisma/schema/Staff.prisma`(`HandoverItem`/`HandoverShiftSlot`/`HandoverCheck`/`HandoverComment`/`HandoverApproval`에 `storeId` 필수 필드),
> `prisma/migrations/20260706215600_add_handover_store_id_nullable/`, `.../20260706215700_backfill_handover_store_id/`,
> `.../20260706215800_handover_store_id_not_null_and_constraints/`,
> `src/app/api/staff/handover/{items,slots,checks,comments,approvals}/route.ts`,
> `src/app/api/admin/staff/handover/{items,slots}/route.ts`(storeId 스코프 필터 + 크로스 매장 404 차단),
> `src/app/api/admin/staff/handover/checks/route.ts`(신규, ADMIN 21 고정), `admin/staff/handover/{review,history}` 화면.
>
> **배경**: Phase 1에서 `Store` 모델이 도입되었으나 인수인계(Handover) 5개 모델은 여전히 전 매장 공유 데이터였다.
> 2단계 마이그레이션(nullable 추가 → "본점"으로 백필 → NOT NULL + 신규 유니크 제약)으로 매장별 완전 격리를 적용했다.
> 신규 유니크: `HandoverCheck: [storeId, itemId, shiftDate, shiftSlotId, checkedBy]`,
> `HandoverApproval: [storeId, shiftDate, shiftSlotId, category]`.

### TC-62 매장 A/B 동시 인수인계 진행 무충돌 (`HandoverCheck`·`HandoverApproval` storeId 포함 유니크)

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 직원과 Store B 소속 직원이 같은 날짜·같은 카테고리로 각자 자기 매장의 체크리스트 항목 체크·결제 제출을 동시에 진행 |
| **전제조건** | 두 매장 각각 `storeId`가 다른 `HandoverShiftSlot`/`HandoverItem` 보유(매장별 독립 row), 직원 각각 해당 매장에 배정(`UserInfo.storeId`) |
| **입력값** | A 직원: `POST /api/staff/handover/checks` `{itemId: <A매장 item>, shiftDate, shiftSlotId: <A매장 slot>}` / B 직원: 동일 `shiftDate`로 `{itemId: <B매장 item>, shiftSlotId: <B매장 slot>}` — 결제(`POST /api/staff/handover/approvals`)도 동일 패턴으로 동시 제출 |
| **기대 결과** | 둘 다 HTTP 201, `HandoverCheck`/`HandoverApproval` row가 각각 올바른 `storeId`로 독립 저장, 서로의 유니크 제약에 영향 없음(`ALREADY_CHECKED`/`ALREADY_SUBMITTED` 오반환 없음) |
| **실패 기준** | 한쪽이 다른 쪽의 제출로 인해 409 충돌 반환, 또는 `storeId`가 실제 배정 매장과 다르게 저장됨 |
| **검증 결과** | **PASS** (코드 추적 + 실 DB 재검증) — `checks/route.ts`/`approvals/route.ts` POST는 `storeId`를 요청 바디가 아닌 세션의 `userInfo.storeId`에서만 가져와 `data`에 명시적으로 주입하므로 클라이언트가 임의 조작 불가. 유니크 제약이 `[storeId, itemId, shiftDate, shiftSlotId, checkedBy]`/`[storeId, shiftDate, shiftSlotId, category]`로 `storeId`를 포함해 매장별로 독립적인 유니크 스코프를 가지므로, A/B 매장이 동일 `shiftDate`+`category` 조합을 사용해도 서로 다른 `storeId` 값 때문에 유니크 위반이 발생하지 않는다. 로컬 DB에 대해 직접 실행한 중복 검사 쿼리(`GROUP BY storeId, itemId, shiftDate, shiftSlotId, checkedBy HAVING count(*)>1` 및 승인용 동일 패턴)에서 두 테이블 모두 **중복 그룹 0건** 확인. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/multi-store-regression.spec.ts` 3번 시나리오: 매장 A/B 직원의 동시 인수인계 코멘트 제출(`Promise.all`)이 둘 다 201로 무충돌 성공함을 실제 브라우저로 재현 확인 |
| **비고(발견 사항)** | 이 TC를 검증하는 과정에서 별도의 미검증 이슈를 발견함 — **TC-66** 참조(POST 시 `itemId`/`shiftSlotId`가 실제로 `userInfo.storeId`와 같은 매장 소유인지 검증하지 않음). 현재 프로덕션에 매장이 "본점" 1개뿐이라 실질적 노출은 없으나, 2번째 매장 온보딩 전 반드시 수정 필요. |

### TC-63 매장 미배정 STAFF/MANAGER의 인수인계 API 접근 시 403 `STORE_NOT_ASSIGNED`

| 항목 | 내용 |
|---|---|
| **시나리오명** | `UserInfo.storeId = null`인 STAFF(level≥10) 또는 MANAGER(level≥15)가 인수인계 관련 API 호출 |
| **전제조건** | 대상 계정의 `UserInfo.storeId`가 `null` |
| **입력값** | STAFF: `GET/POST/DELETE /api/staff/handover/{items,slots,checks,comments,approvals}` 각각 / MANAGER: `GET/POST/PATCH/DELETE /api/admin/staff/handover/{items,slots}` 각각 |
| **기대 결과** | 두 그룹 모두 HTTP 403 `{ok:false, code:"STORE_NOT_ASSIGNED"}`, 어떤 DB 쓰기도 발생하지 않음 |
| **실패 기준** | 200/201 반환, 또는 `storeId=null`인 채로 레코드 생성 시도(NOT NULL 제약 위반 500으로 새어나감) |
| **검증 결과** | **PASS** (코드 추적) — staff 5개 라우트(`items`/`slots`/`checks`/`comments`/`approvals`) 전부 `level<10` 401 체크 직후, DB 쓰기/조회 이전에 `userInfo.findUnique`로 `storeId`를 조회해 `!userInfo?.storeId`면 즉시 403 `STORE_NOT_ASSIGNED`를 반환하고 함수가 종료됨(예외 분기 없음, 5개 라우트 모두 동일 패턴). admin `items`/`slots` 라우트도 `resolveStoreId()` 헬퍼로 동일 가드를 MANAGER 레벨 체크 직후에 적용— 두 그룹 모두 매장 미배정 상태에서는 인수인계 관련 어떤 엔드포인트에도 접근할 수 없다. |

### TC-64 관리자 신규 `api/admin/staff/handover/checks` 엔드포인트 — ADMIN/SUPER 성공, MANAGER 이하 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | (a) ADMIN(level=21)/SUPER(level=99)가 `storeId` 지정 조회 (b) 동일 레벨이 `storeId` 생략(전체 매장 통합) 조회 (c) MANAGER(level=15) 이하가 접근 시도 |
| **전제조건** | (a)(b) level≥21 세션 (c) level<21 세션(MANAGER 포함) |
| **입력값** | `GET /api/admin/staff/handover/checks?shiftDate=&shiftSlotId=&storeId=<특정매장>`(a), `storeId` 파라미터 생략(b), 동일 요청을 MANAGER 세션으로(c) |
| **기대 결과** | (a) HTTP 200, 지정 매장 데이터만 (b) HTTP 200, 전 매장 통합 데이터(`store: {name}` 포함) (c) HTTP 401 |
| **실패 기준** | (a)/(b) 200 미반환 또는 매장 필터 미적용 (c) 200 반환(권한 우회) |
| **검증 결과** | **PASS** (코드 추적) — `admin/staff/handover/checks/route.ts` GET은 `requireAdmin(21)`로 게이트(레벨 미달 시 `{error:"Unauthorized"}` 401, MANAGER=15는 21 미만이므로 차단). `storeId` 쿼리파라미터가 있으면 `where`에 `{storeId}` 스프레드로 추가되고, 없으면 `shiftDate`/`shiftSlotId`만으로 전 매장 조회(스코프 없음) — `include`에 `store:{select:{name}}`을 포함해 전체 조회 시 매장명을 함께 반환하도록 설계되어 있어 통합 뷰 용도임이 코드상 명확. `shiftDate`/`shiftSlotId` 미지정 시 `MISSING_PARAMS` 400으로 별도 차단. |

### TC-65 관리자 items/slots PATCH/DELETE 크로스 매장 차단 (404)

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A에 배정된 MANAGER가 Store B 소유의 `HandoverItem`/`HandoverShiftSlot` id로 PATCH/DELETE 시도 |
| **전제조건** | level≥15 MANAGER 세션, `UserInfo.storeId = <A매장>`, 요청 바디의 `id`는 `storeId=<B매장>`인 레코드 |
| **입력값** | `PATCH /api/admin/staff/handover/items` `{id: <B매장 item id>, isActive: false}`, `DELETE /api/admin/staff/handover/items` `{id: <B매장 item id>}` — `slots`도 동일 패턴 |
| **기대 결과** | 4개 조합(items PATCH/DELETE, slots PATCH/DELETE) 전부 HTTP 404 `{ok:false, code:"NOT_FOUND"}`, B매장 레코드 미변경 |
| **실패 기준** | 200 반환, 또는 B매장 레코드가 A매장 MANAGER에 의해 수정/삭제됨 |
| **검증 결과** | **PASS** (코드 추적) — `admin/staff/handover/items/route.ts`·`slots/route.ts`의 PATCH/DELETE 모두: 요청자의 `storeId`를 `resolveStoreId()`로 구한 뒤, 대상 `id`로 `findUnique({select:{storeId}})`를 별도 조회해 `!existing \|\| existing.storeId !== storeId`면 실제 `update`/`delete` 호출 **이전**에 404 `NOT_FOUND`로 즉시 반환 — 소유권 검증이 쓰기 직전에 위치해 크로스 매장 변경이 원천 차단된다. GET/POST도 동일 헬퍼로 자기 매장 데이터만 다루므로(where에 `storeId` 고정) MANAGER는 애초에 자기 매장 외 id를 열거할 방법이 없다(단, id를 직접 알고 있는 경우에 대한 방어까지 PATCH/DELETE에서 이중으로 확인됨). |

### TC-66 `checks`/`comments`/`approvals` POST — `itemId`/`shiftSlotId` 소유 매장 검증

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 직원이 Store B 소유의 `itemId`(또는 `shiftSlotId`)를 알고 있는 상태에서 `POST /api/staff/handover/checks`(또는 `comments`/`approvals`)에 해당 id를 실어 요청 |
| **전제조건** | level≥10 STAFF, `UserInfo.storeId=<A매장>`, 공격자가 B매장 소유 `itemId`/`shiftSlotId`(cuid)를 사전에 알고 있음(정상 UI로는 노출되지 않으나 다른 경로로 알게 된 경우 가정) |
| **입력값** | `POST /api/staff/handover/checks` `{itemId: <B매장 item id>, shiftDate, shiftSlotId: <B매장 slot id>}` |
| **기대 결과(이상적)** | B매장 소유 `itemId`/`shiftSlotId`이면 400/404로 거부되어야 함 |
| **실제 결과** | **PASS (재검증, 코드 추적)** — site-expert가 소유권 검증 가드를 추가함. 3개 라우트 모두 create 이전에 검증 로직 위치 확인됨: (1) `checks/route.ts` L48-54 — `handoverItem.findUnique`/`handoverShiftSlot.findUnique`를 `Promise.all`로 동시 조회 후 `item.storeId !== userInfo.storeId \|\| slot.storeId !== userInfo.storeId`(둘 중 하나라도 불일치)면 404 `NOT_FOUND` 반환 후 `return`으로 종료, L57의 `handoverCheck.create` 도달 불가. (2) `comments/route.ts` L55-58 — `handoverShiftSlot.findUnique`로 slot 조회 후 `slot.storeId !== userInfo.storeId`면 404 반환, L60 `create` 이전에 위치. (3) `approvals/route.ts` L57-60 — 동일 패턴, slot 소유권 불일치 시 404 반환 후 L63 `create` 미도달. 세 파일 모두 `!item`/`!slot`(존재 자체 안 함) 케이스도 함께 404로 처리해 방어적. |
| **심각도** | 해소됨 — 수정 전 Medium(IDOR형 소유권 미검증)이었으나, 요청자 storeId와 불일치 시 create 이전 단계에서 404로 차단되어 타 매장 데이터 오염 경로 제거됨. |
| **배분** | 완료 — site-expert 수정, qa-lead 코드 레벨 재검증 PASS. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/staff/handover.spec.ts` 3번 시나리오: 타 매장 슬롯 id로 `POST /api/staff/handover/comments` 제출 시도 → 404 NOT_FOUND 실제 브라우저로 재현 확인(소유권 검증 회귀 없음) |

---

## 16. 멀티매장 확장 Phase 3 (매장별 매니저 권한)

> 관련 파일: `src/lib/middleware/store-scope.ts`(신규, `resolveStoreScope()`),
> `src/app/api/admin/staff/handover/{items,slots}/route.ts`(로컬 `resolveStoreId()` → `resolveStoreScope()` 치환),
> `src/app/api/admin/staff/handover/{comments,approvals}/route.ts`(기존 `requireAdmin(21)` 제거 → `resolveStoreScope()`, MANAGER도 접근 가능),
> `src/app/api/admin/staff/handover/checks/route.ts`(동일 치환),
> `src/app/[locale]/admin/layout.tsx`(경로별 레벨 게이트), `src/proxy.ts`(`x-pathname` 헤더 주입),
> `src/app/[locale]/admin/staff/handover/{page.tsx,HandoverAdminView.tsx,review/*,history/*}`(ADMIN/SUPER 전용 매장 선택 드롭다운).
>
> **배경**: Phase 2까지 인수인계 admin API는 ADMIN(21) 전용이거나 매장별 로컬 헬퍼(`resolveStoreId()`)를 썼다.
> Phase 3은 `resolveStoreScope()`라는 단일 헬퍼로 통일하여 MANAGER(15)에게도 자기 매장 한정으로
> 인수인계 관리 화면·API를 개방했다. `admin/layout.tsx`는 `/admin/staff/handover` 서브트리만 MANAGER
> 통과, 그 외 `/admin/*`는 여전히 ADMIN(21) 미만 차단으로 경로별 분기 처리.

### Phase 3 회귀 확인 (TC-62~66 재검증)

| TC | 재검증 결과 | 근거 |
|---|---|---|
| TC-62 | **PASS (회귀 없음)** | `api/staff/handover/checks/route.ts`·`approvals/route.ts`(Phase 3 변경 대상 아님, `api/admin/staff/handover/*`만 변경됨)는 여전히 `auth()`+`userInfo.storeId` 직접 조회 방식 그대로이며 `resolveStoreScope()`로 치환되지 않았음을 코드 확인. 유니크 제약(`[storeId,...]`)도 스키마 변경 없음. |
| TC-63 | **PASS (회귀 없음)** | staff 5개 라우트는 Phase 3에서 손대지 않음(위와 동일 근거로 재확인). admin `items`/`slots`는 로컬 `resolveStoreId()` → `resolveStoreScope()`로 치환됐지만, `store-scope.ts` L31-36에서 동일하게 `!userInfo?.storeId`면 403 `STORE_NOT_ASSIGNED`를 반환해 동작 동일. |
| TC-64 | **⚠️ 기대값 변경(설계 의도, 아래 TC-69 참조)** | 원 TC-64(c)는 "MANAGER(15)가 `admin/staff/handover/checks` 접근 시 401"을 기대했으나, Phase 3에서 `checks/route.ts`가 `requireAdmin(21)` → `resolveStoreScope()`로 바뀌면서 MANAGER도 200(자기 매장 스코프)으로 접근 가능해짐 — 이는 회귀가 아니라 Phase 3 명시적 설계 변경. (a)(b) ADMIN 시나리오는 로직 동일하게 보존되어 PASS. |
| TC-65 | **PASS (회귀 없음)** | `items/route.ts` L43-45, `slots/route.ts` L51-53: PATCH/DELETE 모두 대상 `id`를 `findUnique({select:{storeId}})`로 별도 조회 후 `scope.scope==="OWN" && existing.storeId !== scope.storeId`면 쓰기 이전에 404 `NOT_FOUND` — 헬퍼 이름만 `resolveStoreId()`→`resolveStoreScope()`로 바뀌었을 뿐 소유권 검증 로직·순서 동일. |
| TC-66 | **PASS (회귀 없음)** | `api/staff/handover/{checks,comments,approvals}/route.ts`(Phase 3 미변경 대상)에 `item.storeId !== userInfo.storeId`/`slot.storeId !== userInfo.storeId` 소유권 검증이 각각 L52, L56, L58에 여전히 존재, `create` 호출 이전에 404 반환 확인. |

### TC-67 items/slots — MANAGER의 쿼리/바디 storeId 조작 시 자기 매장으로 강제

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 MANAGER가 `GET/POST /api/admin/staff/handover/{items,slots}`에 Store B의 `storeId`를 쿼리파라미터(GET) 또는 바디(POST)로 실어 조회·생성 시도 |
| **전제조건** | level=15(MANAGER) 세션, `UserInfo.storeId = <A매장>` |
| **입력값** | `GET /api/admin/staff/handover/items?storeId=<B매장>`, `GET /api/admin/staff/handover/slots?storeId=<B매장>&category=HALL`, `POST /api/admin/staff/handover/items {label:"몰래추가", storeId:"<B매장>"}` |
| **기대 결과** | GET 두 건 모두 A매장 데이터만 반환(B매장 데이터 노출 없음), POST는 `storeId:"<B매장>"`을 무시하고 A매장으로 저장됨 |
| **실패 기준** | B매장 데이터가 응답에 포함되거나, POST로 생성된 레코드의 `storeId`가 B매장으로 저장됨 |
| **검증 결과** | **PASS** (코드 추적) — `items/route.ts` GET L13: `where = scope.scope === "OWN" ? { storeId: scope.storeId } : queryStoreId ? { storeId: queryStoreId } : {}` — OWN 분기가 삼항의 최우선 조건이라 `queryStoreId`(쿼리의 B매장 값)는 아예 평가되지 않고 무조건 `scope.storeId`(A매장)로 고정. `slots/route.ts` GET L14도 동일 패턴(`storeFilter`). POST는 `items/route.ts` L24-30: `if (scope.scope === "OWN") { storeId = scope.storeId; }` — 주석("body에 storeId가 오더라도 무시하고 자기 매장으로 강제한다") 그대로 바디의 `bodyStoreId`를 아예 대입하지 않는 분기 구조. `slots/route.ts` L28-34도 동일. |

### TC-68 items/slots — MANAGER의 PATCH/DELETE 대상이 타 매장 소유일 때 404

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 MANAGER가 Store B 소유의 `HandoverItem`/`HandoverShiftSlot` id를 알고 있는 상태에서 `resolveStoreScope()` 적용 후에도 PATCH/DELETE가 차단되는지 재확인(TC-65의 Phase 3 버전) |
| **전제조건** | level=15 MANAGER, `UserInfo.storeId=<A매장>`, 대상 `id`는 `storeId=<B매장>` 레코드 |
| **입력값** | `PATCH /api/admin/staff/handover/items {id:<B매장 item>, isActive:false}`, `DELETE /api/admin/staff/handover/slots {id:<B매장 slot>}` |
| **기대 결과** | 둘 다 HTTP 404 `{ok:false, code:"NOT_FOUND"}`, B매장 레코드 미변경 |
| **실패 기준** | 200 반환 또는 B매장 레코드 변경/삭제 |
| **검증 결과** | **PASS** (코드 추적) — `items/route.ts` PATCH L43-45 / DELETE L58-60, `slots/route.ts` PATCH L51-53 / DELETE L66-68: 4개 핸들러 전부 `existing = findUnique({select:{storeId}})` 후 `!existing` 이면 404, `scope.scope==="OWN" && existing.storeId !== scope.storeId` 이면 마찬가지로 404 — 두 케이스가 동일한 `NOT_FOUND` 코드로 병합되어 "존재하지 않음"과 "타 매장 소유"를 구분할 수 없게 설계됨(레코드 존재 여부 자체를 노출하지 않는 IDOR 방지 패턴, `approvals/route.ts`와 동일 사상). `update`/`delete` 호출은 이 체크 다음 줄에 위치해 조건 불충족 시 도달 불가. |

### TC-69 checks/comments/approvals GET — MANAGER의 storeId 쿼리 조작 무력화 (Phase 3 신규 개방 엔드포인트)

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 MANAGER가 `GET /api/admin/staff/handover/{checks,comments,approvals}`에 `storeId=<B매장>` 쿼리파라미터를 실어 조회 시도 (Phase 2까지 ADMIN 전용이었다가 Phase 3에서 MANAGER에게 처음 개방된 엔드포인트) |
| **전제조건** | level=15 MANAGER, `UserInfo.storeId=<A매장>`, `shiftDate`/`shiftSlotId` 유효값 |
| **입력값** | `GET /api/admin/staff/handover/checks?shiftDate=...&shiftSlotId=...&storeId=<B매장>`, `comments`/`approvals`도 동일 패턴 |
| **기대 결과** | 3개 엔드포인트 모두 A매장 데이터만 반환(B매장 데이터 유입 없음) |
| **실패 기준** | B매장 데이터가 응답에 포함됨 |
| **검증 결과** | **PASS** (코드 추적) — `checks/route.ts` L22-23: `storeFilter = scope.scope === "OWN" ? scope.storeId : searchParams.get("storeId") ?? undefined` — OWN이면 쿼리값을 아예 참조하지 않고 `scope.storeId`로 고정. `comments/route.ts` L17-19, `approvals/route.ts` L17-19도 `if (scope.scope === "OWN") { where.storeId = scope.storeId; }` — else 분기(쿼리 storeId 반영)는 OWN이 아닐 때만 실행되므로 MANAGER는 이 else 브랜치에 도달 자체를 못 함. 세 파일 모두 동일한 "OWN 우선 강제" 패턴을 공유. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/multi-store-regression.spec.ts` 2b번 시나리오: 매장A 매니저가 `storeId=<매장B>` 쿼리를 실어 `GET /api/admin/staff/handover/comments` 호출해도 200 + 결과 0건(자기 매장으로 무력화)임을 실제 브라우저로 재현 확인 |

### TC-70 approvals PATCH/DELETE — MANAGER의 타 매장 레코드 조작 통합 404 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | Store A 소속 MANAGER가 Store B 소유 `HandoverApproval` id를 컨펌(PATCH) 또는 삭제(DELETE) 시도 |
| **전제조건** | level=15 MANAGER, `UserInfo.storeId=<A매장>`, 대상 approval `storeId=<B매장>` |
| **입력값** | `PATCH /api/admin/staff/handover/approvals {id:<B매장 approval id>}`, `DELETE /api/admin/staff/handover/approvals {id:<B매장 approval id>}` |
| **기대 결과** | 둘 다 HTTP 404 `{ok:false, code:"NOT_FOUND"}`, B매장 레코드 상태(`status`) 미변경, 미삭제 |
| **실패 기준** | 200 반환, 또는 B매장 승인이 A매장 MANAGER에 의해 컨펌/삭제됨 |
| **검증 결과** | **PASS** (코드 추적) — `approvals/route.ts` PATCH L41-48: `existing = findUnique({select:{id,status,storeId}})` 후 `if (!existing \|\| (scope.scope === "OWN" && existing.storeId !== scope.storeId)) return 404` — 주석에 "레코드 없음과 매장 불일치(IDOR)를 동일한 404로 통합"이라 명시. `update`(L52) 호출은 이 조건문 다음 줄이라 도달 불가. DELETE L68-75도 동일 패턴(`select:{id,storeId}`), `delete`(L76) 이전에 위치. ADMIN/SUPER(scope="ALL")는 이 조건이 `false`로 항상 통과하므로 전 매장 approval을 컨펌/삭제 가능 — 의도된 설계(전체 관리 권한). |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/multi-store-regression.spec.ts` 1)/2)번 시나리오: 매장A 매니저의 매장B 승인건 PATCH/DELETE 시도 각각 404 NOT_FOUND 실제 브라우저로 재현 확인 |

### TC-71 ADMIN/SUPER 매장 선택 드롭다운 — 필터 적용 및 미선택 시 통합 조회

| 항목 | 내용 |
|---|---|
| **시나리오명** | (a) ADMIN이 화면의 매장 선택 드롭다운에서 특정 매장을 선택하면 해당 매장 데이터만 조회됨 (b) 드롭다운을 "전체 매장"(미선택, 빈 값)으로 두면 전 매장 통합 조회됨 |
| **전제조건** | level≥21 세션(`isAdmin=true`로 화면 렌더링됨) |
| **입력값** | (a) `HandoverAdminView`/`HandoverReviewView`/`HandoverHistoryView`에서 매장 드롭다운 `<Store B>` 선택 → 내부적으로 `items`/`slots`/`checks`/`comments`/`approvals` fetch에 `&storeId=<B>` 쿼리 부착 (b) 드롭다운 값 `""`(전체 매장) 유지 → 쿼리에 `storeId` 미부착 |
| **기대 결과** | (a) 서버 응답이 B매장 데이터만 포함 (b) 서버 응답이 전 매장 데이터 통합(=where에 storeId 조건 없음) |
| **실패 기준** | (a) 필터 무시하고 전체 반환 (b) 미선택 시에도 임의 매장으로 좁혀짐 |
| **검증 결과** | **PASS** (코드 추적) — `HandoverAdminView.tsx` L153-154, L166: `storeId` state를 `useState("")`로 초기화, `fetchItems`가 `` `/api/admin/staff/handover/items${storeId ? `?storeId=${storeId}` : ""}` `` 형태로 storeId가 있을 때만 쿼리 부착. `HandoverReviewView.tsx`/`HandoverHistoryView.tsx` L149(각각의 `loadData`)도 동일 패턴(`storeQuery = storeId ? "&storeId=..." : ""`). 서버 측 `items/route.ts` GET L13: ADMIN(`scope.scope !== "OWN"`)이고 `queryStoreId`가 있으면 `{storeId: queryStoreId}`로 필터, 없으면 `{}`(무필터, 전체 조회) — 클라이언트의 "선택/미선택" 상태가 그대로 서버 필터 유무로 이어짐. `checks/route.ts` include에 `store:{select:{name}}`을 포함해 전체 조회 시 매장명을 함께 반환하도록 설계되어 있어(TC-64(b)와 동일 근거) 통합 뷰에서도 매장 구분이 가능. 드롭다운 자체는 `isAdmin` prop이 `true`일 때만 렌더링(`HandoverAdminView.tsx` L227, 나머지 두 파일도 동일 `{isAdmin && (...)}` 패턴)되므로 MANAGER 화면에는 드롭다운이 아예 노출되지 않음(추가로 `/api/admin/stores` 자체도 `requireAdmin(21)` 고정이라 MANAGER가 URL로 직접 호출해도 401). |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/multi-store-regression.spec.ts` 4번 시나리오: `storeId` 쿼리별 items 필터링(매장A/B 상호 미노출) + `/ko/admin/staff/handover` 화면의 "매장 선택" 드롭다운 노출을 실제 브라우저로 재현 확인 |

### TC-72 매장 미배정(`storeId=null`) MANAGER — API 403 차단은 정상이나 화면은 무언 실패(발견 사항)

| 항목 | 내용 |
|---|---|
| **시나리오명** | `UserInfo.storeId=null`인 MANAGER(level=15)가 `/admin/staff/handover` 화면 접근 및 API 5종(`items`/`slots`/`checks`/`comments`/`approvals`) 호출 |
| **전제조건** | level=15 세션, `UserInfo.storeId=null` |
| **입력값** | 화면: `GET /ko/admin/staff/handover` 브라우저 접근. API: 위 5개 엔드포인트에 대한 GET 각각 |
| **기대 결과(API)** | 5개 엔드포인트 모두 HTTP 403 `{ok:false, code:"STORE_NOT_ASSIGNED"}` |
| **기대 결과(화면, 이상적)** | 매장 미배정 상태를 사용자에게 명시적으로 안내(TC-57의 `staffPortal.attendance.storeNotAssigned` 패턴과 동등한 수준) |
| **실패 기준** | API가 200/201 반환, 또는 화면이 아무 안내 없이 "빈 데이터"로만 표시되어 정상 상태(단순히 항목 없음)와 구분 불가 |
| **검증 결과** | **API: PASS** (코드 추적) — `resolveStoreScope()` L25-38: `level >= USER_LEVELS.MANAGER`(15)면 `userInfo.storeId` 조회 후 `!userInfo?.storeId`이면 403 `STORE_NOT_ASSIGNED` 반환(L31-36) — items/slots/checks/comments/approvals 5개 라우트 전부 첫 줄에서 `resolveStoreScope()`를 호출하고 `!scope.ok`면 `scope.error`를 즉시 반환하므로 공통 적용됨. **화면: FAIL (보안 취약점 아님, UX 결함)** — `admin/layout.tsx`는 `level < minLevel`(L36)만 검사할 뿐 `storeId` 배정 여부는 검사하지 않아 미배정 MANAGER도 페이지 렌더링 자체는 통과함. 이후 `HandoverAdminView.tsx`/`HandoverReviewView.tsx`/`HandoverHistoryView.tsx`의 fetch 콜백이 하나같이 `.then((d) => { if (d.ok) setItems(d.items); })` 형태(예: `HandoverAdminView.tsx` L165-168)로 `d.ok===false`(403 STORE_NOT_ASSIGNED 포함)인 경우 아무 분기도 실행하지 않아 에러 메시지나 안내 없이 초기 빈 상태(`[]`)가 그대로 유지됨 — `grep -rn "STORE_NOT_ASSIGNED" "src/app/[locale]/admin/staff/handover"` 결과 0건으로 세 화면 어디에도 이 코드에 대한 처리 분기가 없음을 확인. 사용자 입장에서는 "매장에 항목이 아직 없다"와 "내가 매장에 배정되지 않아 아무것도 못 본다"를 구분할 수 없다. |
| **비고** | 데이터 유출·권한 우회는 없으므로 보안 결함은 아니나, TC-57(staff attendance)에서 확립된 "명시적 안내" 관례에서 벗어난 Low 심각도 UX 회귀성 갭. 코드 수정은 본 QA 범위 밖이라 수행하지 않음 — site-expert/admin-expert에 별도 티켓화 권장. |
| **Phase 4 재검증(최종)** | **PASS (화면 UX 결함 해소 확인)** — site-expert가 1차 반려 후 재작업하여 `HandoverAdminView.tsx`(L155, L170, L231-232), `HandoverReviewView.tsx`(L156, L171, L250-251), `HandoverHistoryView.tsx`(L140, L155, L224-225) 3개 파일 전부에 `storeNotAssigned` state + 조건부 `<Alert severity="warning">{t("handoverStoreSelector.notAssignedGuidance")}</Alert>` 렌더링이 동일 패턴으로 추가됨을 코드 레벨로 확인(`grep -n "storeNotAssigned\|Alert" src/app/[locale]/admin/staff/handover/**/*.tsx` 결과 3개 파일 모두 매치). 세 화면 모두 최초 API 응답(`items`/`slots`)에서 `!d.ok && d.code === "STORE_NOT_ASSIGNED"`를 감지하면 즉시 `setStoreNotAssigned(true)`로 전환해 이후 정상 콘텐츠(드롭다운·리스트) 대신 안내 Alert만 렌더링 — "매장에 항목이 없음"과 "매장 미배정으로 아무것도 못 봄"이 이제 명확히 구분됨. `handoverStoreSelector.notAssignedGuidance` 키가 5개 로케일(`en`/`ja`/`ko`/`vi`/`zh` `adminPortal.json`) 전부에 존재함을 확인(P4b i18n-expert 작업 검증). API 403(TC-63/TC-72 원본 검증)과 화면 UX(Phase 4 수정)를 합쳐 **TC-72 최종 판정: PASS** — Phase 3의 Low 심각도 UX 갭이 완전히 해소됨. |

### TC-73 `admin/layout.tsx` 경로별 게이트 — MANAGER는 handover만 통과, 그 외 `/admin/*`는 여전히 차단

| 항목 | 내용 |
|---|---|
| **시나리오명** | MANAGER(level=15)가 (a) `/admin/staff/handover`(및 하위 `/review`, `/history`) 서브트리 접근 시 통과 (b) `/admin/sales`, `/admin/boards`, `/admin/users`, `/admin/stores`, `/admin/staff/attendance` 등 그 외 `/admin/*` 경로 접근 시 차단(레벨<21 리다이렉트)되는지 — Phase 3 도입 전 사전 발견된 "handover 개방이 `/admin/*` 전체로 새는" 유형의 보안 이슈가 실제로 고정됐는지 확인하는 회귀성 TC |
| **전제조건** | level=15 MANAGER 세션 |
| **입력값** | (a) `GET /ko/admin/staff/handover`, `GET /ko/admin/staff/handover/review`, `GET /ko/admin/staff/handover/history` (b) `GET /ko/admin/sales`, `GET /ko/admin/boards`, `GET /ko/admin/users/list`, `GET /ko/admin/stores`, `GET /ko/admin/staff/attendance` |
| **기대 결과** | (a) 3개 경로 모두 `AdminShell` 정상 렌더링(리다이렉트 없음) (b) 5개 경로 모두 `/ko`(홈)로 리다이렉트 |
| **실패 기준** | (a) 리다이렉트됨 (b) 하나라도 `AdminShell` 콘텐츠가 그대로 노출됨(=handover 개방이 다른 admin 경로로 누수) |
| **검증 결과** | **PASS** (코드 추적) — `admin/layout.tsx` L15: `HANDOVER_STAFF_AREA_REGEXP = /\/admin\/staff\/handover(\/|$)/` — "handover" 뒤에 `/` 또는 문자열 끝만 허용하는 정밀 매칭이라 `/admin/staff/handoverXYZ` 같은 유사 문자열 오탐 없음. L30-32: `pathname`(헤더 `x-pathname`)에 대해 정규식 테스트 후 `minLevel = isHandoverStaffArea ? USER_LEVELS.MANAGER(15) : USER_LEVELS.ADMIN(21)`. `/admin/staff/handover`, `/review`, `/history` 3개 경로 모두 정규식이 매치(끝 또는 `/` 뒤에 서브경로)되어 `minLevel=15` → level=15는 `level < minLevel`(L36)이 `false`라 통과. 반면 `/admin/sales`, `/admin/boards`, `/admin/users/list`, `/admin/stores`, `/admin/staff/attendance`는 모두 정규식 불일치 → `minLevel=21` → level=15는 `15 < 21`이 `true`라 `redirect(/${locale})`(L36) 실행. 코드 트리 확인(`find src/app/[locale]/admin -maxdepth 1`) 결과 `sales`/`boards`/`users`/`stores`/`staff` 등 개별 admin 페이지에는 자체 레벨 가드가 없고(주석 L11-14: "개별 admin 페이지에는 자체 레벨 가드가 없고 이 레이아웃의 게이트에만 의존") 전적으로 이 레이아웃 게이트에 의존하므로, 정규식 매칭 정확성이 곧 전체 `/admin/*` 접근 제어의 유일한 방어선이다. `proxy.ts` L47-49: `req.headers.set("x-pathname", req.nextUrl.pathname)`가 `ADMIN_PATH_REGEXP` 매치 시 매 요청마다 무조건 실제 pathname으로 덮어쓰므로, 클라이언트가 임의로 `x-pathname` 요청 헤더를 실어 보내도 프록시 단계에서 실제 경로값으로 재기록되어 스푸핑 불가(단, `.set()`이 append가 아닌 override이므로 사전에 클라이언트가 같은 헤더를 주입해도 최종적으로 실제 경로로 교체됨을 코드로 확인). |
| **비고** | `next-intl` 미들웨어가 커스텀 요청 헤더를 다운스트림 Server Component까지 실제로 전달하는지는 런타임 동작이라 이 프로젝트의 기존 관례(정적 코드 추적)상 소스 코드 주석과 구조로만 근거를 삼았고, dev 서버 기동 후 실측 확인은 하지 않음(TC-54~55와 동일한 한계). |

---

## 17. 멀티매장 확장 Phase 4 (마무리)

> 관련 파일: `prisma/schema/Staff.prisma`(`Store` 모델 `@@unique([name])`),
> `prisma/migrations/20260706190835_add_store_name_unique/migration.sql`,
> `src/app/api/admin/stores/route.ts`(POST/PATCH), `docs/specs/security.md`(WARN 백로그).
>
> **배경**: Phase 4에서 db-expert가 기존 `Store.name` 중복 검사(0건) 후 `@@unique([name])` 마이그레이션을
> 적용했다. 이 신규 DB 제약이 API 레벨에서 사용자 친화적으로 처리되는지 확인하는 TC를 추가한다.

### TC-74 매장명 중복 생성/수정 시도 — `Store.name` 유니크 제약 위반 처리 (미처리 발견)

| 항목 | 내용 |
|---|---|
| **시나리오명** | (a) 이미 존재하는 매장명으로 `POST /api/admin/stores` 신규 생성 시도 (b) 매장 B의 이름을 매장 A와 동일하게 `PATCH /api/admin/stores`로 수정 시도 |
| **전제조건** | level≥21 관리자 세션, `Store` 테이블에 `name="본점"` row 이미 존재 |
| **입력값** | (a) `POST /api/admin/stores` `{ name: "본점", latitude, longitude, radiusMeters }` (b) `PATCH /api/admin/stores` `{ id: "<매장B id>", name: "본점" }` |
| **기대 결과(이상적)** | 두 경우 모두 명시적인 4xx(예: `STORE_NAME_TAKEN`, 409)로 거부되고 DB 쓰기는 발생하지 않아야 함 |
| **실제 결과** | **FAIL (미처리 발견, 코드 추적)** — `admin/stores/route.ts` POST(L86-118)/PATCH(L122-161) 모두 zod 검증(`nameSchema`) 통과 후 `prisma.store.create`/`prisma.store.update`를 **try/catch 없이 직접 호출**한다. `Store.name`에 `@@unique([name])`(`Staff.prisma` L52, 마이그레이션 `20260706190835_add_store_name_unique` 적용 완료)이 걸려 있으므로 중복 이름 요청 시 Prisma가 `P2002`(Unique constraint violation)를 던지고, 이 경로에는 catch 블록이 없어 Next.js 기본 처리로 새어나가 매핑되지 않은 500 에러가 반환된다. 동일 파일의 `DELETE` 핸들러(L184-193)는 `P2003`(`STORE_IN_USE`)을 명시적으로 캐치·매핑하는 반면, POST/PATCH는 `P2002`에 대한 동등한 처리가 없어 **비대칭**이다. DB 쓰기 자체는 유니크 제약이 트랜잭션 차원에서 막으므로 데이터 정합성 훼손(실패 기준의 "DB 값이 잘못된 입력으로 갱신됨")은 발생하지 않는다 — 즉 **데이터 무결성은 안전하나 API 응답 품질(4xx 대신 500)만 결함**. |
| **심각도** | Low — P6 보안 리뷰에서 이미 WARN #2로 식별되어 `docs/specs/security.md` L372에 `OPEN` 백로그로 등록됨(`STORE_NAME_TAKEN` 409 매핑 권장). 데이터 유출·권한 우회·정합성 훼손 없음, 사용자 경험상 원인 불명 500 에러만 노출됨. |
| **배분** | 미배분(백로그) — 이번 Phase 4 QA 게이트의 차단 사유 아님. 다음 사이클에 `admin-expert`가 `P2002` → `STORE_NAME_TAKEN`(409) 매핑 추가 권장(DELETE의 `P2003` 처리와 동일 패턴). |
| **후속 수정 반영** | 이후 별도 라운드에서 `admin-expert`가 POST/PATCH에 `P2002` catch를 추가해 `STORE_NAME_DUPLICATE` 409로 매핑 완료(security-expert 승인, `docs/specs/security.md` WARN #2 CLOSED 반영). 위 "실제 결과"(FAIL, 500 노출) 문구는 발견 당시 기록으로 원문 보존. |
| **E2E 자동화 검증** | E2E 자동화 검증 완료(2026-07-07) — `e2e/tests/admin/stores.spec.ts` "TC-74" describe 블록: 동일 `name`으로 매장 재생성 시도 → 409 `STORE_NAME_DUPLICATE` 응답을 실제 브라우저로 재현 확인(수정 반영 후 최초 자동화 회귀 통과) |

---

## 테스트 케이스 요약

| 카테고리 | 케이스 수 |
|---|---|
| 인증 (로그인/로그아웃) | 6 (TC-01~06) |
| 회원가입 | 4 (TC-07~10) |
| 매출 관리 | 4 (TC-11~14) |
| 엑셀 업로드 | 6 (TC-15~20) |
| 정산 계산 | 4 (TC-21~24) |
| 추천인/사용자 관리 | 4 (TC-25~28) |
| 게시판 (sanitize-html) | 5 (TC-29~33) |
| 권한 레벨 접근 제어 | 3 (TC-34~36) |
| i18n 로케일 | 2 (TC-37~38) |
| 권한 레벨 경계값 상세 | 6 (TC-39~44) |
| VAT 계산 수치 | 1 (TC-45) |
| 엑셀 특수 케이스 | 3 (TC-46~48) |
| 매장 지오펜싱 출퇴근 (구, 단일 매장 기준) | 7 (TC-49~55) |
| 멀티매장 확장 Phase 1 (`Store` 재설계) | 6 (TC-56~61) |
| 멀티매장 확장 Phase 2 (`Handover` storeId 격리) | 5 (TC-62~66, TC-66은 IDOR 갭 발견 후 수정·재검증 PASS) |
| 멀티매장 확장 Phase 3 (매장별 매니저 권한) | 7 (TC-67~73, TC-72는 1차 API PASS·화면 UX FAIL 발견 → Phase 4에서 화면 수정 후 최종 PASS) |
| 멀티매장 확장 Phase 4 (마무리) | 1 (TC-74, `Store.name` 유니크 위반 미처리 발견 — Low, 비차단) |
| **합계** | **74** |
