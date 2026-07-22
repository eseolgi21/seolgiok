import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test.local') });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const IS_REMOTE = BASE_URL.startsWith('https://');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 로컬도 1회 재시도 허용: signup.spec.ts에서 재현된 ECONNRESET(2026-07-22 조사, 아래 workers 주석 참고)은
  // assertion을 느슨하게 만드는 수정이 아니라 단일 dev 서버 과부하로 인한 일시적 연결 끊김에 대한
  // 표준적 방어책이다. 로직 결함을 가리는 게 아니라 결정적이지 않은 네트워크 계층 실패만 흡수한다.
  retries: 1,
  // 로컬 workers를 고정값(4)으로 제한: 이전엔 undefined로 Playwright가 CPU 코어 수 기반 자동 산정
  // (이 머신 10코어 → 약 5 workers)했는데, `webServer`가 단일 Next dev 서버 인스턴스라 모든 워커의
  // API 요청이 그 한 프로세스로 몰린다. signup 프로비저닝마다 bcrypt.hash(rounds=12, CPU-bound)가
  // 동시다발적으로 실행되며 이벤트 루프를 지연시켜, 2026-07-22 재현 테스트에서 signup.spec.ts의
  // POST /api/auth/signup 요청이 `ECONNRESET`으로 실패하는 사례(144 passed/1 failed/2 did not run)를
  // 관측했다(5회 중 1회). workers를 낮춰 서버 동시 부하를 줄인다 — src/의 bcrypt rounds 자체를
  // 낮추는 것은 보안 설정 변경이라 test-harness-engineer 권한 밖(domain-expert/security-expert 소관).
  workers: 4,
  reporter: [['html'], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\/public\/.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  // 원격 URL이면 webServer 생략 (이미 떠 있음)
  ...(IS_REMOTE ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  }),
});
