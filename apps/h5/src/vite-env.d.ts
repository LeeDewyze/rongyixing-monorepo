/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_MODE?: "mock" | "proxy" | "direct";
  readonly VITE_API_MOCK_DELAY?: string;
  readonly VITE_API_DOMAIN?: string;
  readonly VITE_API_ROOT?: string;
  readonly VITE_API_LANGUAGE?: string;
  readonly VITE_DEV_DEVICE_NAME?: string;
  readonly VITE_PROXY_EXTRA_FIELDS?: string;
}

declare const __APP_VERSION__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
