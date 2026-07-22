// src/lib/middleware/rate-limit.ts
//
// 최소 침습 in-memory rate limiter. 브루트포스(로그인 비밀번호 추측)·사용자 열거(resolve-user)·
// 자동화된 대량 가입(signup) 완화 용도. 별도 인프라(Redis 등) 없이 단일 프로세스 메모리 기반으로
// 동작한다 — Railway 단일 서비스 인스턴스로 운영 중인 seolgiok 현재 배포 형태에서는 실용적인
// 최소 방어책이다. 다중 인스턴스로 수평 확장 시 인스턴스별 카운터가 분리되는 한계가 있으나,
// 그 시점에 공유 스토어(Redis 등) 도입은 별도 과제로 남긴다(과잉 엔지니어링 지양).

type Bucket = {
  count: number;
  resetAt: number; // epoch ms
};

const buckets = new Map<string, Bucket>();

// 전용 타이머 없이 요청 처리 경로에서 지연 정리(만료된 키 제거)해 메모리 누수를 방지한다.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10분마다 최대 1회 정리
let lastCleanupAt = Date.now();

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitCheck = {
  limited: boolean;
  retryAfterSec: number;
};

/**
 * 카운트를 증가시키지 않고 현재 키가 한도를 초과했는지만 확인한다.
 * 윈도우 길이는 최초 recordAttempt() 호출 시점에 버킷에 고정되므로 여기서는 받지 않는다.
 */
export function isRateLimited(key: string, limit: number): RateLimitCheck {
  const now = Date.now();
  cleanupExpired(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return { limited: false, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { limited: false, retryAfterSec: 0 };
}

/** 실패(또는 계산 대상) 시도를 1회 기록한다. 윈도우가 만료됐으면 새 윈도우로 리셋한다. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  cleanupExpired(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

/** 성공 시 등 카운터를 초기화한다(예: 로그인 성공 시 실패 카운트 리셋). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * 확인과 기록을 원자적으로 수행한다(모든 요청을 카운트하는 용도 — signup/resolve-user).
 * 이미 한도를 초과한 상태면 카운트를 늘리지 않고 limited=true를 반환한다.
 */
export function checkAndRecord(key: string, limit: number, windowMs: number): RateLimitCheck {
  const now = Date.now();
  cleanupExpired(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { limited: false, retryAfterSec: 0 };
}

// Railway는 단일 홉(single-hop) 리버스 프록시로 앱 컨테이너 앞단에서 요청을 중계한다.
// 신뢰할 수 있는 프록시가 정확히 1개뿐이므로, X-Forwarded-For 리스트에서 우리가 실제로 신뢰할 수
// 있는 값은 "그 프록시가 직접 덧붙인" 맨 뒤(rightmost) 항목 하나뿐이다. 그보다 왼쪽에 있는 값은
// 요청이 프록시에 도달하기 전에 클라이언트가 얼마든지 임의로 주입할 수 있어 신뢰할 수 없다
// (맨 앞 값을 그대로 신뢰하면 매 요청마다 값을 바꿔 rate limit의 IP/계정+IP 키를 우회할 수 있었음 — M-4a).
// 인프라 구성이 바뀌어 프록시 홉이 추가/제거되면(예: 앞단에 CDN을 추가로 두는 경우) 이 상수도
// 반드시 함께 조정해야 한다.
const TRUSTED_PROXY_HOPS = 1;

/**
 * Next.js Request에서 신뢰 가능한 클라이언트 IP를 추출한다.
 * 1순위: x-real-ip — 존재한다면 리버스 프록시가 클라이언트가 보낸 값을 무시하고 자체적으로
 *        설정하는 단일 값 헤더라, 클라이언트가 여러 값을 주입해 위치를 조작할 수 있는
 *        X-Forwarded-For 리스트보다 신뢰도가 높다.
 * 2순위: X-Forwarded-For — TRUSTED_PROXY_HOPS(=1)만큼 오른쪽에서 센 값(단일 홉이므로 맨 뒤 값)을
 *        채택한다. 그 왼쪽 값들은 클라이언트가 조작 가능하므로 사용하지 않는다.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      const trustedIndex = Math.max(0, hops.length - TRUSTED_PROXY_HOPS);
      const trusted = hops[trustedIndex];
      if (trusted) return trusted;
    }
  }
  return "unknown";
}
