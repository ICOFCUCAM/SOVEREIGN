# ADR-015 — Internationalization (real localized content)

- **Status:** Accepted (foundation + French proof)
- **Date:** 2026-06-27
- **Relates:** ADR-014 (publishing platform — translation is a per-locale authoring pass)

## Context

The long-term vision is one site per language (en, fr, es, de, ar, pt, no, nl,
it, ja, zh), each with **real localized content** — not browser/auto translation,
which Google treats as thin/duplicate and which reads as machine slop. The user's
instruction: phase it, don't translate everything at once.

## Decision

**Locale-prefixed paths with a stable slug.** English is served at the root
(`/learn/official-publication`); other locales are prefixed
(`/fr/learn/official-publication`). The slug never changes across locales, so
hreflang is a clean derivation and a page keeps one identity in every language.

**A page exists in a locale only when a real translation exists.** No fake
fallback content is ever served under a locale URL:
- `/en/...` → redirect to the canonical root.
- unknown locale, or active locale without a translation for that slug →
  redirect to the English page.
- `hreflang` lists only the locales that genuinely have the page, plus
  `x-default` → English. It never advertises a language before its content ships.

**`ACTIVE_LOCALES` is the single switch.** A language goes live by adding its
translations and listing it active; hreflang and sitemaps derive from it.

**Translation is data, rendered by the same components.** Content layers are
data-driven, so a locale is a translations map `(locale, type, slug) →
fields`, merged over the English base. The proof ships French for four core
concept pages (`official-publication`, `evidence-chain`, `document-authenticity`,
`document-verification`) plus the page chrome, with an on-page EN/FR switcher,
`<html lang/dir>`, localized `<title>`/meta, and full hreflang.

## Scope of the first cut

- Concept pages (Layer 3) are localized end-to-end as the proof.
- The shared global header/footer chrome is **not** yet localized (it is a large
  bespoke component; localizing it is the next increment and is low-risk now that
  `t()` exists).
- Industries / Library / Docs reuse the exact same mechanism; they light up by
  adding their translations + a `/:lang/...` route, no new architecture.

## Consequences

- Real French pages rank as French, with correct hreflang and zero duplicate
  content — the right SEO posture.
- Scaling languages is an authoring + config task on the content-engine
  (translation = one more pipeline pass), not a rebuild.
- RTL is modelled (`dir`) for Arabic ahead of its content.

## Alternatives considered

- **Auto/browser translation** — rejected; thin-content / duplicate risk, and the
  user explicitly ruled it out.
- **Subdomains or ccTLDs per language** — rejected for now; path prefixes keep one
  deployment and one authority surface, and are trivial to migrate later.
- **Translate everything immediately** — rejected per the phased instruction;
  shipping a language before its content is the thing hreflang must never do.
