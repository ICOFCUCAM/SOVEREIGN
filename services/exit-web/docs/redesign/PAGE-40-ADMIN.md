# ExitOS redesign · Page 40 — Admin Console

| | |
|---|---|
| Route | `/console/admin` |
| Component | `src/pages/Admin.tsx` (189 lines) + `lib/distribution-engine.ts` (`exit-social-dispatch` status and publish history), `lib/social-publish.ts` |
| NAV | "Admin Console", group Admin, **admin only** (verified: a founder is redirected to `/console`) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `f0e1238`)

### How it was tested
Signed in as the dev operator (`ops@example.com` → superadmin). All Supabase function calls are stubbed; the distribution engine's status is stubbed as "none connected" and as "LinkedIn connected".
*Disclosure:* in the first Page 40 run, and in the Page 38 runs, the test script let the shell's read-only status request (`GET …/functions/v1/exit-social-dispatch`) reach the production endpoint; no data was written. The script was corrected before any further test.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Account roster: "Platform owner", "**James Okafor** — founder@helios.co", "**Dana Reyes** — dana@northwind.io", "Amazon Strategic — corpdev@amazon-strategic.com", "**Pritzker Private Capital — deals@pritzker.com**", "Ops · Calibration — ops@exitos.com" | hard-coded `SEED` (a code comment says "illustrative data in demo mode") | **Invented accounts presented as the roster**, two on real company domains (`pritzker.com`); no label on the page; there is no account directory API |
| KPIs "6 accounts · 2 founders · 2 buyers · 4/6 Pro" | the seed | Invented |
| "**Create admin**" → toast "Admin account created for …" | adds a row to page state | **False** — no account is created and no access is granted (roles are synthesized in the browser; admin elevation exists only for the dev operator email) |
| "Platform status: Engines **operational** · Marketplace **operational** · Identity / SSO demo mode" (green dots) | hard-coded | **Fake status** — nothing is checked |
| Distribution Engine: connection per channel, endpoint, recent publishes | `GET exit-social-dispatch` (real status), publish history in this browser | Real ✓ — but unconnected channels read "**Activating**" (nothing is activating) and connected ones "N channel(s) **live**" |

### Baseline (superadmin)
`h1` 1 · axe 0 · **overflow at 390** · 0 errors; old components (`Card`, `Kpi`, `SectionHeader`).

## Gap register — Page 40
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented roster presented as real, on real domains.** | Label it "Sample roster — illustrative, not real users; ExitOS has no account directory yet"; emails on reserved `example.com`; KPIs say "sample". | ☑ `9cb8554` |
| G2 | **"Create admin" provisions nothing.** | "Add to sample roster" with the plain statement that it creates no account and grants no access (admin roles are not server-side yet; in development the operator email is set by `VITE_EXITOS_DEV_OPERATOR_EMAIL`); validate the email. | ☑ `efce16c` |
| G3 | **Hard-coded "operational" status.** | Facts instead of health: engines run in the browser (nothing to monitor); marketplace storage = exchange backend or this browser (`listingDestination()`); identity = demo sessions created in the browser. | ☑ `1316e7b` |
| G4 | Distribution wording ("Activating", "live"). | "Not connected" / "N channel(s) connected". | ☐ |
| G5 | Design: old components; overflow at 390. | Rebuild on `xo`. | ☑ `298b49b` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Admin.tsx` rebuilt on `xo` (`PageHeader` `h1`; four metrics; provisioning form with `label`/`id` pairs; the roster as a table with row headers in a `ScrollRegion` (fixes the 390 overflow); platform status and the distribution engine as titled `Section`s with `dl`/lists; publish results in words ("✓ published" / "✗ failed"); the "view" link carries the channel in its accessible name; hex and shared components replaced). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium superadmin, all function calls stubbed (distribution status "none connected" and "LinkedIn connected") at 1440/390: 0 errors, `h1` 1, **no overflow** (was overflowing at 390), axe 0.

### G1 — Invented roster presented as real, on real domains
*Closed by:* `pages/Admin.tsx`. The roster is labelled **"Accounts — sample roster"** with a Sample badge and the foot "Illustrative accounts, not real users. ExitOS has no account directory yet; a real roster needs a server-side identity service."; the four KPIs say "sample" (Accounts carries a Demo data tag); the page description says "A sample account roster (illustrative)". The invented people and real-domain addresses are replaced by role samples on the reserved `example.com` domain ("James Okafor — founder@helios.co" → "Sample founder · Helios Freight — founder.helios@example.com"; "Pritzker Private Capital — deals@pritzker.com" → "Sample buyer · private capital — buyer.capital@example.com"; likewise northwind.io, amazon-strategic.com, exitos.com; the form placeholder too). File comment corrected.
*Verification:* `tsc -b`, eslint clean · Chromium superadmin (stubbed): the labelled roster and foot shown; 0 `pritzker.com`, `helios.co`, `northwind.io`, `amazon-strategic.com`, `exitos.com` in the page source · 1440/390: axe 0, no overflow, 0 errors.

### G2 — "Create admin" provisions nothing
*Closed by:* `pages/Admin.tsx`. The button "Create admin" → **"Add to sample roster"**; the section carries a "Not wired" badge and the foot "This adds a row to the sample roster on this page — it does not create an account or grant access. Admin roles are not server-side yet; in local development the operator email is set by VITE_EXITOS_DEV_OPERATOR_EMAIL."; the toast "Admin account created for …" → "Added to the sample roster — no account was created". The email is validated (format and duplicates) with a described message and `aria-invalid`; the button stays disabled until name and email are valid.
*Verification:* `tsc -b`, eslint clean · Chromium superadmin (stubbed) 1440/390: "not-an-email" → "Enter an email address, e.g. operator@example.com.", invalid, disabled; "owner@example.com" → "That email is already in the sample roster.", disabled; "new.op@example.com" → valid; adding shows the new toast and 7 rows; axe 0; 0 errors.

### G3 — Hard-coded "operational" status
*Closed by:* `pages/Admin.tsx`. "Platform status — Engines operational · Marketplace operational · Identity / SSO demo mode" with green dots (nothing was checked) → **"Platform configuration"** with facts: Engines — "Run in the browser" (no engine service to monitor); Marketplace storage — "Exchange backend" or "This browser" from `listingDestination()` (here: "This browser — no backend is configured …"); Identity — "Demo sessions" (no SSO or server-side role service yet); foot "Facts about how this console runs — not health checks. No service is monitored from here."
*Verification:* `tsc -b`, eslint clean · Chromium superadmin (stubbed): 0 "operational"; the three facts shown, storage "This browser" on the dev server (no Supabase configuration) · 1440/390: axe 0, no overflow, 0 errors.
