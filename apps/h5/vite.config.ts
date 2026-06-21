import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");

/** Vite `/Jyx` dev proxy origin — must match `/Home/Setting` LoginUrl host for rtesp test. */
const DEV_JYX_PROXY_TARGET = "http://ronglv-feature.rtesp.com";

/** ApiHomeUrl host for Identity-* direct calls (rtesp test). */
const DEV_API_HOME_TARGET = "http://api.rtesp.com";

/**
 * Legacy Urls.* → rtesp test hosts. Keys must match Method prefixes (TmcApiHotelUrl, etc.).
 * Dev requests use `/__ryx/{urlKey}/...` from resolve-url when baseUrl is empty.
 */
const DEV_RYX_SERVICE_TARGETS: Record<string, string> = {
  TmcApiHomeUrl: "http://api-tmc.rtesp.com",
  TmcApiHotelUrl: "http://hotel-api-tmc.rtesp.com",
  TmcApiFlightUrl: "http://flight-api-tmc.rtesp.com",
  TmcApiTrainUrl: "http://train-api-tmc.rtesp.com",
  TmcApiBookUrl: "http://book-api-tmc.rtesp.com",
  TmcApiOrderUrl: "http://order-api-tmc.rtesp.com",
  ApiMemberUrl: "http://member-api.rtesp.com",
  ApiHomeUrl: DEV_API_HOME_TARGET,
};

function createRyxServiceProxies(): Record<string, object> {
  const proxies: Record<string, object> = {};
  for (const [key, target] of Object.entries(DEV_RYX_SERVICE_TARGETS)) {
    const prefix = `/__ryx/${key}`;
    proxies[prefix] = {
      target,
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.slice(prefix.length) || "/",
    };
  }
  return proxies;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "https://app.rongtrip.cn";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Dev: use package source so new API/mock handlers work without rebuilding dist.
        "@ryx/api": path.resolve(monorepoRoot, "packages/api/src/index.ts"),
        "@ryx/mock": path.resolve(monorepoRoot, "packages/mock/src/index.ts"),
        "@ryx/shared-types": path.resolve(monorepoRoot, "packages/shared-types/src/index.ts"),
      },
    },
    optimizeDeps: {
      exclude: ["@ryx/api", "@ryx/mock", "@ryx/shared-types"],
    },
    server: {
      port: 5173,
      proxy: {
        "/Home/Proxy": {
          target: apiBase,
          changeOrigin: true,
        },
        "/Home/Setting": {
          target: apiBase,
          changeOrigin: true,
        },
        ...createRyxServiceProxies(),
        "/Identity": {
          target: DEV_API_HOME_TARGET,
          changeOrigin: true,
        },
        "/Jyx": {
          target: DEV_JYX_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
