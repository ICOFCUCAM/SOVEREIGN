# Instructions for Claude agents working in this repository

## Binding specifications (implement strictly)
The owner has adopted these documents as binding. Read the relevant one before changing the area it covers, follow it exactly, and keep its checklist truthful (tick an item only when it is implemented and tested). Deviations need the owner's explicit approval, recorded in the document.

- **Claude Studio** (owner-only workspace, `apps/polished-pages/src/pages/ClaudeStudio.tsx`, `src/components/studio/**`, `services/polished-claude-runner`): `apps/polished-pages/docs/claude-studio/DESIGN-SPEC.md`
- **AI Teacher** (customer-facing book tutor): `apps/polished-pages/docs/ai-teacher/BLUEPRINT.md`

## Rules that always apply
- The Claude Code runner (`services/polished-claude-runner`) is for the owner only. Never expose it to customers, never make it reachable through a customer-facing parameter, never use it as a fallback for a customer feature. Never pass `ANTHROPIC_API_KEY` to its child process.
- API keys and credentials stay server-side (Supabase edge functions / runner environment). Never print secrets.
- Do not remove a feature without saying so to the owner; one place per feature (no duplicates).
- Never change an author's text without review; keep previous versions recoverable.
- Respect each book's rules (for the owner's books: Yahusha instead of Jesus, Yahuah instead of God, never Jehovah or Yahweh) in generated prose; never alter direct quotations blindly.
- Type-check the site with `npx tsc --noEmit -p tsconfig.app.json` in `apps/polished-pages` (`-p .` checks nothing). Run `npx vitest run` and `npm run build` there, and `npm test` in `services/polished-claude-runner`.
- Database migrations: apply them yourself (owner's standing instruction). Merge only when the owner says "merge".
