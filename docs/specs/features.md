<!-- Last updated: 2026-06-17 -->

# seolgiok 기능 명세

> 실제 코드 분석 기반으로 작성된 기능 명세서.
> 소스 위치: `src/app/[locale]/admin/`, `src/app/[locale]/(site)/`, `src/app/api/`, `prisma/schema/`

---

## 관리자 기능

### 1. 대시보드

- **설명**: 이번 달 매출·매입·순수익 요약 카드 + 월별 수익 추이 차트 영역(현재 준비 중) + 최근 활동 목록(더미).
- **페이지 경로**: `/[locale]/admin/dashboard`
- **관련 API**: `GET /api/admin/accounting/stats?from=&to=` (level ≥ 21)
- **관련 DB 모델**: `SaleItem`, `PurchaseItem`
- **비고**: 전체 사용자 수 카드는 하드코딩 더미("1,234") — 실제 연동 미완성.

---

### 2. 매출 관리

#### 2-1. 매출 목록 (업로드 스테이징)

- **설명**: 엑셀 업로드 후 `confirmed=false` 상태인 매출 항목 목록. 키워드 검색(전·반각 자동 확장), 개별 수정·삭제, 일괄 삭제 가능. "키워드 제외 삭제"(`DELETE_EXCEPT`) 동작 지원.
- **페이지 경로**: `/[locale]/admin/sales/list`
- **관련 API**:
  - `GET /api/admin/accounting/sales/list` — 미확정 목록 조회 (level ≥ 21)
  - `POST /api/admin/accounting/sales/list` — 단건 수동 추가 (level ≥ 21)
  - `PATCH /api/admin/accounting/sales/list` — 단건 수정 (level ≥ 21)
  - `DELETE /api/admin/accounting/sales/list` — 단건/다건/키워드제외 삭제 (level ≥ 21)
- **관련 DB 모델**: `SaleItem (confirmed=false)`

#### 2-2. 매출 확정 (Confirm)

- **설명**: 스테이징 항목을 `confirmed=true`로 일괄 전환. 확정 후 매출 분석·정산에 반영.
- **관련 API**: `POST /api/admin/accounting/sales/confirm` (level ≥ 21)
- **관련 DB 모델**: `SaleItem`

#### 2-3. 매출 분석

- **설명**: 확정된 매출 항목을 품목명·카테고리 기준으로 집계. 기간 필터, 카테고리 필터, 키워드 필터 지원. 총 매출액·건수·페이지별 품목별 합계·평균 반환. 기간 내 전체 삭제도 지원.
- **페이지 경로**: `/[locale]/admin/sales/analysis`
- **관련 API**:
  - `GET /api/admin/accounting/sales/analysis` — 품목별 집계 (level ≥ 10)
  - `DELETE /api/admin/accounting/sales/analysis` — 기간 내 전체 삭제 또는 품목명 지정 삭제 (level ≥ 21)
- **관련 DB 모델**: `SaleItem (confirmed=true)`

#### 2-4. 매출 엑셀 업로드

- **설명**: XLSX/XLS 파일 업로드. 비밀번호 암호화 파일 지원(`officecrypto-tool`). 헤더 행 자동 탐색(스코어링). 사용자 커스텀 컬럼 매핑(날짜·품목·금액·분류·결제수단·비고) 적용. 필터 모드(ALL/EXCLUDE/INCLUDE). 아이템 자동 분류(`ItemClassification` 규칙 적용). 업로드 시 기존 미확정 항목 전체 삭제 후 재삽입.
- **관련 API**: `POST /api/admin/accounting/sales/upload` (level ≥ 21)
- **지원 날짜 포맷**: Excel 시리얼 숫자, Date 객체, "YYYY년 MM월 DD일", ISO 문자열
- **관련 DB 모델**: `SaleItem`, `ItemClassification (SALES)`, `ExcelFilter (SALES)`

---

### 3. 매입 관리

#### 3-1. 매입 목록 (업로드 스테이징)

- **설명**: 엑셀 업로드 후 `confirmed=false` 상태인 매입 항목 목록. 키워드 검색(전·반각 확장), 개별 수정·삭제, 키워드 제외 삭제 지원.
- **페이지 경로**: `/[locale]/admin/purchase/list`
- **관련 API**:
  - `GET /api/admin/accounting/purchase/list` — 미확정 목록 조회 (level ≥ 21)
  - `POST /api/admin/accounting/purchase/list` — 단건 수동 추가 (level ≥ 21)
  - `PATCH /api/admin/accounting/purchase/list` — 단건 수정 (level ≥ 21)
  - `DELETE /api/admin/accounting/purchase/list` — 단건/다건/키워드제외 삭제 (level ≥ 21)
- **관련 DB 모델**: `PurchaseItem (confirmed=false)`

#### 3-2. 매입 확정 (Confirm)

- **설명**: 스테이징 항목을 `confirmed=true`로 일괄 전환.
- **관련 API**: `POST /api/admin/accounting/purchase/confirm` (level ≥ 21)
- **관련 DB 모델**: `PurchaseItem`

#### 3-3. 매입 분석

- **설명**: 확정된 매입 항목의 기간별·카테고리별 집계 조회.
- **페이지 경로**: `/[locale]/admin/purchase/analysis`
- **관련 API**: `GET /api/admin/accounting/purchase/analysis` (level ≥ 10)
- **관련 DB 모델**: `PurchaseItem (confirmed=true)`

#### 3-4. 매입 엑셀 업로드

- **설명**: 매출 업로드와 동일한 구조. 비밀번호 암호화 지원. 헤더 자동 탐색. 커스텀 컬럼 매핑(날짜·품목·금액·분류·비고). 필터 모드(ALL/EXCLUDE/INCLUDE). 아이템 자동 분류(`ItemClassification` 규칙, 더 긴 키워드 우선 적용). 기존 미확정 항목 전체 삭제 후 재삽입.
- **관련 API**: `POST /api/admin/accounting/purchase/upload` (level ≥ 21)
- **관련 DB 모델**: `PurchaseItem`, `ItemClassification (PURCHASE)`, `ExcelFilter (PURCHASE)`

---

### 4. 손익(수익) 분석

#### 4-1. 기간별 손익

- **설명**: 지정 기간의 일별 매출·매입·손익을 집계하여 일 단위 배열로 반환. 합계(총 매출, 총 매입, 총 손익) 포함.
- **페이지 경로**: `/[locale]/admin/profit/period`
- **관련 API**: `GET /api/admin/accounting/profit/period?startDate=&endDate=` (level ≥ 10)
- **관련 DB 모델**: `SaleItem (confirmed=true)`, `PurchaseItem (confirmed=true)`
- **계산식**: `일 손익 = 일 매출 합 - 일 매입 합`

#### 4-2. 월별 캘린더

- **설명**: 지정 년·월의 일별 매출·매입·손익을 달력 형태로 반환.
- **관련 API**: `GET /api/admin/accounting/profit/calendar?year=&month=` (level ≥ 10)
- **관련 DB 모델**: `SaleItem (confirmed=true)`, `PurchaseItem (confirmed=true)`

#### 4-3. 상세 조회

- **설명**: 특정 날짜의 매출·매입 상세 내역 조회.
- **관련 API**: `GET /api/admin/accounting/profit/detail` (level ≥ 10)

#### 4-4. 정산

- **설명**: 지정 기간의 부가세 정산 계산. 현금매출 신고액(수동 입력) 저장/조회 가능. 카드매출·현금매출·총 매출·총 매입·세금/인건비 제외 항목 계산 후 매출 부가세·매입 부가세·실제 납부 부가세·순수익 반환.
- **페이지 경로**: `/[locale]/admin/profit/settlement`
- **관련 API**:
  - `GET /api/admin/accounting/profit/settlement?startDate=&endDate=` (level ≥ 10)
  - `POST /api/admin/accounting/profit/settlement` — 현금매출 신고액 저장 (level ≥ 20)
- **관련 DB 모델**: `Settlement`, `SaleItem (confirmed=true)`, `PurchaseItem (confirmed=true)`
- **계산식 (코드 확인)**:
  ```
  카드매출 = 총 매출 - 현금매출(DB)
  vatSalesBase = 카드매출 + 현금매출신고액
  vatPurchaseBase = 총 매입 - 제외항목(세금, 인건비(프리), 인건비(사대))
  매출부가세 = round(vatSalesBase × 0.1)
  매입부가세 = round(vatPurchaseBase × 0.1)
  실납부부가세 = 매출부가세 - 매입부가세
  순수익 = 총 매출 - 총 매입 - 실납부부가세
  ```

---

### 5. 아이템 관리

#### 5-1. 품목 자동 분류 규칙

- **설명**: 엑셀 업로드 시 품목명 키워드로 카테고리를 자동 지정하는 규칙 CRUD. 품목명·카테고리로 규칙 등록(여러 줄 일괄 입력). 분류 삭제 시 해당 분류를 사용하는 규칙도 연쇄 삭제.
- **페이지 경로**: `/[locale]/admin/items`
- **관련 API**:
  - `GET /api/admin/accounting/items?type=` (level ≥ 21)
  - `POST /api/admin/accounting/items` — "품목명 : 카테고리" 또는 탭 구분자 형식으로 일괄 등록 (level ≥ 21)
  - `DELETE /api/admin/accounting/items` — 단건 또는 카테고리 일괄 삭제 (level ≥ 21)
- **관련 DB 모델**: `ItemClassification`
- **비고**: 매출 품목 탭은 UI에서 "준비 중" 표시 (매입 품목만 활성)

#### 5-2. 카테고리 관리

- **설명**: 매입/매출 타입별 카테고리 명시적 등록·삭제. 규칙에서 파생된 암묵적 카테고리와 DB에 저장된 명시적 카테고리를 통합 표시.
- **관련 API**:
  - `GET /api/admin/accounting/categories?type=` (level ≥ 21)
  - `POST /api/admin/accounting/categories` (level ≥ 21)
  - `DELETE /api/admin/accounting/categories?id=` (level ≥ 21)
- **관련 DB 모델**: `ItemCategory`

#### 5-3. 엑셀 전역 필터 설정

- **설명**: 엑셀 업로드 시 전역 적용되는 포함/제외 키워드 관리. 매입·매출 각각 별도 필터 세트 운영.
- **페이지 경로**: `/[locale]/admin/items/filters`
- **관련 API**:
  - `GET /api/admin/accounting/filters?type=` (level ≥ 10)
  - `POST /api/admin/accounting/filters` (level ≥ 21)
  - `DELETE /api/admin/accounting/filters?id=` (level ≥ 21)
- **관련 DB 모델**: `ExcelFilter`

---

### 6. 게시판 관리

#### 6-1. 공지사항 관리

- **설명**: 공지 게시글 CRUD. 목록 조회, 단건 상세 조회, 생성, 수정, 일괄 삭제. 공개/비공개 설정, 발행/미발행 상태 관리. 에디터는 Tiptap 기반 HTML. HTML sanitize 적용.
- **페이지 경로**: `/[locale]/admin/boards/announcements`, `/[locale]/admin/boards/announcements/new`
- **관련 API**:
  - `GET /api/admin/boards/announcements` — 목록/단건 (인증 불필요)
  - `POST /api/admin/boards/announcements` — 생성 (인증 필요)
  - `PATCH /api/admin/boards/announcements` — 수정 (인증 필요)
  - `DELETE /api/admin/boards/announcements` — 일괄 삭제 (인증 필요)
- **관련 DB 모델**: `Post (boardType=NOTICE)`, `Attachment`, `Comment`

#### 6-2. 이벤트 관리

- **설명**: 이벤트 게시글 CRUD. 이벤트 시작·종료일, 배너 URL, CTA 링크 지원.
- **페이지 경로**: `/[locale]/admin/boards/events`, `/[locale]/admin/boards/events/new`
- **관련 API**: `GET/POST/PATCH/DELETE /api/admin/boards/events`
- **관련 DB 모델**: `Post (boardType=EVENT)`, `Attachment`, `Comment`

---

### 7. 회원 관리

#### 7-1. 회원 목록

- **설명**: 관리자 본인 및 BFS로 수집한 모든 하위(산하) 회원 목록 조회(페이지네이션). 최대 탐색 깊이 20, 라운드당 최대 5000건. 회원별 UserInfo(레벨, 추천 코드, OTP 활성화 여부) 상세 조회 가능.
- **페이지 경로**: `/[locale]/admin/users/list`
- **관련 API**:
  - `GET /api/admin/users/list` — 목록 또는 단건 상세 (로그인 필요)
  - `PATCH /api/admin/users/list` — 회원 레벨 수정 (산하 회원만 가능)
- **관련 DB 모델**: `User`, `UserInfo`, `ReferralEdge`

#### 7-2. 추천인 트리

- **설명**: 추천인 네트워크를 트리 구조로 시각화하는 페이지 (UI skeleton만 존재, 실제 구현 미완성).
- **페이지 경로**: `/[locale]/admin/users/tree`
- **관련 DB 모델**: `ReferralEdge (REFERRER/SPONSOR)`

---

## 공개 사이트 기능

### 1. 홈

- **설명**: 설기옥 브랜드 메인 페이지. 낮/밤 전환 헤로 이미지, 브랜드 소개. 그랜드 오프닝 팝업. FAQ JSON-LD 스키마(SEO).
- **페이지 경로**: `/[locale]/` (홈)
- **관련 DB 모델**: 없음 (정적)

### 2. 브랜드 소개 (About)

- **설명**: 설기옥의 스토리, 핵심 가치 3가지 소개. 메뉴·위치 페이지 CTA 버튼 포함.
- **페이지 경로**: `/[locale]/about`
- **관련 DB 모델**: 없음 (정적)

### 3. 메뉴

- **설명**: `public/menu/` 디렉터리의 이미지 파일을 동적으로 목록화하여 갤러리 형태로 표시. 이미지 확대(Zoom) 기능. 특정 파일 제외 처리(갈비찜.png 등 4종 하드코딩 제외).
- **페이지 경로**: `/[locale]/menu`
- **관련 DB 모델**: 없음 (파일 시스템)

### 4. 위치 안내 (Location)

- **설명**: 네이버 지도 임베드. 주소 복사 버튼. 영업시간(평일/주말/연중무휴), 전화번호, 주차 정보 표시. 네이버 지도 외부 링크.
- **페이지 경로**: `/[locale]/location`
- **관련 DB 모델**: 없음 (정적, i18n 번역 키)

### 5. 공지사항 목록

- **설명**: `isPublished=true`, `visibility=PUBLIC` 공지 게시글을 최신 발행일 순으로 목록 표시. JSON-LD 구조화 데이터 포함.
- **페이지 경로**: `/[locale]/announcements`
- **공개 API**: `GET /api/(site)/boards/announcements`
- **관련 DB 모델**: `Post (boardType=NOTICE, isPublished=true, visibility=PUBLIC)`

### 6. 공지사항 상세

- **설명**: 공지 게시글 단건 상세 페이지.
- **페이지 경로**: `/[locale]/announcements/[id]`
- **관련 DB 모델**: `Post`

### 7. 회원가입

- **설명**: 이메일·비밀번호·이름 기반 회원가입. 약관·개인정보처리방침 동의 필수. 비밀번호 규칙: 8~18자, 영문+숫자+대문자+특수문자 조합. 가입 시 UserInfo(레벨=1) 및 추천코드 자동 생성.
- **페이지 경로**: `/[locale]/auth/signup`
- **관련 API**: `POST /api/(site)/auth/signup`
- **관련 DB 모델**: `User`, `UserInfo`

### 8. 로그인

- **설명**: 이메일/비밀번호 기반 NextAuth 5 세션 인증.
- **페이지 경로**: `/[locale]/auth/login`
- **관련 API**: `POST /api/(site)/auth/login`, `GET /api/(site)/auth/[...nextauth]`
- **관련 DB 모델**: `User`

### 9. 로그아웃

- **관련 API**: `POST /api/(site)/auth/logout`

### 10. 개인정보처리방침

- **설명**: 정적 페이지. 개인정보 보호책임자, 보유 기간, 수집 항목 등 법정 고지 내용.
- **페이지 경로**: `/[locale]/privacy`
- **관련 DB 모델**: 없음

### 11. 이용약관

- **페이지 경로**: `/[locale]/terms`
- **관련 DB 모델**: 없음

---

## 사용자(개인) API 기능

### 1. 검색 키워드 관리

- **설명**: 로그인한 사용자 개인의 검색 키워드 저장(매입/매출 타입 구분). 동일 키워드 재등록 시 `createdAt` 갱신(최신순 정렬용).
- **관련 API**:
  - `GET /api/user/keywords?type=` — 본인 키워드 목록
  - `POST /api/user/keywords` — 키워드 추가
  - `DELETE /api/user/keywords?id=` — 키워드 삭제 (소유권 검증)
- **관련 DB 모델**: `SearchKeyword`

### 2. 엑셀 매핑 프리셋 관리

- **설명**: 사용자 개인의 엑셀 컬럼 매핑 프리셋 저장·조회·삭제. 프리셋 이름, 타입(매입/매출), 날짜·품목·금액·분류·비고·결제수단 컬럼명, 포함/제외 필터 키워드 저장.
- **관련 API**:
  - `GET /api/user/excel-mappings?type=` — 본인 프리셋 목록
  - `POST /api/user/excel-mappings` — 프리셋 저장
  - `DELETE /api/user/excel-mappings?id=` — 프리셋 삭제 (소유권 검증)
- **관련 DB 모델**: `ExcelMapping`

---

## 비즈니스 규칙

### 권한 레벨

| 레벨 | 부여 시점 | 접근 가능 범위 |
|------|-----------|---------------|
| 1 | 회원가입 시 기본값 | 로그인된 사용자 공통 기능 (키워드·엑셀매핑 관리) |
| 10 | 관리자 승급 | 매출·매입 분석 조회, 손익 캘린더/기간/정산 조회, 엑셀 필터 조회 |
| 20 | 관리자 승급 | level 10 + 정산 현금매출 신고액 저장 |
| 21 | 최고 관리자 | level 20 + 엑셀 업로드, 매출·매입 목록 편집/삭제/확정, 품목 규칙·카테고리·필터 CW, 회계 통계 조회 |

- 레벨 수정: `PATCH /api/admin/users/list` — 관리자 자신 또는 BFS 산하 회원만 변경 가능.

### 금액 규칙

- **KRW 정수 전용**: DB 컬럼 타입 `Int`, 연산 시 `Math.round()` 사용.
- 부동소수점 직접 연산 금지 (예: 부가세 = `Math.round(base * 0.1)`).

### 정산 제외 카테고리

부가세 매입 계산 시 아래 카테고리는 과세 표준에서 제외:
- `세금`
- `인건비(프리)`
- `인건비(사대)`

### 추천인 네트워크 규칙

- `ReferralEdge` 엣지 타입: `REFERRER` (추천인), `SPONSOR` (후원인)
- `childId + type` 복합 유니크 제약 → 동일 사람이 동일 트리에서 부모를 1명만 가질 수 있음.
- 회원 목록 조회: BFS 방식으로 최대 20뎁스, 라운드당 5000건 탐색.

### 추천 코드 생성 규칙

- 형식: `[사용자명 앞 4자 대문자(영숫자, 부족 시 X로 패딩)][랜덤 6자 16진수 대문자]`
- 중복 시 최대 5회 재생성.

### 엑셀 업로드 규칙

- 업로드 시 기존 `confirmed=false` 항목 전체 삭제 후 재삽입 (덮어쓰기).
- 헤더 행 자동 탐색: 최대 100행 스캔, 스코어링 시스템으로 최적 행 선택.
- 날짜 파싱 순서: Date 객체 → Excel 시리얼 → "YYYY년 MM월 DD일" → ISO 문자열.
- 금액 0인 행 자동 스킵.
- 필터 모드:
  - `EXCLUDE` (기본): 제외 키워드와 일치하는 행 스킵
  - `INCLUDE`: 포함 키워드와 일치하는 행만 통과
  - `ALL`: 필터 미적용

---

## 엑셀 업로드 상세

### 지원 파일 포맷

- `.xlsx`, `.xls` (XLSX 라이브러리로 파싱)
- 암호화된 Office 파일 지원 (`officecrypto-tool` 복호화 후 파싱)

### 컬럼 매핑 방식

| 우선순위 | 방법 | 설명 |
|---------|------|------|
| 1 | 사용자 커스텀 매핑 | ExcelMapping 프리셋 또는 업로드 폼 직접 입력 |
| 2 | 기본 키워드 | 코드 내 하드코딩된 기본 헤더 키워드 |

**매출 업로드 기본 키워드:**

| 컬럼 | 기본 인식 키워드 |
|------|----------------|
| 날짜 | date, 일자, 날짜, 시간, 거래일시 |
| 품목 | item, name, 품목, 상품, 내역, 적요, 보낸분/받는분, 출금표시내용, 가맹점명, 기재내용, 상호명 |
| 금액 | amount, price, cost, 금액, 가격, 입금액, 승인금액, 이용금액, 맡기신금액 |
| 분류 | category, type, 분류, 구분, 적요 |
| 결제수단 | payment, method, 결제, 카드, 수단, 지불, 입금통장 |
| 비고 | note, memo, 비고, 메모 |

**매입 업로드 기본 키워드:**

| 컬럼 | 기본 인식 키워드 |
|------|----------------|
| 날짜 | date, 일자, 날짜, 시간, 거래일시 |
| 품목 | item, name, 품목, 상품, 내역, 적요, 보낸분/받는분, 가맹점명, 기재내용, 상호명 |
| 금액 | amount, price, cost, 금액, 가격, 출금액, 이용금액, 결제금액 |
| 분류 | category, type, 분류, 구분, 분야 |
| 비고 | note, memo, 비고, 메모, 송금메모, 카드명 |

### 아이템 자동 분류 적용 순서

1. `ItemClassification` 규칙 테이블 조회 (해당 타입)
2. 매입 업로드: 규칙을 키워드 길이 내림차순 정렬 → 더 구체적인 규칙 우선 매칭
3. 품목명(normalizedItemName) 또는 카테고리(normalizedCategory)에 키워드 포함 여부 확인
4. 일치 시 해당 카테고리 적용, 불일치 시 엑셀 원본 카테고리 또는 "기타"

---

---

## API 라우트 권한 테이블 (29개)

> 세션 = NextAuth 로그인 필요 (level 무관). Level N = `session.user.level >= N` 조건.

| 경로 | 메서드 | 최소 조건 | 설명 |
|---|---|---|---|
| `/api/(site)/auth/login` | POST | 없음 | 로그인 |
| `/api/(site)/auth/logout` | POST | 없음 | 로그아웃 |
| `/api/(site)/auth/signup` | POST | 없음 | 회원가입 |
| `/api/(site)/auth/resolve-user` | GET | 없음 | 사용자 조회 |
| `/api/(site)/auth/[...nextauth]` | ANY | 없음 | NextAuth OAuth 콜백 |
| `/api/(site)/boards/announcements` | GET | 없음 | 공개 공지 목록 |
| `/api/user/keywords` | GET/POST/DELETE | 세션 | 개인 검색 키워드 |
| `/api/user/excel-mappings` | GET/POST/DELETE | 세션 | 개인 엑셀 매핑 프리셋 |
| `/api/admin/accounting/sales/list` | GET/POST/PATCH/DELETE | Level 21 | 매출 미확정 목록 |
| `/api/admin/accounting/sales/create` | POST | Level 21 | 매출 수동 입력 |
| `/api/admin/accounting/sales/upload` | POST | Level 21 | 매출 엑셀 업로드 |
| `/api/admin/accounting/sales/confirm` | POST | Level 21 | 매출 일괄 확정 |
| `/api/admin/accounting/sales/analysis` | GET | Level 10 | 매출 분석 조회 |
| `/api/admin/accounting/sales/analysis` | DELETE | Level 21 | 매출 기간 삭제 |
| `/api/admin/accounting/purchase/list` | GET/POST/PATCH/DELETE | Level 21 | 매입 미확정 목록 |
| `/api/admin/accounting/purchase/create` | POST | Level 21 | 매입 수동 입력 |
| `/api/admin/accounting/purchase/upload` | POST | Level 21 | 매입 엑셀 업로드 |
| `/api/admin/accounting/purchase/confirm` | POST | Level 21 | 매입 일괄 확정 |
| `/api/admin/accounting/purchase/analysis` | GET | Level 10 | 매입 분석 조회 |
| `/api/admin/accounting/profit/settlement` | GET | Level 10 | 정산 VAT 계산 조회 |
| `/api/admin/accounting/profit/settlement` | POST | Level 20 | 현금매출 신고액 저장 |
| `/api/admin/accounting/profit/detail` | GET | Level 10 | 일별 매출·매입 상세 |
| `/api/admin/accounting/profit/period` | GET | Level 10 | 기간별 수익 집계 |
| `/api/admin/accounting/profit/calendar` | GET | Level 10 | 월별 캘린더 |
| `/api/admin/accounting/items` | GET/POST/DELETE | Level 21 | 품목 분류 규칙 CRUD |
| `/api/admin/accounting/categories` | GET/POST/DELETE | Level 21 | 카테고리 CRUD |
| `/api/admin/accounting/filters` | GET | Level 10 | 엑셀 전역 필터 조회 |
| `/api/admin/accounting/filters` | POST/DELETE | Level 21 | 엑셀 전역 필터 CUD |
| `/api/admin/accounting/stats` | GET | Level 21 | 대시보드 통계 |
| `/api/admin/boards/announcements` | GET | 없음 | 공지 목록/상세 |
| `/api/admin/boards/announcements` | POST/PATCH/DELETE | 세션 | 공지 생성/수정/삭제 |
| `/api/admin/boards/events` | GET | 없음 | 이벤트 목록/상세 |
| `/api/admin/boards/events` | POST/PATCH/DELETE | 세션 | 이벤트 생성/수정/삭제 |
| `/api/admin/users/list` | GET/PATCH | 세션 (BFS 산하만) | 사용자 목록 조회 / 레벨 수정 |

> **Level 검사 구현**: 각 API 핸들러에서 `const session = await auth()` 후 `session.user.level >= N` 확인.
> `authorized` 콜백(auth.config.ts)은 **페이지** 접근만 제어, API 레벨 검사는 각 핸들러 담당.

---

## 미구현 / 예정 기능

| 기능 | 위치 | 상태 |
|------|------|------|
| 추천인 트리 시각화 | `/[locale]/admin/users/tree/page.tsx` | UI skeleton만 존재 (placeholder 텍스트) |
| 대시보드 월별 수익 추이 차트 | `/[locale]/admin/dashboard/page.tsx` | "차트 영역 (준비 중)" 표시 |
| 대시보드 전체 사용자 수 | `/[locale]/admin/dashboard/page.tsx` | 하드코딩 더미값 "1,234" |
| 대시보드 최근 활동 | `/[locale]/admin/dashboard/page.tsx` | 하드코딩 더미 리스트 |
| 매출 품목 자동 분류 | `/[locale]/admin/items/page.tsx` | UI에서 "준비중" 표시 (탭 비활성) |
| 게시판 고객지원(SUPPORT) | `Board.prisma` | 스키마 정의됨 (`BoardType.SUPPORT`, `SupportCategory: QNA/ONE_TO_ONE`), 관리자 API/페이지 미구현 |
| 댓글 기능 | `Board.prisma` | `Comment` 모델 정의됨, 공개 사이트·관리자 UI 미구현 |
| 첨부파일 기능 | `Board.prisma` | `Attachment` 모델 정의됨, 실제 파일 업로드 UI 미구현 |
| 고객지원 담당자 배정 | `Board.prisma` | `SupportAssignment` 모델 정의됨, 관리자 API 미구현 |
| Google OTP / 2FA | `UserInfo.prisma` | 스키마 필드 존재 (`googleOtpEnabled`, `googleOtpSecret`), 인증 흐름 미구현 |
| DailySales | `Sales.prisma` | 모델 정의됨, 관련 API 없음 (구버전 시스템 잔재) |
| 리포트 다운로드 | `/[locale]/admin/dashboard` | 버튼만 존재, 동작 없음 |
