import { defineConfig } from "@playwright/test";
import path from "node:path";
const testData = path.join(process.cwd(), ".papermotion/browser-tests");
process.env.PAPERMOTION_DATA_DIR = testData;
export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:3100", headless: true },
  webServer: [
    {
      command: "npx tsx tests/helpers/tutorModelServer.ts",
      url: "http://127.0.0.1:3199/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        PAPERMOTION_DATA_DIR: testData,
        PAPERMOTION_TEST_BUILD: "1",
        OPENAI_API_KEY: "",
        OPENAI_TUTOR_API_KEY: "test-only-key",
        OPENAI_TUTOR_BASE_URL: "http://127.0.0.1:3199/v1",
      },
    },
  ],
});
