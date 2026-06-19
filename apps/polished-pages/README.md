# Polished Pages

The standalone document studio: AI-assisted **CV**, **cover letter**, and **book**
generation. It is a sibling product to Sovereign Dispatch — Dispatch handles
institutional documents (executive briefings, board reports, policy papers),
Polished Pages handles consumer documents.

## Architecture

- **Frontend** — Vite + React + shadcn/ui (`src/`). Pages: CV Generator, Cover
  Letter Generator, Book Creator.
- **Backend** — Supabase Edge Functions (`supabase/functions/`). The generators
  call a language model; the export functions render DOCX/book files.

Polished Pages cannot function without a language model — a CV, cover letter, or
book is *generated* text, not a filled template. Every generator routes through
one shared adapter so the model provider is a deployment decision, not something
baked into each function.

## AI provider configuration

`supabase/functions/_shared/llm.ts` selects a provider by which secret is set:

| Priority | Secret              | Provider                                   |
| -------- | ------------------- | ------------------------------------------ |
| 1        | `ANTHROPIC_API_KEY` | Claude Messages API (primary, recommended) |
| 2        | `LOVABLE_API_KEY`   | Lovable AI gateway (fallback)              |

If neither is set, the functions return a clear 503 telling the operator to
configure a key — they never fabricate output.

Set the key as a Supabase function secret (not a Vite var — it must stay
server-side):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional model override (defaults to a current Claude model):
# supabase secrets set ANTHROPIC_MODEL=claude-...
```

Then deploy the functions:

```bash
supabase functions deploy generate-cv
supabase functions deploy generate-cover-letter
supabase functions deploy generate-book-outline
supabase functions deploy generate-book-chapter
supabase functions deploy improve-book-content
supabase functions deploy repurpose-content
```

(The `export-docx` and `export-book` functions need no AI key.)

## Accounts, plans & metering

Generation is metered per signed-in user, enforced server-side so the client can
never bypass it. The studio sits behind a sign-in gate (`AuthGate`); generation
requires a Supabase Auth user.

- **Schema:** `supabase/migrations/20260619120000_polished_entitlements.sql`
  creates the `polished` schema (`entitlements`, `usage_counters`) and two
  functions: `public.polished_consume_generation` (atomic check-and-increment,
  called by the engine with the service role) and `public.polished_my_status`
  (the signed-in user's plan + usage, for the account badge).
- **Free tier:** `polished.free_limit()` — currently **5 generations/month**.
  Set a user to unlimited with `update polished.entitlements set plan='pro'
  where user_id = '…';`.
- **No extra secret needed:** the engine reads the `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` that Supabase injects into every edge function.

Turn-on checklist:
1. Apply the migration (`supabase db push`, or it's already applied on SOVEREIGN).
2. Redeploy the six AI functions (they now require a user token and meter usage).
3. Ensure Email auth is enabled in the Supabase project (Authentication →
   Providers). For frictionless testing, disable "Confirm email".

**Not yet built — paid upgrade:** the gate enforces the free limit and exposes a
`plan` flag, but there is no checkout. Wiring Stripe (a `pro` entitlement on
successful payment) is the next step; until then "Pro" is set manually in the
database.

## Frontend environment

`.env` holds the public Supabase client config (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`). These are the anon
client values and are safe to ship to the browser. The AI provider key is **not**
here — it lives only in the function secrets above.

## Local development

```bash
npm install
npm run dev
```
