/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISPATCH_API_URL?: string;
  // Deployed address of the standalone Polished Pages product; the console's
  // Polished Pages department links out to it.
  readonly VITE_POLISHED_PAGES_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
