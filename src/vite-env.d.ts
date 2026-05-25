/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project API URL (overrides the baked-in default). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/publishable key (overrides the baked-in default). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Comma-separated canonical platform hosts that serve the console, not a tenant landing. */
  readonly VITE_PLATFORM_HOSTS?: string;
  /** Absolute origin of the canonical platform, for cross-domain links from a tenant. */
  readonly VITE_PLATFORM_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
