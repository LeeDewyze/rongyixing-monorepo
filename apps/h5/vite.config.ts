import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");
const appPackage = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8")) as {
  version?: string;
};

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
  WorkflowApiUrl: "http://api-workflow.rtesp.com",
  ApiMemberUrl: "http://member-api.rtesp.com",
  ApiAccountUrl: "http://account-api.rtesp.com",
  HrApiUrl: "http://api-hr.rtesp.com",
  ApiPasswordUrl: "http://pass-api.rtesp.com",
  ApiLoginUrl: "http://login-api.rtesp.com",
  ApiHomeUrl: DEV_API_HOME_TARGET,
  FeatureRonglvUrl: DEV_JYX_PROXY_TARGET,
  TmcTouristFlightUrl: "http://flight-tourist-tmc.rtesp.com",
  TmcTouristTrainUrl: "http://train-tourist-tmc.rtesp.com",
  TmcTouristHotelUrl: "http://hotel-tourist-tmc.rtesp.com",
  TmcTouristBookUrl: "http://book-tourist-tmc.rtesp.com",
  TmcTouristOrderUrl: "http://order-tourist-tmc.rtesp.com",
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

function normalizeViteBase(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "https://app.rongtrip.cn";
  const appBase = normalizeViteBase(process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH);

  return {
    base: appBase,
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(appPackage.version ?? "0.0.0"),
    },
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
