import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

const shared = {
  resolve: {
    alias: {
      "@": src,
      "server-only": `${src}/test/server-only.ts`,
    },
  },
};

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        ...shared,
        test: {
          name: "backend",
          environment: "node",
          include: ["src/server/**/*.test.ts", "src/trpc/**/*.test.ts", "src/app/api/**/*.test.ts"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
      {
        ...shared,
        plugins: [react()],
        test: {
          name: "frontend",
          environment: "jsdom",
          include: ["src/app/**/*.test.tsx"],
          setupFiles: ["src/test/setup.ts", "src/test/setup-dom.ts"],
        },
      },
    ],
  },
});
