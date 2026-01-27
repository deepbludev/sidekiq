import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/env.js"],
    },
  },
  resolve: {
    alias: [
      {
        find: /^@sidekiq\/chats$/,
        replacement: path.resolve(__dirname, "./src/features/chats/index.ts"),
      },
      {
        find: /^@sidekiq\/chats\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/chats/$1"),
      },
      {
        find: /^@sidekiq\/sidekiqs$/,
        replacement: path.resolve(
          __dirname,
          "./src/features/sidekiqs/index.ts",
        ),
      },
      {
        find: /^@sidekiq\/sidekiqs\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/sidekiqs/$1"),
      },
      {
        find: /^@sidekiq\/auth$/,
        replacement: path.resolve(__dirname, "./src/features/auth/index.ts"),
      },
      {
        find: /^@sidekiq\/auth\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/auth/$1"),
      },
      {
        find: /^@sidekiq\/user$/,
        replacement: path.resolve(__dirname, "./src/features/user/index.ts"),
      },
      {
        find: /^@sidekiq\/user\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/user/$1"),
      },
      {
        find: /^@sidekiq\/ai$/,
        replacement: path.resolve(__dirname, "./src/features/ai/index.ts"),
      },
      {
        find: /^@sidekiq\/ai\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/ai/$1"),
      },
      {
        find: /^@sidekiq\/workspace$/,
        replacement: path.resolve(
          __dirname,
          "./src/features/workspace/index.ts",
        ),
      },
      {
        find: /^@sidekiq\/workspace\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/workspace/$1"),
      },
      {
        find: /^@sidekiq\/billing$/,
        replacement: path.resolve(__dirname, "./src/features/billing/index.ts"),
      },
      {
        find: /^@sidekiq\/billing\/(.*)/,
        replacement: path.resolve(__dirname, "./src/features/billing/$1"),
      },
      {
        find: /^@sidekiq\/shared\/(.*)/,
        replacement: path.resolve(__dirname, "./src/shared/$1"),
      },
      {
        find: /^@sidekiq\/ui\/(.*)/,
        replacement: path.resolve(__dirname, "./src/shared/ui/$1"),
      },
      {
        find: /^@sidekiq\/(.*)/,
        replacement: path.resolve(__dirname, "./src/$1"),
      },
    ],
  },
});
