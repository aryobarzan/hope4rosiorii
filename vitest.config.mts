import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." alias as tsconfig.json
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // Unit tests sit next to the code they test
    include: [
      "*.test.ts",
      "lib/**/*.test.ts",
      "app/**/*.test.ts",
      "messages/**/*.test.ts",
    ],
  },
});
