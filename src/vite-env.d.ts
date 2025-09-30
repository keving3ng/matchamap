/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
