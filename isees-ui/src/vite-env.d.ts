/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ISEES_CAPTURE_EDGE_ADDONS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
