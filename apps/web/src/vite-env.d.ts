/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly BASE_URL: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_VCONSOLE?: string;
  readonly VITE_VCONSOLE_TAP_TO_ENABLE?: string;
  readonly VITE_API_MODE?: "mock" | "proxy" | "direct";
  readonly VITE_FORCE_API_MODE?: "mock" | "proxy" | "direct";
  readonly VITE_API_MOCK_DELAY?: string;
  readonly VITE_TMC_ID?: string;
}

declare const __APP_VERSION__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
