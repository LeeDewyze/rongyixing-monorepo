import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Vite `/Jyx` proxy target must be an origin only (no path). */
function getFeatureRonglvOrigin(env: Record<string, string>): string {
  const fallbackLoginUrl =
    env.VITE_LOGIN_URL?.trim() || "http://ronglv-feature.rtesp.com/Jyx/LoginByRyx";
  const raw = env.VITE_FEATURE_RONGlv_URL?.trim() || fallbackLoginUrl;
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/Jyx\/.*$/, "").replace(/\/$/, "");
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "https://app.rongtrip.cn";
  const featureRonglvUrl = getFeatureRonglvOrigin(env);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/Home": {
          target: apiBase,
          changeOrigin: true,
        },
        "/Jyx": {
          target: featureRonglvUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
