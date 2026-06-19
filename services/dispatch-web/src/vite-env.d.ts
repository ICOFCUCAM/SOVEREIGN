/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISPATCH_API_URL?: string;
  // Polished Pages department calls the SOVEREIGN Supabase edge functions
  // directly; these override the public defaults in lib/polished-pages.
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
