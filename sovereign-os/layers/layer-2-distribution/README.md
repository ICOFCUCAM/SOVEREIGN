# Layer 2 — Sovereign Distribution Grid

Enterprise multi-platform publishing built around Layer 1's media output and the shared
`pipeline_jobs` queue.

- `functions/post-campaign` — migrated working seed. Publishes a campaign to its channel;
  LinkedIn and YouTube paths are live, others record publish intent and report dormant.
- `adapters/index.ts` — uniform `PlatformAdapter.publish(campaign)` contract with a typed
  entry for all 11 target platforms (LinkedIn, X, Instagram, Facebook, TikTok, YouTube,
  Threads, Telegram, WhatsApp, Pinterest, Bluesky). Each is a seam until its credentials
  and API calls are implemented.

Planned: AI scheduling, smart reposting, engagement tracking, campaign synchronization,
audience targeting, enterprise white-label APIs — each as `kind: 'campaign'` queue jobs.
