# Seolgiok — 프로젝트 가이드

## 프로젝트 개요

Next.js 16 기반 다국어 이커머스 관리 플랫폼.

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19 + TailwindCSS 4 + DaisyUI 5
- **DB**: PostgreSQL + Prisma 7 (모듈형 스키마)
- **인증**: NextAuth 5 (JWT + OAuth)
- **다국어**: next-intl 4 (EN, KO, JA, ZH, VI)
- **런타임**: Node.js ≥ 22

## 핵심 모듈

| 모듈 | 경로 |
|------|------|
| 공개 사이트 | `src/app/[locale]/(site)/` |
| 관리자 대시보드 | `src/app/[locale]/admin/` |
| API 라우트 | `src/app/api/` |
| 컴포넌트 | `src/components/` |
| 다국어 메시지 | `src/i18n/messages/` |
| DB 스키마 | `prisma/schema/` |
| 유틸리티 | `src/lib/` |

## 팀 에이전트 구조

아래 에이전트들은 `.claude/agents/` 폴더에 정의되어 있으며,
Claude Code가 작업 유형에 따라 자동으로 라우팅하거나 명시적으로 호출할 수 있다.

### 모델 배정 원칙

| 모델 | 용도 |
|------|------|
| `claude-opus-4-7` | 전략적 판단, 복잡한 추론, 품질 게이트 |
| `claude-sonnet-4-6` | 설계·구현 등 숙련된 작업 |
| `claude-haiku-4-5-20251001` | 반복적·단순 작업, 속도 우선 |

### 에이전트 목록 및 호출 기준

| 에이전트 | 파일 | 모델 | 호출 기준 |
|---------|------|------|-----------|
| 프로젝트 매니저 | `pm.md` | Opus 4.7 | 스프린트 계획, 요구사항 정리, 팀 간 조율 |
| 웹 기획 팀장 | `planning-lead.md` | Sonnet 4.6 | UX 흐름 설계, 기능 명세, i18n 전략 |
| 웹 기획 팀원 | `planning-member.md` | Haiku 4.5 | i18n 메시지 번역, 문서 업데이트 |
| 웹 디자인 팀장 | `design-lead.md` | Sonnet 4.6 | 디자인 시스템, 컴포넌트 스펙, UI 검토 |
| 웹 디자인 팀원 | `design-member.md` | Haiku 4.5 | Tailwind 적용, 에셋 관리, 소규모 UI 수정 |
| 웹 개발 팀장 | `dev-lead.md` | Sonnet 4.6 | DB 스키마, API 설계, 코드 리뷰, 복잡한 구현 |
| 웹 개발 팀원 | `dev-member.md` | Haiku 4.5 | 컴포넌트 구현, 단순 버그 수정, 보일러플레이트 |
| QA Lead | `qa-lead.md` | Opus 4.7 | 테스트 전략, 기능 검증, 보안 검토 |
| DevOps 담당자 | `devops.md` | Sonnet 4.6 | CI/CD, Docker, 배포 환경, 환경변수, 인프라 |

## 기본 진입 규칙

**모든 사용자 요청은 프로젝트 매니저(pm) 에이전트가 먼저 접수한다.**
PM이 작업을 분석하고 적절한 팀 에이전트에게 위임하며, 결과를 통합해 사용자에게 보고한다.

단순 1회성 조회·확인 요청은 PM이 직접 처리할 수 있다.

## 공통 규칙

- TypeScript strict 모드 준수
- Tailwind 클래스는 DaisyUI 컴포넌트 우선 사용
- API 응답 타입은 `src/types/` 에 정의
- 다국어 문자열은 하드코딩 금지 — `src/i18n/messages/` 사용
- Prisma 스키마 변경 후 반드시 마이그레이션 실행
- 환경변수는 `.env` 참조, 코드에 직접 삽입 금지
