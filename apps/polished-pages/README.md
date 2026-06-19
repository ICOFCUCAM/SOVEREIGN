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
