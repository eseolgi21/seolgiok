# seolgiok

한식당 경영관리 시스템 — 회계(매출/매입/정산), 추천인 네트워크, 게시판, 5개 국어 지원.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| UI | React 19, DaisyUI 5, Tailwind CSS 4 |
| 언어 | TypeScript |
| 데이터베이스 | PostgreSQL (Railway) |
| ORM | Prisma 7 (모듈형 9파일 스키마) |
| 인증 | NextAuth 5 (Credentials + JWT) |
| 다국어 | next-intl (ko · en · ja · vi · zh) |
| 암호화 | AES-256-GCM (`src/lib/crypto.ts`) |
| 2FA | Google OTP (otpauth) |

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일 생성:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
AUTH_SECRET=<random base64 string>
AUTH_TRUST_HOST=true
CRED_ENC_KEY_B64=<32바이트 AES 키 base64>
OTP_ISSUER=seolgiok
BCRYPT_ROUNDS=12
NEXT_PUBLIC_BRAND_NAME=설기옥
```

### 3. DB 마이그레이션

```bash
npx prisma migrate dev
npm run seed   # 초기 데이터 (선택)
```

### 4. 개발 서버 실행

```bash
npm run dev    # http://localhost:3000
```

## 주요 명령어

```bash
npm run dev       # 개발 서버 (Turbopack)
npm run build     # 프로덕션 빌드 (prisma generate 포함)
npm run lint      # ESLint 검사
npm run generate  # Prisma 클라이언트 재생성
npm run seed      # DB 시드
```

## 프로젝트 구조

```
src/
├── app/[locale]/
│   ├── (site)/     — 공개 페이지 (홈·메뉴·안내·공지)
│   └── admin/      — 관리자 대시보드 (매출·매입·정산·게시판·회원)
├── app/api/        — API Routes
├── components/     — 공통 UI 컴포넌트
├── lib/            — NextAuth, Prisma, 암호화 유틸
└── i18n/messages/  — 5개 언어 번역 파일

prisma/schema/      — 모듈형 스키마 9개 파일
```

## 문서

| 문서 | 설명 |
|---|---|
| [docs/specs/domain.md](docs/specs/domain.md) | 도메인 규칙, 엔티티, 불변식 |
| [docs/specs/database.md](docs/specs/database.md) | DB 스키마, 모델 관계 |
| [docs/specs/features.md](docs/specs/features.md) | 기능 명세, 비즈니스 규칙 |
| [docs/specs/i18n.md](docs/specs/i18n.md) | 다국어 구조, 번역 워크플로우 |
| [docs/specs/security.md](docs/specs/security.md) | 보안 패턴, 인증·암호화 가이드 |
| [docs/design/guide.md](docs/design/guide.md) | 디자인 시스템, UX 플로우 |
| [docs/qa/test-cases.md](docs/qa/test-cases.md) | 테스트 케이스 |
| [docs/deployment/runbook.md](docs/deployment/runbook.md) | 배포 런북 |
| [docs/README.md](docs/README.md) | 문서 전체 인덱스 |

## AI 에이전트 팀

[CLAUDE.md](CLAUDE.md) — 에이전트 역할·규칙·호출 가이드
