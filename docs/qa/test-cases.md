<!-- Last updated: 2026-06-17 -->

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

### TC-02 로그인 실패 — 존재하지 않는 사용자

| 항목 | 내용 |
|---|---|
| **시나리오명** | DB에 없는 사용자 로그인 시도 |
| **전제조건** | `nobody` 계정 없음 |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "nobody", "password": "Test@1234" }` |
| **기대 결과** | HTTP 401, `{ "ok": false, "code": "INVALID_CREDENTIALS" }` |
| **실패 기준** | 200 반환, 또는 코드가 `USER_NOT_FOUND` (구 코드 — 계정 열거 공격 가능) |
| **비고** | DUMMY_HASH bcrypt compare 실행으로 타이밍 공격 방어 |

### TC-03 로그인 실패 — 비밀번호 불일치

| 항목 | 내용 |
|---|---|
| **시나리오명** | 올바른 사용자명 + 잘못된 비밀번호 |
| **전제조건** | `testuser` 존재 |
| **입력값** | `POST /api/(site)/auth/login` `{ "id": "testuser", "password": "WrongPass!9" }` |
| **기대 결과** | HTTP 401, `{ "ok": false, "code": "INVALID_CREDENTIALS" }` |
| **실패 기준** | 200 반환, 또는 코드가 `INVALID_PASSWORD` (구 코드 — 비밀번호 불일치 정보 노출) |

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
| **합계** | **48** |
