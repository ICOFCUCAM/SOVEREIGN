import type { Scope } from './scopes.js';

// The platform's own developer-facing entities (users of OUR API), modeled on the
// Ayrshare surface (clients, keys, social accounts, webhooks) but self-owned.

export type Plan = 'free' | 'basic' | 'pro' | 'enterprise';
export type ClientStatus = 'active' | 'suspended';
export type KeyStatus = 'active' | 'revoked';

export interface ApiClient {
  id: string;
  name: string;
  owner_email: string;
  plan: Plan;
  status: ClientStatus;
  created_at?: string;
}

export interface ApiKeyRecord {
  id: string;
  client_id: string;
  /** Public display prefix; the full key + its hash are never returned after issue. */
  prefix: string;
  last4: string;
  scopes: Scope[];
  status: KeyStatus;
  rate_limit_per_month: number;
  created_at?: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
}

/** A platform connected on behalf of a client — the social-token vault. */
export interface SocialConnection {
  id: string;
  client_id: string;
  platform: string;
  /** Stored encrypted at rest; never returned to clients. */
  access_token: string;
  refresh_token?: string | null;
  external_account_id?: string | null;
  expires_at?: string | null;
  created_at?: string;
}

export interface Webhook {
  id: string;
  client_id: string;
  url: string;
  events: string[]; // e.g. ["post.published", "job.done"]
  secret: string; // for HMAC signature of deliveries
  status: 'active' | 'paused';
  created_at?: string;
}
