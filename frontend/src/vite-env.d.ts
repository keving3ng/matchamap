/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.yaml' {
  const content: Record<string, { dev: boolean; prod: boolean }>
  export default content
}
