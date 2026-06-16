<!-- Last updated: 2026-06-17 -->

# seolgiok 문서 인덱스

> 이 파일은 doc-keeper 에이전트가 자동 관리합니다.

## 문서 목록

### 명세 (specs/)
| 파일 | 담당 에이전트 | 마지막 업데이트 | 설명 |
|---|---|---|---|
| [domain.md](specs/domain.md) | domain-expert | 2026-06-17 | 도메인 규칙, 엔티티, 불변식 |
| [database.md](specs/database.md) | db-expert | 2026-06-17 | Prisma 스키마, 모델 관계, 인덱스 |
| [features.md](specs/features.md) | product-planner | 2026-06-17 | 기능 명세, 비즈니스 규칙 |
| [i18n.md](specs/i18n.md) | i18n-expert | 2026-06-17 | 다국어 구조, 네임스페이스, 워크플로우 |
| [security.md](specs/security.md) | security-expert | 2026-06-17 | 보안 패턴, 인증, 암호화 가이드 |

### 디자인 (design/)
| 파일 | 담당 에이전트 | 마지막 업데이트 | 설명 |
|---|---|---|---|
| [guide.md](design/guide.md) | ui-ux-designer | 2026-06-17 | 디자인 시스템, 컴포넌트, UX 플로우 |

### QA (qa/)
| 파일 | 담당 에이전트 | 마지막 업데이트 | 설명 |
|---|---|---|---|
| [test-cases.md](qa/test-cases.md) | qa-lead | 2026-06-17 | 비즈니스 크리티컬 테스트 케이스 |
| [checklist.md](qa/checklist.md) | qa-lead | 2026-06-17 | 배포 전·변경 후 체크리스트 |

### 도메인 리뷰 (루트)
| 파일 | 담당 에이전트 | 마지막 업데이트 | 설명 |
|---|---|---|---|
| [domain-review-checklist.md](domain-review-checklist.md) | domain-expert | 2026-06-17 | 도메인 변경 시 리뷰 체크리스트 (domain-expert 의무 Read) |

### 배포 (deployment/)
| 파일 | 담당 에이전트 | 마지막 업데이트 | 설명 |
|---|---|---|---|
| [runbook.md](deployment/runbook.md) | deploy-manager | 2026-06-17 | 배포 절차, 환경변수, 롤백 |

## 에이전트 팀

| 에이전트 | 문서 소유권 |
|---|---|
| domain-expert | specs/domain.md, domain-review-checklist.md |
| db-expert | specs/database.md |
| product-planner | specs/features.md |
| ui-ux-designer | design/guide.md |
| qa-lead | qa/test-cases.md, qa/checklist.md |
| deploy-manager | deployment/runbook.md |
| i18n-expert | specs/i18n.md |
| security-expert | specs/security.md |
| doc-keeper | docs/README.md (이 파일) |
| growth-pm | product/<feature>-growth.md |

## 문서 업데이트 방법

1. 코드 변경 후 doc-generator 에이전트 호출 → 전체 문서 재생성
2. 개별 문서 업데이트 → 담당 에이전트 직접 호출
3. 드리프트 검사: `bash /Users/aidenyun/project/brand-seolgiok/scripts/sync-harness-docs.sh --drift`
