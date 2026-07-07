/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default intern slug for calendar and other intern-scoped pages. */
  readonly VITE_DEFAULT_INTERN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
