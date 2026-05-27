// Bridges the token vault to the adapters. A client's decrypted social connections are
// turned into the env shape each adapter reads, so publishCampaign(campaign, env) can
// publish on behalf of that specific client instead of from global server env.

export interface ResolvedConnection {
  platform: string;
  access_token: string;
  /** Per-platform extras stored alongside the token (chat id, author urn, board id, …). */
  meta?: Record<string, string>;
}

type EnvShape = Record<string, string>;

const MAPPERS: Record<string, (c: ResolvedConnection) => EnvShape> = {
  telegram: (c) => ({ TELEGRAM_BOT_TOKEN: c.access_token, TELEGRAM_CHAT_ID: c.meta?.chat_id ?? '' }),
  bluesky: (c) => ({ BLUESKY_IDENTIFIER: c.meta?.identifier ?? '', BLUESKY_APP_PASSWORD: c.access_token }),
  linkedin: (c) => ({ LINKEDIN_ACCESS_TOKEN: c.access_token, LINKEDIN_AUTHOR_URN: c.meta?.author_urn ?? '' }),
  x: (c) => ({ X_ACCESS_TOKEN: c.access_token }),
  facebook: (c) => ({ FACEBOOK_PAGE_TOKEN: c.access_token, FACEBOOK_PAGE_ID: c.meta?.page_id ?? '' }),
  instagram: (c) => ({ IG_ACCESS_TOKEN: c.access_token, IG_USER_ID: c.meta?.ig_user_id ?? '' }),
  pinterest: (c) => ({ PINTEREST_ACCESS_TOKEN: c.access_token, PINTEREST_BOARD_ID: c.meta?.board_id ?? '' }),
  threads: (c) => ({ THREADS_ACCESS_TOKEN: c.access_token, THREADS_USER_ID: c.meta?.threads_user_id ?? '' }),
};

/** Build an adapter-ready env from a client's resolved (decrypted) connections. */
export function credentialEnv(connections: ResolvedConnection[]): EnvShape {
  const env: EnvShape = {};
  for (const conn of connections) {
    const map = MAPPERS[conn.platform];
    if (map) Object.assign(env, map(conn));
  }
  return env;
}
