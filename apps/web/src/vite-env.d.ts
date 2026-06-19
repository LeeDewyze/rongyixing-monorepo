/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_MODE?: "mock" | "proxy" | "direct";
  readonly VITE_API_MOCK_DELAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
