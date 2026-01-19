import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [
      ["**/src/test/lib/**/*.test.ts", "node"],
      ["**/src/test/features/**/*.test.ts", "node"],
      ["**/src/test/app/**/*.test.ts", "node"],
    ],
    include: ["src/test/**/*.test.ts", "src/test/**/*.spec.ts"],
    clearMocks: true,
  },
});
