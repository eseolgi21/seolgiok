/**
 * KST(한국 표준시, UTC+9, DST 없음) 기준 "오늘" 경계를 명시적으로 계산하는 유틸리티.
 *
 * 서버가 어느 타임존(Railway는 통상 UTC)에서 동작하든, `new Date(); setHours(0,0,0,0)`
 * 방식은 서버 로컬 타임존에 암묵적으로 의존해 날짜 경계가 어긋날 수 있다.
 * 이 모듈은 입력 시각을 KST 기준으로 변환해 자정 경계를 계산한다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 주어진 시각(기본: 현재 시각)이 속한 KST 날짜의 자정(00:00:00 KST)에 해당하는 UTC 순간을 반환한다. */
export function startOfKstDay(date: Date = new Date()): Date {
  const kstMs = date.getTime() + KST_OFFSET_MS;
  const kstDate = new Date(kstMs);
  const kstMidnightMs = Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    kstDate.getUTCDate(),
    0,
    0,
    0,
    0
  );
  return new Date(kstMidnightMs - KST_OFFSET_MS);
}

/** 주어진 시각(기본: 현재 시각)이 속한 KST 날짜의 끝(다음날 00:00:00 KST 직전)에 해당하는 UTC 순간을 반환한다. */
export function endOfKstDay(date: Date = new Date()): Date {
  const start = startOfKstDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
