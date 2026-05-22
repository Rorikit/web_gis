/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GIS_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_ENABLE_MOCK_FALLBACK?: string;
  readonly VITE_MOCK_FALLBACK_MODULES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
