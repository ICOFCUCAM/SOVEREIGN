# Web — Public Landing Site

The public front door of the Sovereign platform. Next.js (App Router) + Tailwind, cinematic
dark theme. Hero → three-layer overview → **pricing** → CTA into the developer console.

## Pricing is single-sourced

The pricing cards render from `PLAN_CATALOG` in `@sovereign/api-platform/billing` — the exact
catalog the API enforces (quota, connected accounts, scopes). The marketing page cannot drift
from what a key actually grants. "Choose plan" links to the developer console
(`NEXT_PUBLIC_PORTAL_URL`) with `?plan=<id>`; Enterprise is a contact link.

## Run

```bash
cd sovereign-os
npm install
npm run web:dev        # http://localhost:3002
```

Env: `NEXT_PUBLIC_PORTAL_URL` — the deployed developer-portal URL (used by the header + plan
CTAs). Defaults to `#` for local preview.

## Status

`next build` passes (static). Not browser-verified in CI. Plan checkout currently routes to
the console to mint a key; wiring **Stripe Checkout** (the `billing-webhook` already maps
subscription events → plan) is the next step to take payment before issuing the key.
