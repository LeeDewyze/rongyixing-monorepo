import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createRyxDevProxy } from "../../tooling/vite/ryx-dev-proxy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");

function normalizeViteBase(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw || raw === "/") return "/";
  if (raw === "." || raw === "./") return "./";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "https://app.rongtrip.cn";
  const appBase = normalizeViteBase(process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH);
  const devPort = Number(process.env.VITE_DEV_PORT ?? env.VITE_DEV_PORT ?? 5174);

  return {
    base: appBase,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@ryx/api": path.resolve(monorepoRoot, "packages/api/src/index.ts"),
        "@ryx/mock": path.resolve(monorepoRoot, "packages/mock/src/index.ts"),
        "@ryx/shared-types": path.resolve(monorepoRoot, "packages/shared-types/src/index.ts"),
      },
    },
    optimizeDeps: {
      exclude: ["@ryx/api", "@ryx/mock", "@ryx/shared-types"],
    },
    server: {
      port: Number.isFinite(devPort) ? devPort : 5174,
      proxy: createRyxDevProxy({
        apiBase,
        apiDomain: env.VITE_API_DOMAIN,
      }),
    },
  };
});
