<!-- Last updated: 2026-06-17 -->

# seolgiok 디자인 가이드

## 디자인 시스템

### 기반 라이브러리
| 항목 | 버전 | 비고 |
|---|---|---|
| Tailwind CSS | ^4.3.0 | `@tailwindcss/postcss` 플러그인 방식 |
| DaisyUI | ^5.5.19 | `@plugin "daisyui"` 로드, `themes: all` 활성화 |
| Heroicons | ^2.2.0 | outline 변형 전용 사용 |

### globals.css 설정
파일 위치: `src/styles/globals.css`

```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: all;
  exclude: properties;
}
```

### 커스텀 색상 팔레트 (`@theme`)
| 변수명 | 헥스 코드 | 용도 |
|---|---|---|
| `--color-gold` | `#bf4040` | 브랜드 강조색, 액티브 링크, CTA 버튼 |
| `--color-gold-hover` | `#a83535` | gold hover 상태 |
| `--color-cream` | `#fdfbf7` | 배경, 카드 기본 배경 |
| `--color-cream-border` | `#e5e0d4` | 경계선, 구분선 |
| `--color-dark` | `#1c1008` | 다크 배경(헤더·푸터·드로어), 주요 텍스트 |
| `--color-dark-hover` | `#2e1e10` | dark hover 상태 |
| `--color-crimson` | `#8b1a1a` | 강조 심볼 (사용 예정) |
| `--color-crimson-dark` | `#6e1414` | crimson 다크 변형 |
| `--color-crimson-light` | `#a82020` | crimson 라이트 변형 |

> **주의**: `gold` 라는 변수명은 실제 금색(#FFD700)이 아닌 브랜드용 딥레드(#bf4040)다.

### DaisyUI 시멘틱 색상 (관리자 영역)
관리자 페이지는 DaisyUI 기본 테마 토큰을 사용한다.
- `bg-base-100` / `bg-base-200` — 페이지·사이드바 배경
- `text-base-content` — 기본 텍스트
- `bg-primary` / `text-primary-content` — 활성 네비게이션 항목
- `text-info` / `text-success` / `text-error` / `text-secondary` — 통계 카드 아이콘 색상

---

## 컴포넌트 목록

### 공통 컴포넌트 (`src/components/`)

| 파일 | 역할 |
|---|---|
| `MainHeader.tsx` | 공개 사이트 헤더 — 로고, PC 수평 메뉴, 언어 전환, 로그인/회원가입 버튼, 모바일 사이드 드로어 |
| `LanguageSwitcher.tsx` | 5개 로케일(en·ko·ja·zh·vi) 전환 드롭다운. variant: `icon-only` / `flag-label` / `icon-label` |
| `SiteFooter.tsx` | 공개 사이트 푸터 — 브랜드명, 네비게이션 링크, 사업자 정보, 약관·개인정보 링크 |
| `GrandOpeningPopup.tsx` | 그랜드오픈 팝업 모달 — localStorage 기반 하루 숨기기, 기간 만료 자동 미노출 |
| `OpeningCountdown.tsx` | 오픈 카운트다운 배너 — D-day 계산, 오픈 후 자동 숨김 |
| `HtmlLang.tsx` | `<html lang>` 속성 동기화 유틸리티 |
| `JsonLd.tsx` | SEO용 JSON-LD 구조화 데이터 (Restaurant·WebSite·GrandOpeningEvent·FaqPage) |

### 관리자 컴포넌트 (`src/components/admin/`)

| 파일 | 역할 |
|---|---|
| `AdminSidebar.tsx` | 관리자 사이드바 — 트리 구조 NavGroup·Leaf, 아코디언 토글, 활성 경로 하이라이트 |

### UI 공통 컴포넌트 (`src/components/ui/`)

| 파일 | 역할 |
|---|---|
| `ui/index.tsx` | `Button`, `InputField`, `PasswordField`, `Form`, `LabeledField` + re-export |
| `ui/feedback/Toast-provider.tsx` | Toast 알림 시스템 — Context 기반, DaisyUI alert 클래스, 4가지 variant |
| `ui/overlay/Dropdown.tsx` | 범용 드롭다운 — controlled open/close, 외부 클릭 닫기, `dropdown-end` 지원 |

---

## 레이아웃 구조

### 공개 사이트 레이아웃 (`(site)/layout.tsx`)

```
<div class="min-h-dvh bg-base-200 text-base-content flex flex-col">
  <MainHeader />          ← sticky top-0, z-50, h-20, backdrop-blur
  <OpeningCountdown />    ← 오픈 전까지만 노출
  <main class="flex-1">  ← 각 페이지 콘텐츠
  <SiteFooter />
</div>
```

- 헤더 높이: `h-20` (80px)
- 헤더 배경: `bg-white/90 border-gray-200`, `backdrop-blur-md`
- 반응형 분기: `lg:` (1024px) 기준 — 모바일에서 햄버거 드로어, PC에서 수평 메뉴

#### 모바일 드로어 (헤더 내 포함)
- 오버레이: `fixed inset-0 z-[60] bg-black/40`
- 패널: `fixed top-0 right-0 z-[70] h-full w-72 bg-dark text-cream`
- 진입 애니메이션: `translate-x-full → translate-x-0` (300ms ease-in-out)

### 관리자 대시보드 레이아웃 (`admin/layout.tsx`)

```
<div class="drawer lg:drawer-open min-h-dvh bg-base-200">
  <input type="checkbox" class="drawer-toggle" />   ← 모바일 토글
  <div class="drawer-content">
    <div class="lg:hidden sticky top-0 z-20 ...">   ← 모바일 상단바 (h:48px)
      ☰ 버튼
    </div>
    <main class="px-3 py-4 sm:px-6 lg:px-8">       ← 콘텐츠 영역
  </div>
  <div class="drawer-side z-40 lg:z-0">
    <aside class="w-72 max-w-[80vw] bg-base-100 border-r min-h-dvh">
      <AdminSidebar />
    </aside>
  </div>
</div>
```

- 데스크톱(lg+): 사이드바 항상 열림 (`lg:drawer-open`)
- 모바일: DaisyUI drawer 오버레이 방식
- 사이드바 너비: `w-72` (288px), 최대 `max-w-[80vw]`
- 콘텐츠 패딩: `px-3 py-4` → `sm:px-6` → `lg:px-8`

#### 관리자 사이드바 내 네비게이션 구조
```
대시보드             → /admin/dashboard
유저 관리
  └ 유저 목록       → /admin/users/list
품목 관리
  ├ 품목 분류 설정  → /admin/items
  └ 엑셀 필터 설정  → /admin/items/filters
매입 관리
  ├ 매입 내역(엑셀) → /admin/purchase/list
  └ 매입 분석       → /admin/purchase/analysis
매출 관리
  ├ 매출 내역(엑셀) → /admin/sales/list
  └ 매출 분석       → /admin/sales/analysis
순수익 관리
  ├ 순수익 분석(월별) → /admin/profit/analysis
  ├ 순수익 분석(기간별) → /admin/profit/period
  └ 순수익 정산     → /admin/profit/settlement
게시판 관리
  ├ 공지사항        → /admin/boards/announcements
  └ 이벤트          → /admin/boards/events
```

---

## 페이지 목록

### 관리자 페이지 (`src/app/[locale]/admin/`) — 총 14개

| URL 경로 | 파일 | 설명 |
|---|---|---|
| `/admin` | `page.tsx` | 관리자 루트 (redirect) |
| `/admin/dashboard` | `dashboard/page.tsx` | 대시보드 — 통계 카드(매출·매입·순수익·사용자), 월별 수익 추이 |
| `/admin/users/list` | `users/list/page.tsx` | 유저 목록 |
| `/admin/users/tree` | `users/tree/page.tsx` | 추천인 트리 |
| `/admin/items` | `items/page.tsx` | 품목 분류 설정 |
| `/admin/items/filters` | `items/filters/page.tsx` | 엑셀 필터 설정 |
| `/admin/purchase/list` | `purchase/list/page.tsx` | 매입 내역 (엑셀 업로드) |
| `/admin/purchase/analysis` | `purchase/analysis/page.tsx` | 매입 분석 |
| `/admin/sales/list` | `sales/list/page.tsx` | 매출 내역 (엑셀 업로드) |
| `/admin/sales/analysis` | `sales/analysis/page.tsx` | 매출 분석 |
| `/admin/profit/analysis` | `profit/analysis/page.tsx` | 순수익 분석 (월별) |
| `/admin/profit/period` | `profit/period/page.tsx` | 순수익 분석 (기간별) |
| `/admin/profit/settlement` | `profit/settlement/page.tsx` | 순수익 정산 |
| `/admin/boards/announcements` | `boards/announcements/page.tsx` | 공지사항 목록 |
| `/admin/boards/announcements/new` | `boards/announcements/new/page.tsx` | 공지사항 작성 |
| `/admin/boards/events` | `boards/events/page.tsx` | 이벤트 목록 |
| `/admin/boards/events/new` | `boards/events/new/page.tsx` | 이벤트 작성 |

> 접근 제어: `session.user.level >= 21`이어야 진입 가능. 미달 시 `/`로 redirect.

### 공개 페이지 (`src/app/[locale]/(site)/`) — 총 11개

| URL 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `(home)/page.tsx` | 홈 — SeolgiokView + GrandOpeningPopup |
| `/about` | `about/page.tsx` | 소개 |
| `/menu` | `menu/page.tsx` | 메뉴 |
| `/location` | `location/page.tsx` | 오시는 길 |
| `/announcements` | `announcements/page.tsx` | 공지사항 목록 |
| `/announcements/[id]` | `announcements/[id]/page.tsx` | 공지사항 상세 |
| `/auth/login` | `auth/login/page.tsx` | 로그인 |
| `/auth/signup` | `auth/signup/page.tsx` | 회원가입 |
| `/terms` | `terms/page.tsx` | 이용약관 |
| `/privacy` | `privacy/page.tsx` | 개인정보처리방침 |

> 모든 URL은 `[locale]` prefix 포함. 예: `/ko/`, `/en/about`

---

## 스타일 패턴

### DaisyUI 컴포넌트 사용 패턴

#### 네비게이션
```html
<!-- 수평 메뉴 (헤더) -->
<ul class="menu menu-horizontal px-1 gap-2">

<!-- 수직 메뉴 (사이드바) -->
<ul class="menu p-2">

<!-- 관리자 Drawer 레이아웃 -->
<div class="drawer lg:drawer-open">
<input type="checkbox" class="drawer-toggle">
<div class="drawer-content"> ... </div>
<div class="drawer-side">
  <label class="drawer-overlay"></label>
  <aside> ... </aside>
</div>
```

#### 드롭다운
```html
<!-- DaisyUI dropdown (헤더 유저 메뉴) -->
<div class="dropdown dropdown-end dropdown-hover">
  <div tabIndex="0" role="button">...</div>
  <ul tabIndex="0" class="dropdown-content menu bg-white rounded-none z-[1] w-52 p-2 shadow-lg border border-[#e5e0d4]">

<!-- 커스텀 Dropdown 컴포넌트 (overlay/Dropdown.tsx) -->
class="dropdown dropdown-end dropdown-open"
class="dropdown-content z-[999] menu p-2 shadow bg-base-100 rounded-box"
```

#### 버튼
```html
<!-- 기본 DaisyUI 버튼 -->
<button class="btn btn-sm btn-outline">
<button class="btn btn-ghost btn-circle btn-md">
<button class="btn btn-xs btn-ghost btn-circle">

<!-- 브랜드 버튼 (공개 사이트) -->
<!-- 회원가입: -->
<a class="btn border border-gold bg-transparent text-gold hover:bg-gold hover:text-cream px-5 font-normal rounded-none uppercase tracking-wider">
<!-- 로그인: -->
<a class="btn bg-dark hover:bg-dark-hover text-gold border border-dark px-5 font-normal rounded-none shadow-sm uppercase tracking-wider">
```

#### 폼 요소
```html
<!-- InputField (ui/index.tsx) -->
<input class="input input-bordered w-full focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886]">
<label class="form-control w-full">
<div class="label"><span class="label-text">

<!-- 에러 표시 -->
<p class="text-error text-xs mt-1">
```

#### 카드 (관리자 대시보드)
```html
<div class="card bg-base-100 shadow-sm border border-base-200">
  <div class="card-body p-5">
    <h2 class="card-title text-base font-bold">
    <span class="badge badge-sm badge-ghost">
```

#### Toast 알림 (ui/feedback/Toast-provider.tsx)
```html
<!-- 컨테이너 -->
<div class="toast toast-top toast-end z-[9999] gap-2 p-4">

<!-- 각 항목 — variant별 -->
<div class="alert alert-success shadow-lg animate-in slide-in-from-right-full">
<div class="alert alert-error ...">
<div class="alert alert-warning ...">
<div class="alert alert-info ...">
```

#### 활성 경로 스타일 패턴
```html
<!-- 공개 헤더 링크 — 활성 -->
class="text-gold font-bold"
<!-- 공개 헤더 링크 — 비활성 -->
class="text-gray-700 hover:text-gold"

<!-- 관리자 사이드바 Leaf — 활성 -->
class="bg-primary text-primary-content"
<!-- 관리자 사이드바 Leaf — 비활성 -->
class="hover:bg-base-200 text-base-content/80"

<!-- 관리자 사이드바 NavGroup — 하위 활성 -->
class="bg-primary/10 text-base-content"
```

### 반응형 브레이크포인트 패턴

| 브레이크포인트 | 클래스 접두어 | 주요 동작 |
|---|---|---|
| 모바일(기본) | — | 수직 스택, 드로어 오버레이, 햄버거 메뉴 표시 |
| sm (640px+) | `sm:` | 일부 버튼 표시, 다단 레이아웃 시작 |
| lg (1024px+) | `lg:` | 헤더 수평 메뉴 표시, 사이드바 항상 열림, 최대 패딩 |

```html
<!-- 공개 헤더 반응형 -->
<div class="hidden lg:flex">           <!-- PC 전용 네비 -->
<button class="flex lg:hidden">        <!-- 모바일 전용 햄버거 -->
<div class="hidden sm:inline-flex">    <!-- sm+ 관리자 버튼 -->

<!-- 관리자 대시보드 그리드 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

### 접근성 패턴

코드에서 발견된 aria 속성 및 역할:

```html
<!-- 사이드바 아코디언 토글 -->
aria-expanded={isOpen}

<!-- 헤더 링크 -->
aria-label={t("aria.home")}
aria-current={active ? "page" : undefined}

<!-- 언어 전환 -->
aria-haspopup="listbox"
aria-expanded={isOpen}
aria-label="Change Language"
role="listbox"
role="option"
aria-selected={op.code === locale}

<!-- 관리자 레이아웃 -->
aria-label="open sidebar"
aria-label="close sidebar"
role="main"  (← id="main")

<!-- 아이콘 처리 -->
aria-hidden="true"  (← 장식용 Heroicon)
aria-hidden  (← 모바일 오버레이)
```

### 타이포그래피 패턴

| 용도 | 클래스 |
|---|---|
| 브랜드명 (푸터) | `font-serif text-xl font-bold` |
| 팝업 제목 | `font-serif text-lg font-bold` |
| 회원가입 페이지 h1 | `text-3xl font-serif font-bold` |
| 대시보드 h1 | `text-2xl font-bold text-gray-900` |
| 네비 링크 | `text-sm font-medium tracking-wide uppercase` |
| 부제목/서브라벨 | `text-xs tracking-[0.3em] uppercase` |
| 본문 소형 | `text-xs` / `text-sm` |

### z-index 레이어 맵

| 레이어 | z-index | 요소 |
|---|---|---|
| 공개 헤더 | z-50 | `<header>` sticky |
| 모바일 오버레이 | z-[60] | 헤더 모바일 드로어 배경 |
| 모바일 드로어 패널 | z-[70] | 헤더 모바일 사이드 패널 |
| 그랜드오픈 팝업 | z-[100] | `GrandOpeningPopup` |
| 관리자 사이드바(모바일) | z-40 | `drawer-side` |
| Toast 컨테이너 | z-[9999] | `ToastProvider` |

---

## 아이콘 시스템

`@heroicons/react` outline 변형 전용 사용. solid 변형 미사용.

```ts
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { GlobeAltIcon, CheckIcon } from "@heroicons/react/24/outline";
import { UsersIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
```

기본 크기: `w-6 h-6`, 소형: `w-4 h-4`, 대형: `h-7 w-7`

---

## 다국어(i18n) 지원

- 지원 로케일: `ko`, `en`, `ja`, `zh`, `vi` (5개)
- 라이브러리: `next-intl` ^4.12.0
- URL 구조: `[locale]` prefix (예: `/ko/`, `/en/about`)
- 번역 키 위치: `src/i18n/messages/`
- 주요 네임스페이스: `header`, `footer`, `authSignup`, `home.Seolgiok`, `location.opening`
- 로케일 저장: 쿠키 `NEXT_LOCALE` (1년 만료)
- 하드코딩 문자열 금지 — 모든 UI 텍스트는 반드시 `useTranslations` / `getTranslations` 경유

---

## 컴포넌트 구현 레퍼런스

실제 컴포넌트 코드에서 추출한 Props·상태·동작 패턴. UI 작업 시 이 섹션을 기준으로 한다.

### MainHeader

**파일**: `src/components/MainHeader.tsx`

```tsx
Props: { authed?: boolean; userLevel?: number }

isManager = (userLevel ?? 0) >= 21  // Admin 버튼 노출 여부
```

| 동작 | 구현 |
|---|---|
| 로그아웃 | `POST /api/auth/logout` 후 `window.location.assign(`/${locale}`)` |
| 모바일 메뉴 | `useState<boolean>(false)` + overlay + 패널(translate 애니메이션) |
| 활성 링크 | `pathname === href` → `text-gold font-bold` |
| 비활성 링크 | `text-gray-700 hover:text-gold` |
| PC 네비 메뉴 | `[about, menu, location, announcements]` |
| 공개 헤더 배경 | `bg-white/90 border-gray-200 backdrop-blur-md sticky top-0 z-50 h-20` |

**모바일 드로어 (헤더 내 포함)**:
- 오버레이: `fixed inset-0 z-[60] bg-black/40`
- 패널: `fixed top-0 right-0 z-[70] h-full w-72 bg-dark text-cream`
- 진입 애니메이션: `translate-x-full → translate-x-0` (300ms ease-in-out)

---

### LanguageSwitcher

**파일**: `src/components/LanguageSwitcher.tsx`

```tsx
Props: {
  variant?: "flag-label" | "icon-label" | "icon-only"   // 기본: "flag-label"
  direction?: "up" | "down"
  align?: "left" | "right"
  triggerClassName?: string
  itemClassName?: string
}

const LANGS = [
  { code: "ko", label: "한국어",    flag: "🇰🇷" },
  { code: "en", label: "English",   flag: "🇺🇸" },
  { code: "ja", label: "日本語",    flag: "🇯🇵" },
  { code: "zh", label: "中文",      flag: "🇨🇳" },
  { code: "vi", label: "Tiếng Việt",flag: "🇻🇳" },
]
```

| 동작 | 구현 |
|---|---|
| 언어 변경 | `router.replace(pathname, { locale: code })` |
| 쿠키 저장 | `document.cookie = "NEXT_LOCALE=${code}; max-age=31536000; path=/"` |
| 활성 언어 | `aria-selected={op.code === locale}` + CheckIcon 표시 |
| 접근성 | `aria-haspopup="listbox"`, `role="listbox"`, `role="option"` |

---

### AdminSidebar

**파일**: `src/components/admin/AdminSidebar.tsx`

```tsx
type NavNode = { label: string; href?: string; children?: NavNode[] }
```

| 동작 | 구현 |
|---|---|
| 펼침/접힘 상태 | `openKeys: Set<string>` — key는 `label` |
| 아코디언 토글 | `Set.has(key)` → `Set.delete` / `Set.add` |
| 활성 감지 | `pathname.startsWith(href)` 비교 |
| 활성 Leaf 스타일 | `bg-primary text-primary-content` |
| 비활성 Leaf | `hover:bg-base-200 text-base-content/80` |
| 상위 그룹 활성 | `bg-primary/10 text-base-content` |
| depth 패딩 | `pl-4` (depth1) → `pl-6` (depth2) → `pl-8` (depth3) |
| 접근성 | `aria-expanded={isOpen}` |

**navTree 구조** (2depth):
```
대시보드 / 유저관리 > [유저목록, 추천인트리] /
품목관리 > [품목분류설정, 엑셀필터설정] /
매입관리 > [매입내역, 매입분석] /
매출관리 > [매출내역, 매출분석] /
순수익관리 > [순수익분석월별, 순수익분석기간별, 순수익정산] /
게시판관리 > [공지사항, 이벤트]
```

---

### Toast 시스템

**파일**: `src/components/ui/feedback/Toast-provider.tsx`

```tsx
type ToastInput = {
  id?: string                                               // 자동 생성 가능
  title?: string
  description?: string
  variant: "default" | "success" | "error" | "warning"
  duration?: number    // ms, 기본 3000
  position?: string    // 기본 top-end
}
```

| 항목 | 값 |
|---|---|
| Context | `ToastContext` |
| Provider | `ToastProvider` — 루트 레이아웃(`src/app/[locale]/layout.tsx`)에 배치 |
| Hook | `useToast()` → `{ toast }` |
| 컨테이너 클래스 | `toast toast-top toast-end z-[9999] gap-2 p-4` |

**DaisyUI alert 클래스 매핑**:
```
success  → alert-success  + slide-in-from-right-full
error    → alert-error    + slide-in-from-right-full
warning  → alert-warning  + slide-in-from-right-full
default  → alert-info     + slide-in-from-right-full
```

**사용 패턴**:
```tsx
const { toast } = useToast();
toast({ variant: "success", title: "저장됨", duration: 3000 });
toast({ variant: "error", title: "실패", description: "다시 시도해주세요." });
```

---

### OpeningCountdown

**파일**: `src/components/OpeningCountdown.tsx`

```tsx
const OPENING_DATE = new Date("2026-06-01T00:00:00+09:00");

// 1분마다 갱신
useEffect(() => {
  const timer = setInterval(() => { /* daysLeft 재계산 */ }, 60_000);
  return () => clearInterval(timer);
}, []);

// 오픈 후 자동 숨김
if (daysLeft < 0) return null;
```

---

### GrandOpeningPopup

**파일**: `src/components/GrandOpeningPopup.tsx`

```tsx
const POPUP_KEY  = "sgk_grand_open_v1";                    // localStorage key
const SHOW_UNTIL = new Date("2026-06-16T00:00:00+09:00");  // 만료일 이후 미노출

// 표시 조건 (모두 충족 시 노출)
// 1) 현재 날짜 < SHOW_UNTIL
// 2) localStorage.getItem(POPUP_KEY) 없거나 24h 초과

// 24h 스누즈
localStorage.setItem(POPUP_KEY, Date.now().toString());
```

---

### UI 공통 컴포넌트 (`src/components/ui/index.tsx`)

| 컴포넌트 | 역할 |
|---|---|
| `Button` | `className` override 지원, DaisyUI btn 기반 |
| `InputField` | label + input + 에러 메시지 조합. `error: string` prop으로 에러 표시 |
| `PasswordField` | InputField + 비밀번호 보임/숨김 토글 |
| `Form` | `<form>` wrapper. `aria-busy` 지원 |
| `LabeledField` | label + children 래퍼 |

**InputField 스타일**:
```html
<input class="input input-bordered w-full focus:border-[#d4b886] focus:ring-1 focus:ring-[#d4b886]">
<p class="text-error text-xs mt-1">  ← 에러 메시지
```

---

### 공개 사이트 vs 관리자 버튼 스타일

**공개 사이트 CTA 버튼** (브랜드 스타일):
```html
<!-- 회원가입 버튼 -->
<a class="btn border border-gold bg-transparent text-gold hover:bg-gold hover:text-cream
          px-5 font-normal rounded-none uppercase tracking-wider">

<!-- 로그인 버튼 -->
<a class="btn bg-dark hover:bg-dark-hover text-gold border border-dark
          px-5 font-normal rounded-none shadow-sm uppercase tracking-wider">
```

**관리자 영역 DaisyUI 버튼**:
```html
<button class="btn btn-primary">   <!-- 주요 액션 -->
<button class="btn btn-sm btn-outline">  <!-- 보조 -->
<button class="btn btn-ghost btn-circle btn-md">  <!-- 아이콘 전용 -->
<button class="btn btn-xs btn-ghost btn-circle">  <!-- 미니 아이콘 -->
```

---

### 관리자 대시보드 통계 카드

```html
<div class="card bg-base-100 shadow-sm border border-base-200">
  <div class="card-body p-5">
    <h2 class="card-title text-base font-bold">
    <span class="badge badge-sm badge-ghost">
    <!-- 통계 아이콘: text-info / text-success / text-error / text-secondary -->
    <!-- 그리드: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 -->
```

---

### Dropdown 컴포넌트 (`src/components/ui/overlay/Dropdown.tsx`)

- Controlled open/close (external state)
- 외부 클릭 닫기 (`mousedown` event listener)
- `dropdown-end` 지원

```html
<div class="dropdown dropdown-end dropdown-open">
  <div class="dropdown-content z-[999] menu p-2 shadow bg-base-100 rounded-box">
```
