/**
 * 임의의 IANA 타임존(예: "Asia/Seoul", "Asia/Ho_Chi_Minh", "America/New_York")을 기준으로
 * "오늘" 경계(자정 시각)를 계산하는 순수 유틸리티.
 *
 * `src/lib/kst.ts`는 KST(UTC+9, DST 없음) 고정 오프셋만 다루는 회계 도메인 전용 유틸이라
 * 단순 산술로 충분하지만, 멀티매장 확장으로 매장마다 서로 다른(DST 있는 타임존 포함) IANA
 * 타임존을 가질 수 있어 고정 오프셋 방식을 쓸 수 없다. 이 모듈은 대신
 * `Intl.DateTimeFormat`으로 UTC instant ↔ 대상 타임존의 civil wall-clock을 왕복 변환하며,
 * 후보 UTC 시각을 다시 같은 타임존으로 재포맷해 실제 00:00:00과 일치하는지 확인하고
 * 오차만큼 보정하는 방식(반복 수렴)으로 DST 전환·30분 오프셋(예: 인도) 등 비정형 오프셋도
 * 안전하게 처리한다.
 *
 * `kst.ts`는 그대로 두고 손대지 않는다 — 회계 도메인 코드가 이 모듈을 의존하지 않도록
 * blast radius를 분리한다.
 */

/** 매장 등 타임존 미설정 엔티티에 적용할 기본 IANA 타임존. */
export const DEFAULT_TIMEZONE = "Asia/Seoul";

/**
 * 주어진 UTC instant가 대상 IANA 타임존에서 어떤 civil wall-clock(연/월/일/시/분/초)에
 * 해당하는지 `Intl.DateTimeFormat`으로 분해한다.
 */
function getWallClockParts(
  timeZone: string,
  date: Date
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  // hour12: false 인 경우 자정을 "24"로 표기하는 로케일/구현이 있어 0으로 정규화한다.
  const hour = Number(lookup.hour) % 24;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

/**
 * 대상 타임존에서 특정 연/월/일의 00:00:00(civil wall-clock)에 해당하는 UTC instant를 구한다.
 *
 * `Date.UTC(year, month-1, day, 0,0,0,0)`을 1차 추정치로 삼고, 그 추정치를 다시 대상
 * 타임존으로 포맷해 실제로 해당 연/월/일 00:00:00이 되는지 확인한다. DST 전환 등으로
 * 오프셋이 날짜에 따라 달라지는 경우 오차만큼 보정해 재시도하며, 대부분의 IANA 타임존은
 * 정시 오프셋이라 1회 반복으로 수렴하지만 30분/45분 단위 오프셋(예: 인도, 네팔)도
 * 견고하게 처리하기 위해 최대 몇 회까지 반복 보정한다.
 */
function utcInstantForCivilMidnight(timeZone: string, year: number, month: number, day: number): Date {
  let candidateMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  const MAX_ITERATIONS = 5;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const candidate = new Date(candidateMs);
    const observed = getWallClockParts(timeZone, candidate);

    // 후보 UTC 시각을 대상 타임존에서 봤을 때의 civil instant(마치 UTC인 것처럼 해석)와
    // 목표(00:00:00) 사이의 차이(ms)를 구해 후보를 보정한다.
    const observedAsUtcMs = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
      0
    );
    const targetAsUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    const diffMs = targetAsUtcMs - observedAsUtcMs;

    if (diffMs === 0) {
      return candidate;
    }

    candidateMs += diffMs;
  }

  return new Date(candidateMs);
}

/**
 * 주어진 UTC instant(`date`, 기본값 현재 시각)가 속한 "대상 타임존 기준 날짜"의
 * 자정(00:00:00, 대상 타임존 civil wall-clock)에 해당하는 UTC 순간을 반환한다.
 *
 * @param timeZone IANA 타임존 이름 (예: "Asia/Seoul", "Asia/Ho_Chi_Minh", "America/New_York")
 * @param date 기준 UTC instant. 생략 시 현재 시각(`new Date()`)을 사용한다.
 */
export function startOfDayInTimeZone(timeZone: string, date: Date = new Date()): Date {
  const { year, month, day } = getWallClockParts(timeZone, date);
  return utcInstantForCivilMidnight(timeZone, year, month, day);
}

/**
 * 주어진 UTC instant(`date`, 기본값 현재 시각)가 속한 "대상 타임존 기준 날짜"의 끝
 * (다음날 00:00:00 대상 타임존 civil wall-clock 직전, -1ms)에 해당하는 UTC 순간을 반환한다.
 *
 * @param timeZone IANA 타임존 이름 (예: "Asia/Seoul", "Asia/Ho_Chi_Minh", "America/New_York")
 * @param date 기준 UTC instant. 생략 시 현재 시각(`new Date()`)을 사용한다.
 */
export function endOfDayInTimeZone(timeZone: string, date: Date = new Date()): Date {
  const start = startOfDayInTimeZone(timeZone, date);
  // 시작 instant에서 24시간 뒤로 이동한 뒤, 그 시각이 속한 날짜의 자정을 다시 구해
  // "다음날 civil 자정"을 정확히 계산한다(DST로 하루가 23h/25h인 타임존이어도
  // 24h 뒤는 항상 다음날 안에 위치하므로 안전하다).
  const roughlyNextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const nextDayStart = startOfDayInTimeZone(timeZone, roughlyNextDay);
  return new Date(nextDayStart.getTime() - 1);
}
