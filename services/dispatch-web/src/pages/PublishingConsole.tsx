import React from "react";
import state from "../lib/publishing/state.json";

// The Publishing & Knowledge Platform — internal CMS face. Renders the live
// state exported by services/content-engine (`content.cjs export`) so an operator
// can see every capability of the platform in one place: the topic database,
// editorial workflow, AI authoring, verification, linking, schema, versioning,
// languages, the publishing pipeline, SEO distribution, ranking and the
// autonomous discovery loop. Read-only today; write actions (approve/publish)
// land on dispatch-api as the loop goes live.

const S = state as typeof state;

const card = "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6";
const kicker = "text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400";
const Cap: React.FC<{ n: number; title: string; children: React.ReactNode; sub?: string }> = ({ n, title, sub, children }) => (
  <section className={card}>
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="font-serif text-[1.2rem] font-bold text-white">{title}</h3>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">Capability {String(n).padStart(2, "0")}</span>
    </div>
    {sub && <p className="mt-1 text-[12.5px] text-white/45">{sub}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Pill: React.FC<{ on?: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${on ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/12 bg-white/[0.03] text-white/55"}`}>
    {on != null && <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-white/30"}`} />}{children}
  </span>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: "gold" | "emerald" | "plain" }> = ({ label, value, tone = "plain" }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
    <div className={`font-serif text-[1.7rem] font-bold leading-none ${tone === "gold" ? "text-gold-300" : tone === "emerald" ? "text-emerald-300" : "text-white"}`}>{value}</div>
    <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</div>
  </div>
);

const Bar: React.FC<{ value: number; max: number }> = ({ value, max }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-gold-500/70 to-gold-300" style={{ width: `${Math.round((value / Math.max(1, max)) * 100)}%` }} /></div>
);

const STATE_LABEL: Record<string, string> = { idea: "Idea", queued: "Queued", drafting: "Drafting", in_review: "In review", approved: "Approved", published: "Published", live: "Live", needs_refresh: "Needs refresh", retired: "Retired" };
const LOCALE_NAME: Record<string, string> = { en: "English", fr: "Français", es: "Español", de: "Deutsch", ar: "العربية", pt: "Português", no: "Norsk", nl: "Nederlands", it: "Italiano", ja: "日本語", zh: "中文" };

const PublishingConsole: React.FC = () => {
  const langTargets = (S.languages.targets || []).map((t: { code: string }) => t.code);
  const allLocales = Array.from(new Set(["en", ...S.languages.active, ...langTargets]));

  return (
    <div className="mx-auto max-w-[1200px] px-1 py-2">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className={kicker}>Publishing &amp; Knowledge Platform</div>
          <h1 className="mt-3 font-serif text-[2.1rem] font-bold leading-tight text-[#f4efe3]">The engine behind every page and every language.</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/55">One first-class subsystem — topic database through autonomous SEO — feeding the entire published surface. State exported {S.generatedAt} from the content-engine.</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-[2.6rem] font-bold leading-none text-gold-300">{S.totals.total}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">pages live</div>
        </div>
      </div>

      {/* top stat strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Industries" value={S.totals.industries} />
        <Stat label="Concepts" value={S.totals.concepts} />
        <Stat label="Articles" value={S.totals.articles} />
        <Stat label="Docs" value={S.totals.docs} />
        <Stat label="Topics" value={S.topics.count} tone="gold" />
        <Stat label="Languages" value={S.languages.active.length} tone="gold" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* 1 — Topic database */}
        <Cap n={1} title="Topic database" sub="Every idea, draft and live page as a governed record.">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[12.5px]">
              <thead><tr className="border-b border-white/10 bg-white/[0.03] text-white/50"><th className="px-3 py-2 font-semibold">Topic</th><th className="px-3 py-2 font-semibold">Type</th><th className="px-3 py-2 font-semibold">Status</th><th className="px-3 py-2 font-semibold">Source</th></tr></thead>
              <tbody>
                {S.topics.list.slice(0, 6).map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-3 py-2 text-white/80">{t.title || t.id}</td>
                    <td className="px-3 py-2 text-white/50">{t.type}</td>
                    <td className="px-3 py-2"><span className="text-gold-200/90">{STATE_LABEL[t.status] || t.status}</span></td>
                    <td className="px-3 py-2 text-white/40">{t.source}</td>
                  </tr>
                ))}
                {S.topics.list.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-white/40">No topics seeded yet — run <code className="text-gold-200">discover --propose</code>.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[12px] text-white/45">{S.topics.count} topic{S.topics.count === 1 ? "" : "s"} in the database.</div>
        </Cap>

        {/* 2 — Editorial workflow + 10 — Publishing pipeline */}
        <Cap n={2} title="Editorial workflow & pipeline" sub="Author → verify → score → link → schema → human review → publish.">
          <div className="flex flex-wrap gap-1.5">
            {S.pipeline.stages.map((st, i) => (
              <React.Fragment key={st}>
                <span className="rounded-md border border-white/12 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/70">{st}</span>
                {i < S.pipeline.stages.length - 1 && <span className="self-center text-white/20">→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {S.topics.states.map((st) => (
              <div key={st} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                <div className="text-[1.1rem] font-bold text-white">{(S.topics.byState as Record<string, number>)[st] || 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40">{STATE_LABEL[st] || st}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-white/45"><Pill on>Human review gate</Pill><Pill on>Quality gate ≥ {S.pipeline.gate}</Pill></div>
        </Cap>

        {/* 4 — AI authoring */}
        <Cap n={4} title="AI authoring — parallel models" sub="Multiple providers draft the same brief; the engine validates and merges.">
          <div className="flex flex-wrap gap-2">
            {S.authoring.providers.map((p) => (
              <Pill key={p.name} on={p.live}>{p.name} · {p.kind}{p.live ? "" : " (key required)"}</Pill>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-white/45">Mock and harness providers run anywhere; the API adapters (Claude, GPT) light up the moment a key is present — no code change.</p>
        </Cap>

        {/* 5 — Fact verification + 16 — Quality scoring */}
        <Cap n={5} title="Fact verification & quality scoring" sub="Every draft is fact-flagged and scored before it can pass the gate.">
          <div className="flex items-center gap-3">
            <Stat label="Quality gate" value={S.quality.gate} tone="gold" />
            <div className="flex flex-col gap-2">
              <Pill on={S.quality.factVerification}>Fact verification on</Pill>
              <span className="text-[12px] text-white/45">{S.quality.scorer}</span>
            </div>
          </div>
        </Cap>

        {/* 6 + 18 — Internal linking & content graph */}
        <Cap n={6} title="Internal linking & content graph" sub="The relationship graph keeps the library a connected web, not islands.">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Nodes" value={S.graph.nodes} />
            <Stat label="Edges" value={S.graph.edges} />
            <Stat label="Orphans" value={S.graph.orphanCount} tone={S.graph.orphanCount === 0 ? "emerald" : "gold"} />
          </div>
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Top hubs</div>
            <ul className="mt-2 space-y-1">
              {S.graph.hubs.slice(0, 4).map((h) => <li key={h} className="text-[12.5px] text-white/65">{h}</li>)}
            </ul>
          </div>
        </Cap>

        {/* 7 — Schema generation */}
        <Cap n={7} title="Schema generation" sub="Structured data emitted automatically per content type.">
          <div className="space-y-2.5">
            {Object.entries(S.schema.emits).map(([type, kinds]) => (
              <div key={type} className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-white/50">{type}</span>
                {(kinds as string[]).map((k) => <span key={k} className="rounded border border-gold-400/20 bg-gold-400/[0.06] px-2 py-0.5 text-[11px] text-gold-200/90">{k}</span>)}
              </div>
            ))}
          </div>
        </Cap>

        {/* 8 — Version history + 17 — Evergreen */}
        <Cap n={8} title="Version history & evergreen review" sub="Current / Archive / history, with a scheduled next-review per page.">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Version records" value={S.versions.records} />
            <Stat label="Review cadence" value={`${S.evergreen.defaultCadenceDays}d`} />
            <Stat label="Due now" value={S.evergreen.dueCount} tone={S.evergreen.dueCount === 0 ? "emerald" : "gold"} />
          </div>
          <p className="mt-3 text-[12px] text-white/45">Standards and docs carry their own cadence; the engine surfaces what is due so nothing silently goes stale.</p>
        </Cap>

        {/* 9 — Multi-language */}
        <Cap n={9} title="Multi-language" sub="Real localized content per language — never machine translation at request time.">
          <div className="space-y-2">
            {allLocales.map((code) => {
              const cov = code === "en" ? S.languages.totalConcepts : ((S.languages.coverage as Record<string, number>)[code] || 0);
              const active = S.languages.active.includes(code);
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[12.5px] text-white/70">{LOCALE_NAME[code] || code}</span>
                  <div className="flex-1"><Bar value={cov} max={S.languages.totalConcepts} /></div>
                  <span className="w-20 shrink-0 text-right text-[11.5px] text-white/45">{cov}/{S.languages.totalConcepts}</span>
                  <span className="w-14 shrink-0 text-right">{active ? <Pill on>live</Pill> : <span className="text-[11px] text-white/30">planned</span>}</span>
                </div>
              );
            })}
          </div>
        </Cap>

        {/* 12 + 13 + 14 — SEO distribution */}
        <Cap n={12} title="SEO distribution" sub="Sitemaps, image sitemap, RSS and IndexNow — emitted automatically.">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Sitemap URLs" value={S.distribution.sitemap.urls} />
            <Stat label="Image sitemap" value={S.distribution.imageSitemap.urls} />
            <Stat label="RSS items" value={S.distribution.rss.items} />
            <Stat label="IndexNow" value={S.distribution.indexNow.keyHosted ? "Ready" : "—"} tone={S.distribution.indexNow.keyHosted ? "emerald" : "plain"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill on={S.distribution.sitemap.exists}>sitemap.xml</Pill>
            <Pill on={S.distribution.rss.exists}>rss.xml</Pill>
            <Pill on={S.distribution.imageSitemap.exists}>image sitemap</Pill>
            <Pill on={S.distribution.indexNow.keyHosted}>IndexNow key hosted</Pill>
          </div>
        </Cap>

        {/* 11 + 15 — Search Console & ranking */}
        <Cap n={11} title="Search Console & ranking" sub="Query / impression / position tracking, with a striking-distance view.">
          <div className="flex items-center gap-3">
            <Stat label="Tracked" value={S.searchConsole.tracked} />
            <Pill on={S.searchConsole.connected}>{S.searchConsole.connected ? "GSC connected" : "Local store (GSC key required)"}</Pill>
          </div>
          {S.searchConsole.top.length > 0 ? (
            <ul className="mt-3 space-y-1">{S.searchConsole.top.slice(0, 5).map((r: { slug: string; query?: string; position?: number }, i: number) => <li key={i} className="flex justify-between text-[12.5px] text-white/60"><span>{r.query || r.slug}</span><span className="text-white/40">#{r.position}</span></li>)}</ul>
          ) : <p className="mt-3 text-[12px] text-white/40">No ranking snapshots yet — the GSC adapter records into the store on each pull.</p>}
        </Cap>

        {/* autonomous discovery */}
        <Cap n={3} title="Autonomous SEO discovery" sub="The loop finds gaps and striking-distance queries, then proposes topics for review.">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Missing topics" value={S.discovery.missingTopics} tone="gold" />
            <Stat label="Striking distance" value={S.discovery.strikingDistance} tone="gold" />
          </div>
          {S.discovery.topGaps.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Top gaps</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{S.discovery.topGaps.map((g: { keyword: string; coverage: number }) => <span key={g.keyword} className="rounded border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[11px] text-white/55">{g.keyword} · {g.coverage}</span>)}</div>
            </div>
          )}
          <p className="mt-3 text-[12px] text-white/45">Discovery → propose → pipeline → human review → publish. Every page passes a person before it goes live.</p>
        </Cap>
      </div>

      <p className="mt-6 text-[11.5px] leading-relaxed text-white/35">
        Read-only operator view. State is exported from <code className="text-white/55">services/content-engine</code> via <code className="text-white/55">content.cjs export</code>; write actions (review, approve, publish, run pipeline) bind to dispatch-api as the autonomous loop is wired live.
      </p>
    </div>
  );
};

export default PublishingConsole;
