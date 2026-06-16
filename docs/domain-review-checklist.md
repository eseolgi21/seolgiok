<!-- Last updated: 2026-06-17 -->
<!-- 소유 에이전트: domain-expert -->

# seolgiok 도메인 리뷰 체크리스트

`domain-expert` 에이전트가 diff 검토 시작 전 반드시 Read하는 파일이다.

---

## seolgiok 도메인 배경

### 핵심 엔티티

| 엔티티 | 파일 | 역할 |
|---|---|---|
| `User` | `prisma/schema/User.prisma` | 계정 (citext username·email, passwordHash, bcrypt) |
| `UserInfo` | `prisma/schema/User.prisma` | 사용자 메타 (level 1/10/20/21, referralCode, googleOtpSecret) |
| `ReferralEdge` | `prisma/schema/ReferralEdge.prisma` | 추천인 관계 (type: REFERRER\|SPONSOR) |
| `DailySales` | `prisma/schema/Sales.prisma` | 일별 매출 합계 (레거시, 현재 미사용) |
| `CardTransaction` | `prisma/schema/Sales.prisma` | 카드 거래 내역 |
| `SaleItem` | `prisma/schema/Sales.prisma` | 개별 매출 항목 (confirmed boolean) |
| `PurchaseItem` | `prisma/schema/Purchase.prisma` | 개별 매입 항목 (confirmed boolean) |
| `Settlement` | `prisma/schema/Profit.prisma` | 부가세 정산 기록 |
| `ItemClassification` | `prisma/schema/Item.prisma` | 엑셀 자동분류 규칙 |

### 핵심 불변식

1. **KRW 정수**: 모든 금액 필드는 `Int`. `float` 직접 연산 절대 금지. `Math.round()` 필수.
2. **confirmed 단방향**: `false → true` 전환만 허용. `true → false` 불가 (재업로드 시 기존 `confirmed=false` 전체 삭제 후 신규 삽입).
3. **추천인 순환 금지**: `ReferralEdge`에서 A→B→C→A 사이클 생성 금지.
4. **INVALID_CREDENTIALS 단일 코드**: 로그인 실패 시 유일한 에러 코드 (`USER_NOT_FOUND`/`INVALID_PASSWORD` 폐기됨).
5. **5개 로케일 동시성**: UI 텍스트 추가 시 en/ja/ko/vi/zh 모두 갱신.

### VAT 계산 공식 (`api/admin/accounting/profit/settlement/route.ts`)

```typescript
const cardSales       = totalSales - cashSales;
const vatSalesBase    = cardSales + reportedCashSales;     // 부가세 과세 매출
const vatPurchaseBase = totalPurchase - excludedItems;     // 세금·인건비(프리)·인건비(사대) 제외
const salesVAT        = Math.round(vatSalesBase * 0.1);
const purchaseVAT     = Math.round(vatPurchaseBase * 0.1);
const actualVAT       = salesVAT - purchaseVAT;
const netProfit       = totalSales - totalPurchase - actualVAT;
```

---

## 리뷰 체크리스트

### 정확성 (회계 도메인)

- [ ] 금액이 KRW 정수인지 — `float`·`number` 직접 연산 금지, 부동소수점 오차 없는지
- [ ] `DailySales`·`CardTransaction`·`SaleItem`·`PurchaseItem` 금액 합산 로직 정확성
- [ ] Settlement 기간(`startDate`~`endDate`) 경계 포함/제외 일관성
- [ ] 경계값 처리 (0원, 음수 매출, null 날짜)
- [ ] VAT 계산식에서 정산 제외 카테고리(`세금`, `인건비(프리)`, `인건비(사대)`) 모두 제외됐는지

### 도메인 규칙

- [ ] 추천인 네트워크: `ReferralEdge` 엣지 타입이 `REFERRER` 또는 `SPONSOR` 중 하나인지
- [ ] 추천인 순환 참조 방지 — parent-child 사이클 검증 여부
- [ ] `confirmed` 상태 전환: `true → false` 전환 코드가 없는지 (단방향 강제)
- [ ] `ExcelMapping`·`ExcelFilter`: 필터 `include`/`exclude` 우선순위 일관성
- [ ] `ItemClassification` category 매핑이 `PURCHASE`/`SALES` 타입 규칙 준수
- [ ] 엑셀 업로드 시 기존 `confirmed=false` 항목 전체 삭제 후 재삽입하는지 (멱등성)
- [ ] 문자열 정규화: 엑셀 키워드 매칭 시 `toHalfWidth()` / `getSearchVariants()` 사용 여부

### 다국어 (i18n)

- [ ] 사용자 노출 문자열이 `next-intl` 키로 처리되는지 — 하드코딩 금지
- [ ] 5개 로케일(en, ja, ko, vi, zh) 모두 번역 키 존재하는지
- [ ] `[locale]` 세그먼트 없는 경로로 직접 링크하지 않는지

### 보안 (seolgiok 특화)

- [ ] 관리자 API(`/api/admin/*`)에 NextAuth 세션 인증 적용 여부
- [ ] 로그인 실패 코드가 `INVALID_CREDENTIALS` 단일 코드인지 (`USER_NOT_FOUND`/`INVALID_PASSWORD` 사용 금지)
- [ ] AES 암복호화는 `src/lib/crypto.ts` 경유만 사용
- [ ] OTP 검증 우회 가능한 경로 없는지
- [ ] `citext` 컬럼(username·email) 대소문자 공격 방어 여부
- [ ] 외부 입력 sanitize (게시판 HTML 입력 — `sanitizeHtmlAllowBasic()` 적용 여부)
- [ ] `googleOtpSecret` 필드가 API 응답에서 제외됐는지 (`userInfoSelect` 확인)

### 상태 일관성

- [ ] Prisma 트랜잭션 범위 적절한지 (부분 실패 시 롤백)
- [ ] 레이스 컨디션 (동일 날짜 `DailySales` 동시 upsert)
- [ ] 멱등성 (같은 엑셀 재업로드 시 중복 생성 방지 — `confirmed=false` 삭제 후 재삽입)
- [ ] BFS `collectAllDownlineIds` 결과를 벗어난 사용자 접근 허용 여부 (`allowedIds` 범위 밖)

### Prisma 스키마 변경 시 추가 체크

- [ ] `prisma/schema/` 9파일 중 변경 파일만 수정됐는지
- [ ] 모듈 간 관계(foreign key)가 올바른 파일에 선언됐는지
- [ ] `@db.Date` 필드와 `DateTime` 혼용 오류 없는지
- [ ] 마이그레이션 SQL이 프로덕션 데이터 손실 위험 없는지

---

## 출력 포맷

```
## 도메인 리뷰 결과

### PASS
- [항목]: [이유]

### WARN
- [항목]: [잠재 위험] → [권고사항]

### FAIL
- [항목]: [구체적 문제] → [수정 방향]

### 총평
심각도: critical / high / medium / low
재작업 필요: yes / no
```
