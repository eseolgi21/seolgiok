<!-- Last updated: 2026-06-17 -->

# seolgiok 도메인 명세

## 비즈니스 개요

seolgiok은 **한식당 경영관리 시스템**이다. 핵심 기능은 다음 네 가지다.

1. **회계 (Accounting)** — 매출(SaleItem), 매입(PurchaseItem), 정산(Settlement)을 관리한다. 엑셀 업로드·수동 입력 두 경로로 데이터를 적재하고, 확정(confirm) 후 분석/정산 집계에 사용한다.
2. **추천인 네트워크 (Referral Network)** — 사용자 간 REFERRER/SPONSOR 두 종류의 방향 엣지(ReferralEdge)로 다단계 추천 관계를 표현한다.
3. **게시판 (Board)** — 공지(NOTICE), 이벤트(EVENT), 고객지원(SUPPORT) 세 유형의 게시판을 운영한다. 고객지원은 1:1 비공개 문의와 Q&A 공개 문의로 세분화된다.
4. **다국어 지원** — next-intl 기반 5개 로케일(ko, en, ja, zh, vi)을 지원한다.

기술 스택: Next.js 16 App Router (SSR) · PostgreSQL (Railway) · Prisma 7 · NextAuth 5 · AES-256-GCM 암호화 · Google OTP(TOTP) 2FA.

---

## 핵심 엔티티

### User

사용자 계정 본체.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| username | String (Citext) | 대소문자 무관 고유 로그인 ID. 4~16자, 영문소문자·숫자·밑줄만 허용 |
| email | String (Citext) | 대소문자 무관 고유 이메일 |
| name | String | 표시 이름 |
| passwordHash | String | bcrypt 해시 (기본 라운드 12) |
| countryCode | String? (Char 2) | ISO 3166-1 alpha-2. Country 테이블 FK |
| createdAt / updatedAt | DateTime | - |

**관계**
- `info` → UserInfo (1:1)
- `downlines` → ReferralEdge (EdgeParent): 이 사용자를 부모로 하는 엣지
- `uplines` → ReferralEdge (EdgeChild): 이 사용자를 자식으로 하는 엣지
- `postsAuthored`, `commentsAuthored`, `ticketAssignments` → Board 연관
- `searchKeywords`, `excelMappings` → 개인 설정

---

### UserInfo

User의 추가 프로필·권한 정보 (1:1 확장 테이블).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | User FK (Cascade) |
| referralCode | String | 전역 고유 추천 코드. 형식: `{username 4자 대문자}{6자 무작위 hex}` |
| level | Int | 기본 1. 권한 레벨 (아래 레벨 체계 참고) |
| googleOtpEnabled | Boolean | Google OTP(TOTP) 2FA 활성화 여부 |
| googleOtpSecret | String? | AES-256-GCM 암호화 저장 |

---

### ReferralEdge

사용자 간 추천인 관계 방향 엣지.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| type | EdgeType | REFERRER 또는 SPONSOR |
| parentId | String | 부모(추천한 사람) User FK |
| childId | String | 자식(추천받은 사람) User FK |
| position | Int? | 그룹 내 순서 |
| groupNo | Int? | 그룹 번호 |

**고유 제약**: `(childId, type)` 조합 유일 → 한 자식은 각 타입별로 정확히 하나의 부모만 가질 수 있다.

---

### DailySales

일별 매출/매입 요약 스냅샷 (레거시 집계 용도).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| date | DateTime (Date) | 날짜 (일별 고유) |
| salesAmount | Int | 매출 합계 (KRW) |
| costAmount | Int | 매입 합계 (KRW) |
| note | String? | 비고 |

> 현재 API 통계는 주로 SaleItem/PurchaseItem 직접 집계를 사용하며, DailySales는 레거시 보조 데이터로 남아 있다.

---

### CardTransaction

카드 거래 명세 원장.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| date | DateTime (Date) | 이용일 |
| confirmedAt | DateTime? (Date) | 확정일 |
| cardName | String | 카드명 |
| merchant | String | 가맹점명 |
| bizNo | String? | 사업자번호 |
| approvalNo | String | 승인번호 |
| installment | String? | 할부개월 |
| amount | Int | 이용금액 (KRW) |

**고유 제약**: `(approvalNo, amount)` 조합 유일 — 부분 취소 허용을 위해 approvalNo 단독 unique 미적용.

---

### SaleItem

매출 항목 단위 레코드 (메인 매출 원장).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| date | DateTime (Date) | 매출 일자 |
| category | String? | 분류 (예: 매장, 배달, 기타) |
| itemName | String | 상품명 |
| amount | Int | 금액 (KRW, 절댓값) |
| paymentMethod | String? | 결제수단 (카드, 현금, 이체 등) |
| note | String? | 비고 |
| confirmed | Boolean | 확정 여부. false=미확정(임시), true=확정(집계 대상) |

---

### PurchaseItem

매입 항목 단위 레코드 (메인 매입 원장).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| date | DateTime (Date) | 매입 일자 |
| category | String? | 분류 (예: 식자재, 비품, 세금, 인건비(프리), 인건비(사대)) |
| itemName | String | 품목명 |
| amount | Int | 금액 (KRW) |
| note | String? | 비고 |
| confirmed | Boolean | 확정 여부 |

---

### Settlement

정산 기간별 수동 입력값 저장.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | String (cuid) | PK |
| startDate | DateTime (Date) | 정산 시작일 |
| endDate | DateTime (Date) | 정산 종료일 |
| reportedCashSales | Int | 현금매출 신고액 (KRW) |
| managerRentSupport | Int | 점장 월세 지원금 (KRW) |

**고유 제약**: `(startDate, endDate)` 조합 유일 — 기간 중복 저장 방지.

---

### ItemClassification

품목명 → 분류 자동 매핑 규칙.

| 필드 | 타입 | 설명 |
|---|---|---|
| itemName | String | 품목명 |
| category | String | 매핑할 분류명 |
| type | KeywordType | PURCHASE 또는 SALES |

엑셀 업로드 시 `itemName`이 일치하면 `category`를 자동 할당한다.

---

### ItemCategory

사용 가능한 분류명 마스터.

| 필드 | 타입 | 설명 |
|---|---|---|
| name | String | 분류명 |
| type | KeywordType | PURCHASE 또는 SALES |

**고유 제약**: `(name, type)` 조합 유일.

---

### ExcelFilter

엑셀 업로드 전처리 전역 필터 규칙.

| 필드 | 타입 | 설명 |
|---|---|---|
| keyword | String | 필터 키워드 |
| type | KeywordType | PURCHASE 또는 SALES |
| isInclude | Boolean | false=제외 필터, true=포함 필터 |

업로드 시 행의 itemName·category·note·paymentMethod를 반각(Half-width)으로 정규화한 후 키워드 매칭을 수행한다.

---

### ExcelMapping

사용자별 엑셀 컬럼 매핑 개인 설정.

| 필드 | 타입 | 설명 |
|---|---|---|
| userId | String | User FK |
| name | String | 매핑 이름 (예: "KB Card") |
| type | KeywordType | PURCHASE 또는 SALES |
| colDate | String | 날짜 컬럼 헤더명 |
| colItem | String | 품목 컬럼 헤더명 |
| colAmount | String | 금액 컬럼 헤더명 |
| colCategory | String? | 분류 컬럼 헤더명 |
| colNote | String? | 비고 컬럼 헤더명 |
| colPayment | String? | 결제수단 컬럼 헤더명 (매출만) |
| filterExclude | String? | 업로드 시 제외 필터 (콤마 구분) |
| filterInclude | String? | 업로드 시 포함 필터 (콤마 구분) |

---

### SearchKeyword

사용자별 검색 키워드 저장소.

| 필드 | 타입 | 설명 |
|---|---|---|
| userId | String | User FK |
| keyword | String | 키워드 |
| type | KeywordType | PURCHASE 또는 SALES |

---

### Post

게시글 본체.

| 필드 | 타입 | 설명 |
|---|---|---|
| boardType | BoardType | NOTICE / EVENT / SUPPORT |
| supportCategory | SupportCategory? | QNA / ONE_TO_ONE (SUPPORT 전용) |
| authorId | String | 작성자 User FK (Restrict — 작성자 삭제 불가) |
| visibility | PostVisibility | PUBLIC / PRIVATE |
| title | String | 제목 |
| bodyFormat | BodyFormat | MARKDOWN / HTML |
| bodyRaw | String | 에디터 원문 |
| bodyHtml | String | sanitize 후 최종 HTML (렌더링 시 이 필드만 사용) |
| isPublished | Boolean | 발행 여부 (공지·이벤트) |
| publishedAt | DateTime? | 발행 시각 |
| tags | String[] | GIN 인덱스 태그 배열 |
| viewCount / likeCount | Int | 통계 |
| eventStartAt / eventEndAt | DateTime? | 이벤트 기간 |
| bannerUrl / ctaLinkUrl | String? | 이벤트 배너·CTA |
| sourceUrl / sourceTitle / sourceByline / sourcePublishedAt | String? / DateTime? | 외부 기사 메타 |

---

### SupportAssignment

1:1 문의(ONE_TO_ONE) 담당자 지정 (Post 1:0..1).

| 필드 | 타입 | 설명 |
|---|---|---|
| postId | String | Post PK 겸 FK (Cascade) |
| assigneeId | String? | 담당자 User FK (SetNull) |
| assignedAt | DateTime | 배정 시각 |

---

### Attachment

게시글 첨부파일.

| 필드 | 타입 | 설명 |
|---|---|---|
| postId | String | Post FK (Cascade) |
| fileUrl | String | 파일 URL |
| fileName | String | 파일명 |
| fileSize | Int | 파일 크기 (bytes) |

---

### Comment

게시글 댓글.

| 필드 | 타입 | 설명 |
|---|---|---|
| postId | String | Post FK (Cascade) |
| authorId | String | 작성자 User FK (Restrict) |
| bodyHtml | String | sanitize HTML |
| isPrivate | Boolean | 비공개 여부 |

---

### Country

국가 마스터.

| 필드 | 타입 | 설명 |
|---|---|---|
| code | String (Char 2) | ISO 3166-1 alpha-2 PK |
| name | String | 국가명 |

User.countryCode → Country.code (SetNull on Delete).

---

## 도메인 불변식

### 금액 규칙
- **모든 금액은 KRW 정수(Int)로만 저장·연산한다.** 부동소수점 직접 연산 절대 금지.
- 부가세 계산 시 `Math.round()` 적용: `salesVAT = Math.round(vatSalesBase * 0.1)`.
- 엑셀 업로드 시 금액 원문에서 숫자·점·마이너스 이외 문자를 제거 후 `Number()` 변환.

### 사용자 레벨(level) 체계

| 레벨 범위 | 의미 | 접근 권한 |
|---|---|---|
| 1 (기본) | 일반 회원 | 공개 페이지, 개인 설정 |
| ≥ 10 | 읽기 관리자 | 회계 조회 API (profit, stats, analysis) |
| ≥ 20 | 수정 관리자 | Settlement 저장 |
| ≥ 21 (어드민) | 최고 관리자 | 매출·매입 CRUD, 사용자 관리, 게시판 관리 |

`isAdmin()` 함수 조건: `level > 20` (즉, 21 이상). 헤더 `x-user-level`로 전달.

### ReferralEdge 불변식
- 한 `childId`는 각 `EdgeType`별로 단 하나의 부모(parent)만 가질 수 있다 (`@@unique([childId, type])`).
- 삭제 시 Cascade: 부모 또는 자식 User 삭제 시 관련 엣지 전체 삭제.

### referralCode 생성 규칙
- 형식: `{username 앞 4자 영숫자 대문자로 패딩}{6자 무작위 hex 대문자}` (총 10자).
- 충돌 시 최대 5회 재시도, 5회 초과 시 예외 발생.

### 회원가입 유효성 규칙
- `username`: 영문소문자·숫자·밑줄 4~16자 (`/^[a-z0-9_]{4,16}$/`).
- `password`: 8~18자, 영문 대문자·소문자·숫자·특수문자 각 1개 이상.
- `email`: 표준 이메일 형식.
- `agreeTerms`, `agreePrivacy` 모두 `true` 필수.

### 매출·매입 확정(confirm) 불변식
- `confirmed = false`: 미확정 임시 데이터. 엑셀 업로드 또는 수동 입력 직후 상태.
- `confirmed = true`: 확정 데이터. 분석·정산·캘린더 집계 대상.
- 엑셀 업로드 시 기존 미확정(`confirmed = false`) 데이터를 **전량 삭제 후** 신규 데이터 삽입.
- 확정 처리 시 중복 시그니처(`date_itemName_amount`) 레코드는 삭제(dedup)하고 나머지만 확정 전환.

### 게시글 삭제 제약
- Post.authorId → User: `onDelete: Restrict` — 작성자가 있는 게시글이 존재하면 해당 User 삭제 불가.
- Comment.authorId → User: 동일하게 `onDelete: Restrict`.

### 암호화 데이터
- Google OTP 시크릿은 반드시 `src/lib/crypto.ts`의 AES-256-GCM 유틸리티를 경유해 암호화·복호화한다.
- 암호화 키: 환경변수 `CRED_ENC_KEY_B64` (base64 인코딩된 32바이트). 직접 수정 금지.

---

## 비즈니스 플로우

### 매출 등록 플로우

```
[엑셀 업로드 경로]
1. POST /api/admin/accounting/sales/upload
   - 엑셀 파일 파싱 (XLSX, 암호화 파일 지원)
   - 헤더 행 자동 감지 (스코어링 알고리즘)
   - ExcelMapping(개인 설정) 또는 기본 키워드로 컬럼 매핑
   - ExcelFilter(전역 필터)·runtimeFilter 적용하여 행 포함/제외 결정
   - ItemClassification으로 품목명 → 분류 자동 매핑
   - 기존 미확정(confirmed=false) SaleItem 전량 삭제
   - SaleItem.createMany (confirmed=false)

2. POST /api/admin/accounting/sales/confirm
   - 키워드 조건으로 SaleItem(confirmed=false) 필터링
   - 중복 시그니처(date+itemName+amount) 제거
   - 트랜잭션: 중복 삭제 + 나머지 confirmed=true 업데이트

[수동 입력 경로]
1. POST /api/admin/accounting/sales/list (또는 /create)
   - 날짜·분류·상품명·금액·결제수단 입력
   - SaleItem 생성 (confirmed=false, 기본 결제수단: 카드)
   - 이후 위 confirm 플로우와 동일
```

### 매입 등록 플로우

매출과 동일한 구조. `/api/admin/accounting/purchase/{upload|create|list|confirm|analysis}` 경로 사용.

### 정산(Settlement) 플로우

```
1. 관리자가 정산 기간(startDate, endDate) 선택
2. GET /api/admin/accounting/profit/settlement
   - SaleItem(confirmed=true) 집계: 카드매출 = 총매출 - 현금매출
   - PurchaseItem(confirmed=true) 집계
   - 부가세 제외 대상 조회 (category: 세금, 인건비(프리), 인건비(사대))
   - 부가세 계산:
     - 매출부가세 = (카드매출 + 현금매출신고액) × 10% (반올림)
     - 매입부가세 = (총매입 - 제외금액) × 10% (반올림)
     - 실납부부가세 = 매출부가세 - 매입부가세
   - 순수익 = 총매출 - 총매입 - 실납부부가세

3. POST /api/admin/accounting/profit/settlement (level ≥ 20)
   - reportedCashSales(현금매출신고액) upsert 저장
   - (startDate, endDate) 기준 upsert
```

### 추천인 등록 플로우

```
1. 신규 회원가입 (POST /api/(site)/auth/signup)
   - User 생성 + UserInfo 생성 (referralCode 자동 발급)

2. 추천인 코드 입력 시 ReferralEdge 생성
   - referralCode로 추천인 User 조회
   - ReferralEdge { type: REFERRER, parentId: 추천인.id, childId: 신규.id } 생성
   - 필요 시 SPONSOR 엣지 추가 (별도 비즈니스 로직)

3. 제약: 동일 childId + 동일 EdgeType 엣지는 하나만 허용
```

### 수익 캘린더 플로우

```
GET /api/admin/accounting/profit/calendar?year=YYYY&month=MM
- 월간 전체 일자 초기화 (0으로)
- SaleItem(confirmed=true) 일별 집계 → 일별 매출 합산
- PurchaseItem(confirmed=true) 일별 집계 → 일별 매입 합산
- 일별 수익 = 매출 - 매입
```

---

## Enum 정의

### EdgeType (ReferralEdge)

| 값 | 의미 |
|---|---|
| `REFERRER` | 직접 추천인 관계 |
| `SPONSOR` | 스폰서(후원) 관계 |

### KeywordType (SearchKeyword, ExcelMapping, ItemClassification, ItemCategory, ExcelFilter)

| 값 | 의미 |
|---|---|
| `PURCHASE` | 매입 관련 |
| `SALES` | 매출 관련 |

### BoardType (Post)

| 값 | 의미 |
|---|---|
| `NOTICE` | 공지사항 |
| `EVENT` | 이벤트 |
| `SUPPORT` | 고객센터 |

### SupportCategory (Post — SUPPORT 전용)

| 값 | 의미 |
|---|---|
| `QNA` | Q&A (공개 문의) |
| `ONE_TO_ONE` | 1:1 문의 (비공개, 담당자 배정) |

### BodyFormat (Post)

| 값 | 의미 |
|---|---|
| `MARKDOWN` | 마크다운 원문 |
| `HTML` | HTML 원문 (기본값) |

### PostVisibility (Post)

| 값 | 의미 |
|---|---|
| `PUBLIC` | 누구나 열람 가능 |
| `PRIVATE` | 작성자 + 관리자만 열람 가능 |

---

## API 엔드포인트 맵

| 경로 | 메서드 | 최소 레벨 | 설명 |
|---|---|---|---|
| `/api/(site)/auth/signup` | POST | — | 회원가입 |
| `/api/(site)/auth/login` | POST | — | 로그인 |
| `/api/(site)/auth/logout` | POST | — | 로그아웃 |
| `/api/(site)/auth/resolve-user` | GET | — | 현재 세션 사용자 조회 |
| `/api/user/keywords` | GET/POST/DELETE | 로그인 | 개인 검색 키워드 관리 |
| `/api/user/excel-mappings` | GET/POST/PATCH/DELETE | 로그인 | 개인 엑셀 매핑 관리 |
| `/api/admin/accounting/sales/upload` | POST | 21 | 매출 엑셀 업로드 |
| `/api/admin/accounting/sales/create` | POST | 21 | 매출 수동 일괄 생성 |
| `/api/admin/accounting/sales/list` | GET/POST/PATCH/DELETE | 21 | 미확정 매출 목록·수정·삭제 |
| `/api/admin/accounting/sales/confirm` | POST | 21 | 매출 확정 (dedup 포함) |
| `/api/admin/accounting/sales/analysis` | GET/DELETE | 10(GET)/21(DELETE) | 확정 매출 분석·삭제 |
| `/api/admin/accounting/purchase/upload` | POST | 21 | 매입 엑셀 업로드 |
| `/api/admin/accounting/purchase/create` | POST | 21 | 매입 수동 일괄 생성 |
| `/api/admin/accounting/purchase/list` | GET/POST/PATCH/DELETE | 21 | 미확정 매입 목록·수정·삭제 |
| `/api/admin/accounting/purchase/confirm` | POST | 21 | 매입 확정 |
| `/api/admin/accounting/purchase/analysis` | GET/DELETE | 10(GET)/21(DELETE) | 확정 매입 분석·삭제 |
| `/api/admin/accounting/profit/calendar` | GET | 10 | 월간 수익 캘린더 |
| `/api/admin/accounting/profit/period` | GET | 10 | 기간별 일별 수익 통계 |
| `/api/admin/accounting/profit/detail` | GET | 10 | 특정일 매출·매입 상세 |
| `/api/admin/accounting/profit/settlement` | GET/POST | 10(GET)/20(POST) | 정산 조회·저장 |
| `/api/admin/accounting/stats` | GET | 21 | 기간 매출·매입·수익 요약 |
| `/api/admin/accounting/categories` | GET/POST/DELETE | 21 | 분류 마스터 관리 |
| `/api/admin/accounting/items` | GET/POST/DELETE | 21 | 품목 분류 규칙 관리 |
| `/api/admin/accounting/filters` | GET/POST/DELETE | 21 | 전역 엑셀 필터 관리 |
| `/api/admin/boards/announcements` | GET/POST/PATCH/DELETE | 21 | 공지사항 관리 |
| `/api/admin/boards/events` | GET/POST/PATCH/DELETE | 21 | 이벤트 관리 |
| `/api/admin/users/list` | GET | 21 | 회원 목록 조회 |
| `/api/(site)/boards/announcements` | GET | — | 공개 공지사항 목록 |
