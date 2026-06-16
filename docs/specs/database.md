<!-- Last updated: 2026-06-17 -->

# seolgiok 데이터베이스 명세

## 연결 설정

| 항목 | 값 |
|---|---|
| 프로바이더 | PostgreSQL |
| 클라이언트 출력 경로 | `src/generated/prisma` |
| Zod 스키마 출력 경로 | `src/generated/zod` |
| PostgreSQL 확장 | `citext` (대소문자 무시 텍스트 비교) |
| Preview Feature | `postgresqlExtensions` |

환경 변수:
- `DATABASE_URL` — PostgreSQL 연결 문자열 (Railway 제공)

런타임 어댑터: `@prisma/adapter-pg` (PrismaPg + pg.Pool) — seed.ts 및 프로덕션 사용

---

## 스키마 파일 구조

```
prisma/schema/
├─ Base.prisma          — generator·datasource 선언
├─ User.prisma          — User, UserInfo, SearchKeyword, ExcelMapping + KeywordType enum
├─ ReferralEdge.prisma  — ReferralEdge + EdgeType enum
├─ Board.prisma         — Post, SupportAssignment, Attachment, Comment + 4개 enum
├─ Sales.prisma         — DailySales, CardTransaction, SaleItem
├─ Purchase.prisma      — PurchaseItem
├─ Item.prisma          — ItemClassification, ItemCategory, ExcelFilter
├─ Profit.prisma        — Settlement
└─ Country.prisma       — Country
```

총 모델 수: **17개**  
총 Enum 수: **7개**

---

## 모델 명세

### User

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| username | String | @unique, @db.Citext | — | 로그인 ID (대소문자 무시) |
| email | String | @unique, @db.Citext | — | 이메일 (대소문자 무시) |
| name | String | — | — | 표시 이름 |
| passwordHash | String | — | — | bcrypt 해시 비밀번호 |
| countryCode | String? | @db.Char(2), FK→Country.code | — | 국가 코드 (nullable) |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

관계:
- `country` → Country (N:1, onDelete: SetNull)
- `downlines` → ReferralEdge[] ("EdgeParent" — 내가 상위인 엣지)
- `uplines` → ReferralEdge[] ("EdgeChild" — 내가 하위인 엣지)
- `info` → UserInfo? (1:1, "User_UserInfo")
- `postsAuthored` → Post[] ("PostAuthor")
- `commentsAuthored` → Comment[] ("CommentAuthor")
- `ticketAssignments` → SupportAssignment[] ("TicketAssignee")
- `searchKeywords` → SearchKeyword[]
- `excelMappings` → ExcelMapping[]

인덱스:
- `@@index([countryCode])`
- `@@index([createdAt])`

---

### UserInfo

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| userId | String | @unique | — | FK→User.id |
| referralCode | String | @unique | — | 추천인 코드 |
| level | Int | — | 1 | 회원 등급 (≥21이면 관리자로 취급) |
| googleOtpEnabled | Boolean | — | false | Google OTP 활성화 여부 |
| googleOtpSecret | String? | — | — | Google OTP 시크릿 (AES 암호화 저장 권장) |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

관계:
- `user` → User (1:1, "User_UserInfo", onDelete: Cascade, onUpdate: Cascade)

비고: `level >= 21` → 관리자 계정으로 간주 (seed.ts 참조)

---

### Country

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| code | String | @id, @db.Char(2) | — | ISO 3166-1 alpha-2 국가 코드 (PK) |
| name | String | — | — | 국가명 |

관계:
- `users` → User[] (역방향, 1:N)

---

### SearchKeyword

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| userId | String | FK→User.id | — | 소유 사용자 |
| keyword | String | — | — | 검색 키워드 |
| type | KeywordType | — | — | PURCHASE 또는 SALES |
| createdAt | DateTime | — | now() | 생성 시각 |

관계:
- `user` → User (N:1, onDelete: Cascade)

인덱스:
- `@@index([userId, type])`

---

### ExcelMapping

엑셀 업로드 시 컬럼 매핑 설정을 저장하는 모델 (사용자별 다중 매핑 가능).

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| userId | String | FK→User.id | — | 소유 사용자 |
| name | String | — | — | 매핑 이름 (예: "KB Card", "Shinhan Bank") |
| type | KeywordType | — | — | PURCHASE 또는 SALES |
| colDate | String | — | — | 날짜 컬럼명 |
| colItem | String | — | — | 품목 컬럼명 |
| colAmount | String | — | — | 금액 컬럼명 |
| colCategory | String? | — | — | 분류 컬럼명 |
| colNote | String? | — | — | 비고 컬럼명 |
| colPayment | String? | — | — | 결제수단 컬럼명 (매출 전용) |
| filterExclude | String? | — | — | 제외 필터 패턴 |
| filterInclude | String? | — | — | 포함 필터 패턴 |
| createdAt | DateTime | — | now() | 생성 시각 |

관계:
- `user` → User (N:1, onDelete: Cascade)

인덱스:
- `@@index([userId, type])`

---

### ReferralEdge

추천인 네트워크의 방향성 있는 엣지(간선). REFERRER(추천)와 SPONSOR(후원) 두 종류의 트리를 동시에 관리.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| type | EdgeType | — | — | REFERRER 또는 SPONSOR |
| parentId | String | FK→User.id | — | 상위 노드 (부모) |
| childId | String | FK→User.id | — | 하위 노드 (자식) |
| position | Int? | — | — | 부모 아래에서의 순서 |
| groupNo | Int? | — | — | 그룹 번호 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

관계:
- `parent` → User ("EdgeParent", onDelete: Cascade)
- `child` → User ("EdgeChild", onDelete: Cascade)

인덱스 / 유니크:
- `@@unique([childId, type])` — map: "uniq_direct_parent_per_tree" (하나의 트리에서 자식은 부모가 1명뿐)
- `@@index([parentId, type])`
- `@@index([childId, type])`
- `@@index([parentId, createdAt])` — 최신 하위 가입자 탐색용

---

### Post

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| boardType | BoardType | — | — | NOTICE / EVENT / SUPPORT |
| supportCategory | SupportCategory? | — | — | 고객센터 전용: QNA / ONE_TO_ONE |
| authorId | String | FK→User.id | — | 작성자 |
| visibility | PostVisibility | — | PUBLIC | PUBLIC / PRIVATE |
| title | String | — | — | 제목 |
| bodyFormat | BodyFormat | — | HTML | MARKDOWN / HTML |
| bodyRaw | String | — | — | 에디터 원문 |
| bodyHtml | String | — | — | 서버 sanitize 후 최종 HTML (렌더 전용) |
| isPublished | Boolean | — | false | 공개 여부 |
| publishedAt | DateTime? | — | — | 공개 시각 |
| tags | String[] | — | — | 태그 배열 (GIN 인덱스) |
| viewCount | Int | — | 0 | 조회 수 |
| likeCount | Int | — | 0 | 좋아요 수 |
| eventStartAt | DateTime? | — | — | 이벤트 시작일 (EVENT 전용) |
| eventEndAt | DateTime? | — | — | 이벤트 종료일 (EVENT 전용) |
| bannerUrl | String? | — | — | 배너 이미지 URL (EVENT 전용) |
| ctaLinkUrl | String? | — | — | CTA 링크 (EVENT 전용) |
| sourceUrl | String? | — | — | 외부 기사 원문 URL |
| sourceTitle | String? | — | — | 외부 기사 제목 |
| sourceByline | String? | — | — | 외부 기사 작성자 |
| sourcePublishedAt | DateTime? | — | — | 외부 기사 발행일 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

관계:
- `author` → User ("PostAuthor", onDelete: Restrict)
- `attachments` → Attachment[]
- `comments` → Comment[]
- `assignment` → SupportAssignment? (1:0..1)

인덱스:
- `@@index([boardType, isPublished, publishedAt])` — 목록 조회 최적화
- `@@index([authorId])`
- `@@index([supportCategory])`
- `@@index([visibility])`
- `@@index([sourceUrl])`
- `@@index([tags(ops: ArrayOps)], type: Gin)` — 태그 배열 GIN 인덱스

---

### SupportAssignment

고객센터 1:1 문의의 담당자 배정 정보.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| postId | String | @id, FK→Post.id | — | PK 겸 FK (Post 1:1) |
| assigneeId | String? | FK→User.id | — | 담당자 (nullable) |
| assignedAt | DateTime | — | now() | 배정 시각 |

관계:
- `post` → Post (onDelete: Cascade)
- `assignee` → User? ("TicketAssignee", onDelete: SetNull)

인덱스:
- `@@index([assigneeId])`

---

### Attachment

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| postId | String | FK→Post.id | — | 소속 게시글 |
| fileUrl | String | — | — | 파일 URL |
| fileName | String | — | — | 원본 파일명 |
| fileSize | Int | — | — | 파일 크기 (bytes) |
| createdAt | DateTime | — | now() | 생성 시각 |

관계:
- `post` → Post (onDelete: Cascade)

인덱스:
- `@@index([postId])`

---

### Comment

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| postId | String | FK→Post.id | — | 소속 게시글 |
| authorId | String | FK→User.id | — | 작성자 |
| bodyHtml | String | — | — | 댓글 내용 (HTML) |
| isPrivate | Boolean | — | false | 비공개 여부 |
| createdAt | DateTime | — | now() | 생성 시각 |

관계:
- `post` → Post (onDelete: Cascade)
- `author` → User ("CommentAuthor", onDelete: Restrict)

인덱스:
- `@@index([postId, createdAt])`
- `@@index([authorId])`
- `@@index([isPrivate])`

---

### DailySales

일별 매출/매입 집계 요약 레코드.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| date | DateTime | @unique, @db.Date | — | 집계 날짜 (날짜만, 중복 불가) |
| salesAmount | Int | — | 0 | 당일 총 매출 (KRW 정수) |
| costAmount | Int | — | 0 | 당일 총 매입 (KRW 정수) |
| note | String? | — | — | 비고 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스:
- `@@index([date])`

---

### CardTransaction

카드 거래 내역 레코드.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| date | DateTime | @db.Date | — | 이용일 |
| confirmedAt | DateTime? | @db.Date | — | 확정일 |
| cardName | String | — | — | 카드명 |
| merchant | String | — | — | 가맹점명 |
| bizNo | String? | — | — | 사업자번호 |
| approvalNo | String | — | — | 승인번호 |
| installment | String? | — | — | 할부 개월 |
| amount | Int | — | — | 이용금액 (KRW 정수) |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스 / 유니크:
- `@@index([date])`
- `@@unique([approvalNo, amount])` — 부분 취소 허용을 위해 승인번호+금액 복합 유니크

---

### SaleItem

개별 매출 품목 레코드.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| date | DateTime | @db.Date | — | 매출 일자 |
| category | String? | — | — | 분류 (매장, 배달, 기타 등) |
| itemName | String | — | — | 상품명 |
| amount | Int | — | — | 금액 (KRW 정수) |
| paymentMethod | String? | — | — | 결제수단 (카드, 현금, 이체 등) |
| note | String? | — | — | 비고 |
| confirmed | Boolean | — | false | 확정 여부 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스:
- `@@index([date])`

---

### PurchaseItem

개별 매입 품목 레코드.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| date | DateTime | @db.Date | — | 매입 일자 |
| category | String? | — | — | 분류 (식자재, 비품, 기타 등) |
| itemName | String | — | — | 품목명 |
| amount | Int | — | — | 금액 (KRW 정수) |
| note | String? | — | — | 비고 |
| confirmed | Boolean | — | false | 확정 여부 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스:
- `@@index([date])`

---

### ItemClassification

품목-분류 매핑 마스터. 엑셀 업로드 시 자동 분류에 사용.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| itemName | String | — | — | 품목명 |
| category | String | — | — | 분류명 |
| type | KeywordType | — | — | PURCHASE 또는 SALES |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스:
- `@@index([type])`
- `@@index([itemName])`

---

### ItemCategory

분류 마스터 테이블 (중복 방지).

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| name | String | — | — | 분류명 |
| type | KeywordType | — | — | PURCHASE 또는 SALES |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스 / 유니크:
- `@@unique([name, type])` — 동일 타입에서 분류명 중복 불가
- `@@index([type])`

---

### ExcelFilter

엑셀 파싱 시 전역 포함/제외 필터 키워드 마스터.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| keyword | String | — | — | 필터 키워드 (예: "SK") |
| type | KeywordType | — | — | PURCHASE 또는 SALES |
| isInclude | Boolean | — | false | false=제외 필터, true=포함 필터 |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스 / 유니크:
- `@@unique([keyword, type])` — 동일 타입에서 키워드 중복 불가
- `@@index([type])`

---

### Settlement

정산 레코드. 기간별 현금매출 신고액 및 점장 월세 지원액 관리.

| 필드 | 타입 | 제약조건 | 기본값 | 설명 |
|---|---|---|---|---|
| id | String | @id | cuid() | PK |
| startDate | DateTime | @db.Date | — | 정산 시작일 |
| endDate | DateTime | @db.Date | — | 정산 종료일 |
| reportedCashSales | Int | — | 0 | 현금매출 신고액 (KRW 정수) |
| managerRentSupport | Int | — | 0 | 점장 월세 지원액 (KRW 정수) |
| createdAt | DateTime | — | now() | 생성 시각 |
| updatedAt | DateTime | @updatedAt | — | 수정 시각 |

인덱스 / 유니크:
- `@@unique([startDate, endDate])` — 동일 기간 중복 정산 불가

---

## Enum 정의

### KeywordType

엑셀 매핑·검색 키워드·분류·필터에서 공통 사용.

| 값 | 설명 |
|---|---|
| PURCHASE | 매입 관련 |
| SALES | 매출 관련 |

사용 모델: SearchKeyword, ExcelMapping, ItemClassification, ItemCategory, ExcelFilter

---

### EdgeType

추천인 네트워크의 엣지 종류.

| 값 | 설명 |
|---|---|
| REFERRER | 추천(소개) 관계 트리 |
| SPONSOR | 후원 관계 트리 |

비고: ReferralEdge에서 `@@unique([childId, type])`으로 각 트리별 부모가 1명임을 강제.

---

### BoardType

게시판 종류.

| 값 | 설명 |
|---|---|
| NOTICE | 공지사항 |
| EVENT | 이벤트 |
| SUPPORT | 고객센터 |

---

### SupportCategory

고객센터 게시글의 세부 분류 (boardType=SUPPORT일 때만 유효).

| 값 | 설명 |
|---|---|
| QNA | 일반 Q&A (공개) |
| ONE_TO_ONE | 1:1 문의 (비공개) |

---

### BodyFormat

게시글/댓글 본문 형식.

| 값 | 설명 |
|---|---|
| MARKDOWN | 마크다운 원문 |
| HTML | HTML (기본값, Tiptap 에디터 출력) |

---

### PostVisibility

게시글 열람 권한.

| 값 | 설명 |
|---|---|
| PUBLIC | 누구나 열람 가능 |
| PRIVATE | 작성자 + 관리자만 열람 가능 |

---

### BodyFormat (Comment용)

Comment 모델은 `bodyHtml: String` 필드만 저장하며 별도 enum 없이 HTML 고정.

---

## 관계도 (텍스트 ERD)

```
Country (1) ──────────────── (N) User
                                  │
                    ┌─────────────┼─────────────────┐
                    │             │                  │
                   (1)           (N)                (N)
                UserInfo    ReferralEdge        SearchKeyword
                          (parent/child=User)
                                                ExcelMapping

User ──(작성)──► Post ──► Attachment
                  │
                  ├──► Comment ◄──(작성)── User
                  │
                  └──► SupportAssignment ──(담당)──► User


DailySales          (독립 집계, 외래키 없음)
CardTransaction     (독립, 외래키 없음)
SaleItem            (독립, 외래키 없음)
PurchaseItem        (독립, 외래키 없음)

ItemClassification  (마스터, 외래키 없음)
ItemCategory        (마스터, 외래키 없음)
ExcelFilter         (마스터, 외래키 없음)

Settlement          (독립 정산, 외래키 없음)
```

관계 상세:

```
Country ──1:N──► User
User ──1:1──► UserInfo (Cascade)
User ──1:N──► ReferralEdge (as parent=EdgeParent)
User ──1:N──► ReferralEdge (as child=EdgeChild)
User ──1:N──► SearchKeyword (Cascade)
User ──1:N──► ExcelMapping (Cascade)
User ──1:N──► Post (as author, Restrict)
User ──1:N──► Comment (as author, Restrict)
User ──0:N──► SupportAssignment (as assignee, SetNull)
Post ──1:N──► Attachment (Cascade)
Post ──1:N──► Comment (Cascade)
Post ──1:0..1──► SupportAssignment (Cascade)
```

---

## 마이그레이션 규칙

| 환경 | 명령 | 용도 |
|---|---|---|
| 개발 (스키마 확정) | `npx prisma migrate dev` | 마이그레이션 파일 생성 + DB 적용 |
| 프로토타입 (빠른 반복) | `npx prisma db push` | 마이그레이션 파일 없이 DB 직접 동기화 |
| 프로덕션 | `npx prisma migrate deploy` | 기존 마이그레이션 파일만 순서대로 적용 |
| 클라이언트 재생성 | `npm run generate` | 코드 변경 없이 Prisma Client만 재생성 |
| 시드 실행 | `npm run seed` | `prisma/seed.ts` 실행 (중복 방지 내장) |

> **절대 규칙**: Prisma 스키마 변경은 `db-expert` 에이전트 전담. 운영 DB에 직접 DDL 실행 금지.

마이그레이션 파일 경로: `prisma/migrations/`

---

## 중요 비즈니스 제약

### KRW 정수 금액 필드 목록

부동소수점 사용 금지. 모두 `Int` 타입으로 원화(KRW) 정수 저장.

| 모델 | 필드 |
|---|---|
| DailySales | salesAmount, costAmount |
| CardTransaction | amount |
| SaleItem | amount |
| PurchaseItem | amount |
| Settlement | reportedCashSales, managerRentSupport |

### citext (대소문자 무시) 컬럼 목록

PostgreSQL `citext` 확장을 사용하여 대소문자 구분 없이 비교·조회.

| 모델 | 필드 |
|---|---|
| User | username |
| User | email |

사전 조건: DB에 `citext` 확장 설치 필요 (`CREATE EXTENSION IF NOT EXISTS citext;`)

### @db.Date 컬럼 목록 (날짜만, 시각 없음)

| 모델 | 필드 |
|---|---|
| DailySales | date |
| CardTransaction | date, confirmedAt |
| SaleItem | date |
| PurchaseItem | date |
| Settlement | startDate, endDate |

### onDelete 정책 요약

| 정책 | 적용 케이스 |
|---|---|
| Cascade | UserInfo, SearchKeyword, ExcelMapping, Attachment, Comment, SupportAssignment (post측) |
| Restrict | Post.author, Comment.author (작성자 삭제 전 게시글/댓글 선처리 필요) |
| SetNull | User.country, SupportAssignment.assignee |

### 추천인 트리 무결성 제약

`ReferralEdge.@@unique([childId, type])` — map: `uniq_direct_parent_per_tree`

동일한 트리 유형(REFERRER 또는 SPONSOR)에서 자식 노드는 반드시 부모가 1명뿐임을 DB 레벨에서 강제.
