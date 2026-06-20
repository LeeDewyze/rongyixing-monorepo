import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Vite `/Jyx` dev proxy origin — must match `/Home/Setting` LoginUrl host for rtesp test. */
const DEV_JYX_PROXY_TARGET = "http://ronglv-feature.rtesp.com";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "https://app.rongtrip.cn";

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
          target: DEV_JYX_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
