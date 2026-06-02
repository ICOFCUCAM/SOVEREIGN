# ExitOS · `services/exit-web`

The operating system founders interact with to run an exit. Standalone
Vite/React SPA — separate deployable from the Sovereign marketing site
and from `exit-api` (when that service exists). Mirrors the
`services/dispatch-web` shape (Dockerfile + nginx SPA fallback) so it
slots into the same container-based deployment story.

Subdomain: `exit.sovereigndo.com`.

## Surface

| Path | Surface | Module |
|---|---|---|
| `/` | Marketing landing | — |
| `/console` | Founder Dashboard | M09 |
| `/console/intelligence` | Acquisition Intelligence Engine | M01 |
| `/console/data-room` | Virtual Data Room | M02 |
| `/console/buyers` | Buyer Marketplace | M03 |
| `/console/investors` | Investor CRM | M04 |
| `/console/negotiator` | AI Deal Negotiator | M05 |
| `/console/documents` | Document Generator | M06 |
| `/console/nda` | NDA Automation | M07 |
| `/console/pipeline` | Acquisition Pipeline | M08 |
| `/console/closing` | Deal Closing Center | M10 |

## Identity

Distinct from Dispatch's government-gold palette:

- **Deal accent** — emerald (`deal-300 / 500 / 700`) for closed/positive states
- **Urgency accent** — amber (`loi-300 / 400 / 500`) for LOI / hot lead states
- **Stage chromas** — `stage-sourcing` slate → `stage-engaged` sky → `stage-diligence` amber → `stage-loi` violet → `stage-signed/closed` emerald → `stage-dead` gray
- Display: Fraunces serif for marketing headers, Inter for the console

## Boundary

This package is the **console SPA only**. The forthcoming `exit-api`
service backs it (currently a placeholder bearer-token model in
`src/lib/auth.tsx`). The marketing landing imports nothing from the
console; the console mounts at `/console/*` and is gated behind the
auth provider.

## Dev

```
cd services/exit-web
npm install
npm run dev   # serves on 5175
```

The Vite dev server proxies `/v1` to `http://127.0.0.1:8788` so the
console talks same-origin when the API runs locally. Production builds
bake `VITE_EXIT_API_URL` and the proxy is unused.

## Production

Containerized via the Dockerfile. nginx serves the SPA with the
standard fallback so client-side routes resolve. When co-deployed
behind a gateway that also fronts `exit-api`, uncomment the `/v1`
location in `nginx.conf` so the browser stays same-origin and the
token never leaves the first-party context.
