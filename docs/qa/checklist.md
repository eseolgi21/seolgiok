<!-- Last updated: 2026-06-17 -->

# seolgiok QA 체크리스트

> **기준**: 자동화 테스트 없음. CI = `npm run lint` 단일. 아래 체크리스트는 수동 검증 기준.

---

## 배포 전 체크리스트

### 1. 환경 변수 (7개 전부 설정 확인)

- [ ] `DATABASE_URL` — Railway PostgreSQL 연결 문자열
- [ ] `AUTH_SECRET` — NextAuth 5 세션 서명 키 (랜덤 base64, 최소 32자)
- [ ] `AUTH_TRUST_HOST` — Railway 환경에서 `true` 설정 여부
- [ ] `CRED_ENC_KEY_B64` — AES-256-GCM 키 (base64 디코딩 시 정확히 32바이트 확인)
- [ ] `OTP_ISSUER` — Google Authenticator 표시 이름
- [ ] `BCRYPT_ROUNDS` — 비밀번호 해싱 라운드 수 (기본값 12 이상 권장)
- [ ] `NEXT_PUBLIC_BRAND_NAME` — 브랜드명 (클라이언트 노출)

> 검증 명령어 (로컬): 각 env가 undefined가 아닌지 확인
> ```bash
> node -e "require('dotenv').config(); ['DATABASE_URL','AUTH_SECRET','AUTH_TRUST_HOST','CRED_ENC_KEY_B64','OTP_ISSUER','BCRYPT_ROUNDS','NEXT_PUBLIC_BRAND_NAME'].forEach(k => { if (!process.env[k]) console.error('MISSING:', k); else console.log('OK:', k); })"
> ```

### 2. DB 마이그레이션

- [ ] Prisma 스키마 변경 사항이 있을 경우 마이그레이션 실행 (`db-expert` 전담)
- [ ] `prisma generate` 완료 여부 (`npm run generate`)
- [ ] 프로덕션 DB 스키마와 코드 Prisma 스키마 일치 확인
- [ ] `npm run seed` 필요 여부 판단 (신규 배포 시 기초 데이터 여부)

### 3. 빌드 및 Lint

- [ ] `npm run lint` 오류 없이 통과
- [ ] `npm run build` 성공 (TypeScript 오류 포함 빌드 타임 오류 0)
- [ ] 빌드 시 Prisma generate 자동 실행 확인 (`"build": "prisma generate && next build"`)

### 4. 비즈니스 크리티컬 수동 테스트

아래 항목은 배포 전 반드시 실제 브라우저에서 수동 확인.

#### 인증 흐름
- [ ] 정상 계정 로그인 성공 (TC-01)
- [ ] 잘못된 비밀번호 시 에러 메시지 표시 (TC-03)
- [ ] 비인증 상태에서 `/admin` 접근 시 로그인 페이지로 리다이렉트 (TC-06)
- [ ] 로그아웃 후 세션 종료 확인 (TC-05)

#### 매출 · 매입 · 정산
- [ ] 매출 수동 입력 후 DB 저장 확인, `amount` 정수 여부 (TC-11)
- [ ] 매출 엑셀 업로드 (표준 xlsx 1건 이상) 성공 (TC-15)
- [ ] 정산 페이지 순수익 계산값이 `매출 − 매입 − 부가세` 공식 일치 (TC-21)
- [ ] 신고 현금매출 입력 저장 후 재조회 시 값 유지 (TC-22)

#### 게시판
- [ ] 공지사항 작성 후 목록/상세 확인 (TC-29)
- [ ] `<script>` 태그 포함 내용 저장 시 태그 제거 확인 (TC-30)

#### 권한 제어
- [ ] level 미달 계정으로 `/admin` API 접근 시 401 응답 확인 (TC-34, TC-35)

#### 로케일
- [ ] ko / en 최소 2개 로케일 페이지 정상 렌더링 확인 (TC-37)

---

## 코드 변경 후 체크리스트

### API Route 추가·수정 시

- [ ] `security-expert` (opus) 리뷰 필수
  - 인증 (`auth()` / `getUserId()`) 체크 코드 포함 여부
  - level 기반 권한 체크 조건 (< N) 올바른지 확인
  - Zod 입력 검증 스키마 적용 여부
  - 에러 응답에 민감 정보(stack trace, DB 스키마) 미포함 여부
- [ ] 신규 엔드포인트 test-cases.md에 TC 추가

### Prisma 스키마 변경 시

- [ ] **`db-expert` 전담** — 직접 `prisma migrate dev` 실행 금지
- [ ] 마이그레이션 파일 검토 후 프로덕션 적용
- [ ] `npm run generate` 재실행하여 클라이언트 타입 갱신
- [ ] 관련 API Route의 select/where 필드 업데이트 여부 확인

### i18n (번역) 변경 시

- [ ] **`i18n-expert` 경유 필수**
  - `src/i18n/messages/` 5개 로케일 파일 모두 동일 키 추가 여부
  - 하드코딩 문자열 없음 (`grep -r '"[가-힣]' src/app/` 확인)
  - next-intl `useTranslations` 키 일치 여부

### 금액 관련 로직 변경 시

- [ ] **KRW 정수 규칙 확인** — 부동소수점 직접 연산 금지
  - DB 저장 필드: `Int` 타입 사용 여부 (Prisma 스키마)
  - 연산 결과: `Math.round()` 적용 후 정수 반환 여부
  - 화면 출력: `toLocaleString('ko-KR')` 등 정수 포맷 확인
  - `Number()` 변환 직후 반드시 정수 여부 검증

### 암호화 관련 변경 시

- [ ] `src/lib/crypto.ts` AES-256-GCM 유틸리티 경유만 허용
- [ ] `CRED_ENC_KEY_B64` 32바이트 키 검증 코드(`getAes256GcmKeyFromEnv`) 통과 확인
- [ ] 암호화 데이터 직접 수정 금지 — 반드시 encrypt/decrypt 함수 사용

### 인증 로직 변경 시

- [ ] **NextAuth 5 세션 패턴만** 사용 — 자체 JWT 발급 금지
- [ ] `auth()` 또는 `getSession()` 사용 확인 (직접 token 발급 코드 없음)
- [ ] JWT encode/decode (`jose` HS256) 커스텀 콜백 로직 변경 없음 확인
- [ ] `security-expert` 리뷰 필수

### UI 컴포넌트 변경 시

- [ ] 5개 로케일 (`en / ja / ko / vi / zh`) 모두 렌더링 테스트
- [ ] 번역 키 누락으로 인한 빈 텍스트 없음 확인
- [ ] DaisyUI 테마 적용 일관성

---

## 에이전트 호출 기준

| 변경 유형 | 필수 호출 에이전트 |
|---|---|
| 신규 API Route 추가 | `security-expert` (opus) |
| 인증·암호화 로직 수정 | `security-expert` (opus) |
| Prisma 스키마 변경 | `db-expert` (opus) |
| i18n 번역 키 추가·수정 | `i18n-expert` (sonnet) |
| 도메인 핵심 로직 (회계·정산) | `domain-expert` (opus) diff 리뷰 |
| git commit·push·배포 | `deploy-manager` (sonnet) |
| 상위 기획·기능 우선순위 | `pm` (sonnet) |

---

## 빠른 검증 명령어

```bash
# Lint 검사
npm run lint

# 빌드 검증 (TypeScript 포함)
npm run build

# Prisma 클라이언트 재생성
npm run generate

# 개발 서버 실행
npm run dev
```

---

## 알려진 제약사항

- 자동화 테스트 프레임워크 미설정 (`__tests__/sample.test.js` 는 플레이스홀더)
- `playwright` devDependency 설치됨 — E2E 테스트 작성 시 활용 가능
- 모든 QA는 현재 수동 + lint 기반
- 운영 DB 직접 SQL 변경 금지 (`SELECT` read-only만 허용)
