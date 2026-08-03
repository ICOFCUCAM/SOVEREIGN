# Sovereign Dispatch — Console (`dispatch-web`)

The operator + governance UI for Sovereign Dispatch. A standalone Vite + React +
Tailwind SPA, **separate from the Sovereign marketing website** and from
`dispatch-api`. It talks only to the Dispatch API (`/v1/*`) and carries its own
institutional identity (dense, classification-forward — not the cinematic
Sovereign theme).

Dispatch is **institutional trust infrastructure, not a word processor**.
The console is organised around the publication lifecycle, not file editing:

```
Submit → Govern → Approve → Render → Publish → Retrieve
```

## Surfaces

| Route | Page | Scope | Purpose |
|-------|------|-------|---------|
| `/` | Dashboard | read | Lifecycle queues; "needs my action" first |
| `/submit` | Submit | render | Classify, choose outputs, dry-run validate, submit (DDM payload) |
| `/review` | Review & Approve | approve | Approval inbox; approve / return / reject with comment |
| `/library` | Library | read | Published + archived documents; filter by state/type/title |
| `/documents/:id` | Document | read | Versions, render status, artifact download (grants), publish/withdraw, provenance |
| `/audit` | Audit | audit | Append-only event trail, filterable |

Navigation is role-filtered: items appear only when the session's scopes permit
them, so an author sees the operator surface and an auditor the governance one.

## Auth

Client-credentials sign-in: a Dispatch service `client_id` + `secret` is
exchanged via `POST /v1/token` for a short-lived JWT held **in memory only**
(never `localStorage`), appropriate for classified material. Human SSO (Supabase
user JWT) plugs into `src/lib/auth.tsx` later without touching the rest of the app.

## Develop

```bash
npm install
npm run dev          # http://127.0.0.1:5174 — proxies /v1 → http://127.0.0.1:8787
```

The dev server proxies `/v1` to the API (see `vite.config.ts`), so the browser
stays same-origin and no token leaves the first-party context. Point the proxy
elsewhere with `VITE_DISPATCH_API_URL`.

## Build & deploy

```bash
npm run build        # → dist/  (static)
docker build -t dispatch-web --build-arg VITE_DISPATCH_API_URL=https://api.example .
```

The Docker image serves the static bundle with nginx (`nginx.conf` includes the
SPA fallback and a commented `/v1` proxy block for co-deployment behind a single
gateway). Deploy as its own service alongside `dispatch-api` and `dispatch-worker`.
