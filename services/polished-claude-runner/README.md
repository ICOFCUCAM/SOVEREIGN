# Claude Studio runner

The Polished Pages owner's private Claude Code, reached from the admin page
**Claude Studio** (`/admin/claude`). It runs the official Claude Code CLI with
the owner's own Claude subscription, so uploads, summaries, rewrites, citations
and chat do not call the Anthropic API and are not billed per use. They count
against the owner's Claude plan limits instead.

**For the owner's own use only.** Anthropic's terms allow a subscriber to use
Claude Code with their own subscription; they do not allow routing other
people's requests through it. That is why the runner admits exactly one
account: the one on `RUNNER_ADMIN_USER_IDS` that Polished Pages also lists as an
admin. Never add customers to it.

## What it does

- **Projects**: upload PDFs, Word files, text or Markdown; Claude reads the
  extracted text and can open the original.
- **Summarise**, **Rewrite** (whole books, chapter by chapter, under strict
  instructions kept in `INSTRUCTIONS.md`), **Citations & references** (searched
  and opened on the web, in APA, Chicago, MLA, Harvard, SBL, IEEE or Vancouver),
  and **chat** that remembers the project.
- **Book wizard**: the site's own Book Creator (setup, outline, writing,
  improve, preview, export, cover, production, publish) with its outline,
  chapter and improve steps written by Claude Code. Each chapter is written
  after reading the chapters before it. Covers, audiobook voices and
  translations and repurposing still use the site's own services.
- **More tools**: proofread & copy-edit, fact-check, verify quotations &
  scripture (against a chosen Bible translation), translate the whole book,
  marketing pack, study guide, index & glossary, compare two versions,
  readability review, and read scanned pages (Claude Code only).
- **Manuscript**: write a book as sections (front matter, chapters, back
  matter). Claude expands a section, adds citations, rewrites it in the
  owner's voice, edits it as asked, or drafts standard sections (preface,
  introduction, bibliography, notes, glossary, index, discussion questions,
  about the author…). Suggestions are accepted or discarded; accepted work is
  kept as authorship notes. `GET/PUT /v1/threads/:id/manuscript` stores it and
  mirrors one Markdown file per section under `work/manuscript/`.
- **My voice**: a style guide learned from the owner's own books
  (`GET/PUT /v1/voice`), used by "Rewrite in my voice" and "In my voice". It
  makes AI-assisted text read like the author; it doesn't hide AI use.
- **Join files** (in the browser): PDFs and scans into one PDF, Word files into
  one Word file, or any mix into one book.
- Results are saved to the Library as books, where every book tool applies.

## Engine switch: Claude Code or the API

The page header always shows the engine in use and why. **Auto** uses this
runner's Claude Code whenever it works and switches to the API (the
`studio-api` Supabase function, admin-only, billed per use on the site's
`ANTHROPIC_API_KEY`) when Claude Code is signed out, has reached the plan's
usage limit (until its reset time), or the runner can't be reached. **Claude
Code only** and **API only** force one engine. The runner reports what it
last saw at `GET /v1/me` (`claude.state`: `ok`, `signed_out`, `limit` with
`resetsAt`, `not_configured`). Every reply in a project is labelled with the
engine that wrote it; API results are recorded into the same project
(`POST /v1/threads/:id/record`). When the runner is offline, projects are kept
in the browser until it is back.

## What Claude can and cannot do here

Each project has its own folder. Claude Code runs inside it with:

- tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, TodoWrite. No shell,
  no code execution, no MCP servers (`--restricted`, `--tools`, `--strict-mcp-config`);
- `--permission-mode dontAsk`: anything not pre-approved is refused;
- read and write only inside the project folder, never the uploaded originals,
  with extra walls around `/etc`, `/proc`, `/root`, `/home` and the like;
- a fresh environment holding only the Claude Code token, so it never sees this
  server's settings and an `ANTHROPIC_API_KEY` can never redirect billing.

Uploaded documents and web pages are treated as material, never as instructions.
Citations must come from sources Claude actually opened; unsupported claims are
marked `[citation needed]`.

## Deploy

1. On your own computer, with Claude Code installed and signed in to your
   subscription, run `claude setup-token`. It prints a token valid for a year.
   Keep it secret.
2. Deploy this folder's `Dockerfile` (DeployPro, Render, Fly or any Docker host)
   with a **persistent volume mounted at `/data`** (projects and Claude's
   conversation history live there).
3. Set these environment variables on the service:

   | Variable | Value |
   | --- | --- |
   | `CLAUDE_CODE_OAUTH_TOKEN` | the token from step 1 |
   | `SUPABASE_URL` | the Polished Pages Supabase URL |
   | `SUPABASE_ANON_KEY` | the Supabase publishable (anon) key |
   | `RUNNER_ADMIN_USER_IDS` | the owner's Supabase user id |
   | `ALLOWED_ORIGINS` | the Polished Pages site: `https://polishedpages.vercel.app` (comma-separate any custom domain too) |
   | `JOB_TIMEOUT_MIN` | optional, default `240` (a whole book can take hours) |
   | `MAX_UPLOAD_MB` | optional, default `40` |
   | `CLAUDE_MODEL` | optional, e.g. `opus`; default is Claude Code's default |

   Do **not** set `ANTHROPIC_API_KEY` on this service.
4. In the Polished Pages site (Vercel), set `VITE_CLAUDE_RUNNER_URL` to the
   runner's public HTTPS address and redeploy.
5. Open `/admin/claude` signed in as the owner. The page says whether the
   runner and Claude Code are connected.

The token expires after a year: run `claude setup-token` again and replace it.

## Develop and test

```sh
npm test        # uses test/fake-claude.mjs in place of the real CLI
```
