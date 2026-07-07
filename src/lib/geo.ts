/**
 * 지오펜싱(위치 기반) 거리 계산 유틸리티.
 * 외부 의존성 없는 순수 함수만 포함한다.
 */

const EARTH_RADIUS_METERS = 6371000;

export type GeoPoint = { lat: number; lng: number };

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 사이의 거리를 하버사인 공식으로 계산해 미터 단위로 반환한다. */
export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

/** 현재 좌표가 중심 좌표로부터 지정된 반경(미터) 이내인지 판정한다. */
export function isWithinRadius(
  current: GeoPoint,
  center: GeoPoint,
  radiusMeters: number
): boolean {
  return haversineDistanceMeters(current, center) <= radiusMeters;
}

/** 위도 값이 유효 범위(-90~90)인지 검증한다. */
export function isValidLatitude(v: number): boolean {
  return Number.isFinite(v) && v >= -90 && v <= 90;
}

/** 경도 값이 유효 범위(-180~180)인지 검증한다. */
export function isValidLongitude(v: number): boolean {
  return Number.isFinite(v) && v >= -180 && v <= 180;
}
