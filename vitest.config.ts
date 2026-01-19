import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["src/test/**/*.test.ts", "src/test/**/*.spec.ts"],
    clearMocks: true,
  },
});
