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

## Surfaces — Operations (`/console`)

| Route | Page | Scope | Purpose |
|-------|------|-------|---------|
| `/console` | Command centre (`Dashboard`) | session | Office home, governance verdict, lifecycle counts, action queues, ledger, recent activity |
| `/console/create` | Create official record | render | 27 structured record types, classification, policy-derived procedure, AI assist (non-sensitive only), validate, submit |
| `/console/review` | Governance review | approve | Approval queue; approve / return / reject with rationale and confirmation |
| `/console/library` | Official records | read | Sortable, filterable register (state, search, sort in the URL) |
| `/console/archives` | Preservation | read | The register pinned to preserved records |
| `/console/documents/:id` | Record file | read | Standing, chain of authority, certificates, render & artifacts, versions, provenance; publish / preserve / withdraw (publish) |
| `/console/audit` | Evidence chain | audit | Append-only event trail, filterable, every recorded field |
| `/console/polished` | Document studio | session | Doorway to Polished Pages (`VITE_POLISHED_PAGES_URL`) |

Administration (`/admin`, `dispatch:admin`), Executive Evaluation (`/evaluate`) and
Platform Operations (`/operator`, `dispatch:platform`) are separate products.

Navigation is role-filtered: items appear only when the session's scopes permit
them. The API is the authority on every call.

## Design system

The Operations console is built on `src/components/console/` (tokens in
`tailwind.config.ts` → `sd.*`, scoped CSS under `.sd-console` in `src/index.css`).
See `docs/OPERATIONS-CONSOLE-REDESIGN.md` for the inventory, preservation
matrix, verification results and known defects.

Keyboard: `g` then `1`–`7` jumps between surfaces, `/` focuses search, `j`/`k`
move through the review queue and register, `o` opens the selected record, `?`
lists shortcuts.

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
