-- Backfill: 인수인계(Handover) 관련 5개 테이블의 storeId를 "본점" Store로 채운다.
-- Phase 1(20260706215500_redesign_store_multi_tenant)에서 생성된 단일 "본점" Store를 재사용한다.
-- 이 시점까지는 단일 매장 운영이었으므로 전 행이 동일 storeId로 귀속되어도 데이터 무결성 위반이 없다.
--
-- id를 하드코딩하지 않고 name='본점'으로 동적 조회한다. 신선한(shadow) 데이터베이스 등
-- "본점" Store 행이 아직 없는 환경에서도 안전하게 재현되도록, 없으면 먼저 생성한다
-- (이미 존재하는 실제 개발/운영 DB에서는 이 INSERT가 아무 영향도 주지 않는다).
INSERT INTO "Store" ("id", "name", "latitude", "longitude", "radiusMeters", "timezone", "isActive", "updatedAt", "createdAt")
SELECT 'cmr9cpq4s0000eqtl1x5ckk9q', '본점', 37.5665, 126.978, 100, 'Asia/Seoul', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Store" WHERE "name" = '본점');

UPDATE "HandoverItem" AS t
SET "storeId" = s."id"
FROM (SELECT "id" FROM "Store" WHERE "name" = '본점' ORDER BY "createdAt" ASC LIMIT 1) AS s
WHERE t."storeId" IS NULL;

UPDATE "HandoverShiftSlot" AS t
SET "storeId" = s."id"
FROM (SELECT "id" FROM "Store" WHERE "name" = '본점' ORDER BY "createdAt" ASC LIMIT 1) AS s
WHERE t."storeId" IS NULL;

UPDATE "HandoverCheck" AS t
SET "storeId" = s."id"
FROM (SELECT "id" FROM "Store" WHERE "name" = '본점' ORDER BY "createdAt" ASC LIMIT 1) AS s
WHERE t."storeId" IS NULL;

UPDATE "HandoverComment" AS t
SET "storeId" = s."id"
FROM (SELECT "id" FROM "Store" WHERE "name" = '본점' ORDER BY "createdAt" ASC LIMIT 1) AS s
WHERE t."storeId" IS NULL;

UPDATE "HandoverApproval" AS t
SET "storeId" = s."id"
FROM (SELECT "id" FROM "Store" WHERE "name" = '본점' ORDER BY "createdAt" ASC LIMIT 1) AS s
WHERE t."storeId" IS NULL;
