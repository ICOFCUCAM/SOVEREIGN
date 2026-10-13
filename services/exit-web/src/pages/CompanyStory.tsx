import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { storyStatus, storyCompleteness, provenanceIssues, SECTION_TITLE, PROVENANCE_LABEL, type CompanyStory, type FactMeta, type Provenance as Prov, type SectionId } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { loadStory, saveStory, fetchStory } from "../lib/company-story";
import { useDocumentRemote } from "../lib/documents/remote";
import { STORY_FORM, HEADLINE_FIGURES, newSourceId, type Field, type FormSection } from "../lib/story-form";
import { PageHeader, Section } from "../components/xo";

// ── COMPANY STORY (progressive intake, part two) ────────────────────
// The history, products, customers, market, people, ownership, financial
// history and sources a professional CIM is written from. Every section is
// optional; work is saved whenever the founder stops typing; each section
// shows what it still lacks. Documents state only what is here.

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2.5 py-1.5 text-[13px] text-xo-text placeholder:text-xo-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-1 block text-[12px] font-medium text-xo-muted";
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const BADGE: Record<string, string> = { complete: "text-xo-verified", partial: "text-xo-caution", empty: "text-xo-faint" };
const BADGE_LABEL: Record<string, string> = { complete: "Complete", partial: "Partly done", empty: "Not started" };

type Obj = Record<string, unknown>;
const get = (o: unknown, k: string): unknown => (k ? (o as Obj | undefined)?.[k] : o);

/** Where a figure came from. "Independently verified" is never offered: it needs a verification process. */
const MetaField: React.FC<{ value: FactMeta | undefined; onChange: (m: FactMeta) => void; story: CompanyStory; label: string; id: string }> = ({ value, onChange, story, label, id }) => {
  const m: FactMeta = value ?? { provenance: "founder" };
  if (m.provenance === "verified") return <p className="text-[12px] text-xo-verified">{label}: independently verified ({m.verification?.process}, {m.verification?.at})</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="block" htmlFor={`${id}-p`}><span className={LABEL}>{label}</span>
        <select id={`${id}-p`} className={INPUT} value={m.provenance} onChange={(e) => onChange({ ...m, provenance: e.target.value as Prov })}>
          {(["founder", "source", "estimated", "missing"] as Prov[]).map((p) => <option key={p} value={p}>{PROVENANCE_LABEL[p].replace(/^./, (c) => c.toUpperCase())}</option>)}
        </select>
      </label>
      {m.provenance === "source" && (
        <label className="block" htmlFor={`${id}-s`}><span className={LABEL}>Source document</span>
          <select id={`${id}-s`} className={INPUT} value={m.sourceId ?? ""} onChange={(e) => onChange({ ...m, sourceId: e.target.value })}>
            <option value="">— choose (add documents under Source documents) —</option>
            {story.sources.map((d) => <option key={d.id} value={d.id}>{d.title || "(untitled)"} {d.date ? `· ${d.date}` : ""}</option>)}
          </select>
        </label>
      )}
      {m.provenance === "estimated" && (
        <label className="block" htmlFor={`${id}-m`}><span className={LABEL}>Method (required)</span>
          <input id={`${id}-m`} className={INPUT} value={m.method ?? ""} onChange={(e) => onChange({ ...m, method: e.target.value })} placeholder="How the estimate was reached" />
        </label>
      )}
      {m.provenance !== "missing" && (
        <label className="block" htmlFor={`${id}-per`}><span className={LABEL}>Period or date</span>
          <input id={`${id}-per`} className={INPUT} value={m.period ?? ""} onChange={(e) => onChange({ ...m, period: e.target.value })} placeholder="e.g. FY2025, TTM to Sep 2026" />
        </label>
      )}
    </div>
  );
};

const FieldEditor: React.FC<{ f: Field; value: unknown; onChange: (v: unknown) => void; story: CompanyStory; id: string; isSources?: boolean }> = ({ f, value, onChange, story, id, isSources }) => {
  switch (f.kind) {
    case "meta": return <MetaField value={value as FactMeta | undefined} onChange={onChange} story={story} label={f.label} id={id} />;
    case "checkbox": return <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
    case "select": return <label className="block" htmlFor={id}><span className={LABEL}>{f.label}</span><select id={id} className={INPUT} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
    case "textarea": return <label className="block" htmlFor={id}><span className={LABEL}>{f.label}</span><textarea id={id} rows={3} className={INPUT} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={f.hint} /></label>;
    case "pct": return <label className="block" htmlFor={id}><span className={LABEL}>{f.label} (%)</span><input id={id} inputMode="decimal" className={INPUT} value={value == null ? "" : String(Math.round(Number(value) * 1000) / 10)} onChange={(e) => onChange(e.target.value.trim() === "" ? undefined : Number(e.target.value) / 100)} /></label>;
    case "number": case "year": case "usd": return <label className="block" htmlFor={id}><span className={LABEL}>{f.label}</span><input id={id} inputMode="numeric" className={INPUT} value={value == null ? "" : String(value)} onChange={(e) => { const t = e.target.value.replace(/[,\s$]/g, ""); onChange(t === "" ? undefined : Number(t)); }} /></label>;
    case "list": {
      const rows = (Array.isArray(value) ? value : []) as Obj[];
      const set = (i: number, k: string, v: unknown): void => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
      return (
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-semibold">{f.label}</legend>
          {f.hint && <p className="text-[12px] text-xo-faint">{f.hint}</p>}
          {rows.map((r, i) => (
            <div key={i} className="space-y-2 border border-xo-line p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {f.row!.map((rf) => <div key={rf.key} className={rf.kind === "textarea" || rf.kind === "meta" ? "sm:col-span-2" : ""}><FieldEditor f={rf} value={r[rf.key]} onChange={(v) => set(i, rf.key, v)} story={story} id={`${id}-${i}-${rf.key}`} /></div>)}
              </div>
              <button type="button" className={BTN} onClick={() => onChange(rows.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className={BTN} onClick={() => onChange([...rows, isSources ? { id: newSourceId() } : {}])}>{f.addLabel ?? "Add"}</button>
        </fieldset>
      );
    }
    default: return <label className="block" htmlFor={id}><span className={LABEL}>{f.label}</span><input id={id} className={INPUT} value={f.key === "geographies" && Array.isArray(value) ? (value as string[]).join(", ") : String(value ?? "")} onChange={(e) => onChange(f.key === "geographies" ? e.target.value.split(",").map((x) => x.trim()).filter(Boolean) : e.target.value)} placeholder={f.hint} /></label>;
  }
};

/** Empty containers so a section can be edited before anything is in it. */
const EMPTY: Partial<Record<keyof CompanyStory, unknown>> = {
  history: { milestones: [], ownershipChanges: [] }, businessModel: { revenueStreams: [] },
  customers: { segments: [], profiles: [], caseStudies: [] }, market: { geographies: [], estimates: [], competitors: [] },
  team: { leaders: [], headcount: [] }, capitalization: { holders: [], instruments: [] }, financials: { annual: [], forecasts: [] }, growth: { opportunities: [] },
};

const CompanyStoryPage: React.FC = () => {
  const { company, companyId, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const remote = useDocumentRemote();
  const [story, setStory] = useState<CompanyStory>(() => loadStory(companyId));
  const [active, setActive] = useState<SectionId>("history");
  const [saveState, setSaveState] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // a signed-in account's server copy wins when it is newer
  useEffect(() => {
    if (!remote || !companyId) return;
    void fetchStory(companyId, remote).then((s) => { if (s && s.updatedAt > story.updatedAt) setStory(s); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, companyId]);

  const update = (next: CompanyStory): void => {
    setStory(next);
    if (!companyId) return;
    setSaveState("Saving…");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveStory(companyId, next, remote)
        .then(() => setSaveState(remote ? "Saved to your account" : "Saved in this browser"))
        .catch((e: unknown) => setSaveState(`Not saved: ${e instanceof Error ? e.message : "error"} (kept in this browser)`));
    }, 600);
  };

  const status = useMemo(() => storyStatus(story), [story]);
  const issues = useMemo(() => provenanceIssues(story), [story]);
  const done = Math.round(storyCompleteness(story) * 100);
  const section = STORY_FORM.find((s) => s.id === active)!;

  if (!fromIntake || !companyId) return (
    <div data-page="company-story" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Mandate · Company story" title="Company story" />
      <Section title="Start with your figures" className="border border-xo-line">
        <p className="px-4 py-3 text-[13px] text-xo-muted">The company story belongs to your company. Enter your headline figures on <Link to="/console/intake" className="text-xo-action underline">Value My Company</Link> first; then return here to add the history, products, customers, people, ownership and sources a CIM is written from.</p>
      </Section>
    </div>
  );

  const setSection = (s: FormSection, k: string, v: unknown): void => {
    const cur = (story[s.path] as unknown) ?? EMPTY[s.path] ?? (k ? {} : []);
    const nextVal = k ? { ...(cur as Obj), [k]: v } : v;
    update({ ...story, [s.path]: nextVal });
  };

  return (
    <div data-page="company-story" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Mandate · Company story · ${company.name}`} title="Company story"
        badge={<span className="text-[12px] text-xo-muted">{done}% complete · {saveState || (remote ? "saved to your account as you go" : "saved in this browser as you go")}</span>}>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-xo-muted">What a buyer's adviser expects a CIM to cover. Fill in what you have, in any order, and come back for the rest. ExitOS states only what is here, with its basis, and names what is missing. It never fills a gap with an estimate of its own.</p>
      </PageHeader>

      {issues.length > 0 && (
        <Section title="Before these figures can be stated" eyebrow={`${issues.length} provenance issue${issues.length === 1 ? "" : "s"}`} className="border border-xo-caution/50">
          <ul className="list-disc space-y-1 px-8 py-3 text-[12px] text-xo-muted">{issues.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[260px_1fr]">
        <nav aria-label="Story sections" className="bg-xo-panel p-2">
          <ul className="space-y-1">
            {status.map((st) => (
              <li key={st.id}>
                <button type="button" aria-current={active === st.id ? "true" : undefined} onClick={() => setActive(st.id)}
                  className={`block w-full border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${active === st.id ? "border-xo-verified/60 bg-xo-raise" : "border-xo-line hover:bg-xo-raise"}`}>
                  <span className="block text-[13px] font-medium">{SECTION_TITLE[st.id]}</span>
                  <span className={`text-[11px] ${BADGE[st.status]}`}>{BADGE_LABEL[st.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-label={SECTION_TITLE[active]} className="space-y-4 bg-xo-panel p-4">
          <div>
            <h2 className="text-[15px] font-semibold">{SECTION_TITLE[active]}</h2>
            <p className="mt-1 text-[12px] text-xo-muted">{section.why}</p>
            {(() => { const st = status.find((x) => x.id === active)!; return st.missing.length ? <p className="mt-1 text-[12px] text-xo-caution">Still needed: {st.missing.join("; ")}.</p> : <p className="mt-1 text-[12px] text-xo-verified">Complete.</p>; })()}
          </div>
          {section.fields.map((f) => (
            <FieldEditor key={f.key || f.label} f={f} id={`${active}-${f.key || "list"}`} story={story} isSources={active === "sources"}
              value={get(story[section.path] ?? EMPTY[section.path], f.key)} onChange={(v) => setSection(section, f.key, v)} />
          ))}
          {active === "sources" && (
            <fieldset className="space-y-3 border-t border-xo-line pt-3">
              <legend className="text-[13px] font-semibold">Basis of your headline figures</legend>
              <p className="text-[12px] text-xo-faint">Where each figure on Value My Company comes from. Documents state it with this basis.</p>
              {HEADLINE_FIGURES.map(([k, label]) => (
                <MetaField key={k} id={`headline-${k}`} label={label} story={story} value={story.headline?.[k]}
                  onChange={(m) => update({ ...story, headline: { ...(story.headline ?? {}), [k]: m } })} />
              ))}
            </fieldset>
          )}
        </section>
      </div>
    </div>
  );
};

export default CompanyStoryPage;
