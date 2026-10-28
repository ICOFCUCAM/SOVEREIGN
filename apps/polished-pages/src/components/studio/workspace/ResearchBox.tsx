import { useState } from "react";
import { BookOpen, ExternalLink, GraduationCap, Loader2, Network, Search, X } from "lucide-react";
import type { ResearchResult, ResearchScope } from "@/lib/research";

// Research this section (DESIGN-SPEC.md §21), at the top of the Research tab: Claude finds scripture,
// topics and scholars for what the owner asks; "My sources" searches the uploads and the manuscript.
type Filter = ResearchScope | "mine";
const FILTERS: [Filter, string][] = [["all", "All"], ["scripture", "Scripture"], ["topics", "Topics"], ["scholars", "Scholars"], ["mine", "My sources"]];

export default function ResearchBox({ research, mySources, onAsk, disabled }: {
  research: (query: string, scope: ResearchScope) => Promise<ResearchResult>;
  mySources: (query: string) => Promise<{ name: string; excerpt: string }[]>;
  /** Follow a topic up in the conversation. */
  onAsk: (question: string) => void;
  disabled?: string | null;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<ResearchResult | null>(null);
  const [mine, setMine] = useState<{ name: string; excerpt: string }[] | null>(null);
  const go = async (f = filter) => {
    if (!q.trim()) return;
    setBusy(true); setError(null);
    try {
      const own = await mySources(q.trim()); setMine(own);
      if (f !== "mine") setRes(await research(q.trim(), f));
    } catch (e) { setError(e instanceof Error ? e.message : "The research didn't finish."); }
    finally { setBusy(false); }
  };
  const show = (k: Filter) => filter === "all" || filter === k;
  return (
    <section className="space-y-4">
      <div className="flex gap-3 rounded-[12px] border border-[#E0E7FF] bg-[#F5F7FF] p-3.5 dark:border-[#312E81] dark:bg-[#1E1B4B]/30">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-white text-[#4F46E5] dark:bg-white/10"><BookOpen className="h-5 w-5" /></span>
        <div><p className="text-[15px] font-semibold">Research this section</p><p className="text-[13px] text-[#475569] dark:text-[#CBD5E1]">Find scripture, related topics and scholars, and where it appears in your own sources.</p></div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void go(); }} className="flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#E6E8ED] bg-white px-3 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Research" placeholder="e.g. angel of the LORD" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          {q && <button type="button" onClick={() => { setQ(""); setRes(null); setMine(null); }} aria-label="Clear"><X className="h-4 w-4 text-[#94A3B8]" /></button>}
        </label>
        <button type="submit" disabled={!q.trim() || busy || (Boolean(disabled) && filter !== "mine")} className="h-11 rounded-[10px] bg-[#4F46E5] px-4 text-[14px] font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}</button>
      </form>
      <div role="radiogroup" aria-label="What to find" className="flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={filter === id} onClick={() => { setFilter(id); if (res || mine) void (id === "mine" ? Promise.resolve() : undefined); }}
            className={`h-8 rounded-full px-3 text-[13px] font-medium ${filter === id ? "bg-[#4F46E5] text-white" : "bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] dark:bg-white/10 dark:text-[#CBD5E1]"}`}>{label}</button>
        ))}
      </div>
      {disabled && filter !== "mine" && <p className="text-[12.5px] text-[#64748B]">{disabled}</p>}
      {busy && <p role="status" className="text-[13px] text-[#64748B]"><Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />Claude is researching and checking its sources. This can take a minute.</p>}
      {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

      {res && show("scripture") && res.scripture.length > 0 && (
        <div><p className="mb-2 text-[14px] font-semibold">Scripture results <span className="font-normal text-[#64748B]">({res.scripture.length})</span></p>
          <ul className="divide-y divide-[#F1F5F9] rounded-[12px] border border-[#E6E8ED] dark:divide-white/5 dark:border-white/10">
            {res.scripture.map((s) => (
              <li key={s.ref} className="flex items-center gap-3 px-3 py-2.5">
                <BookOpen className="h-4 w-4 shrink-0 text-[#64748B]" />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium">{s.ref}</span><span className="block truncate text-[12.5px] text-[#64748B]">{s.note}</span></span>
                {s.translation && <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11.5px] font-semibold text-[#4F46E5] dark:bg-[#312E81]/40 dark:text-[#C7D2FE]">{s.translation}</span>}
              </li>
            ))}
          </ul></div>
      )}
      {res && show("topics") && res.topics.length > 0 && (
        <div><p className="mb-2 text-[14px] font-semibold">Related topics <span className="font-normal text-[#64748B]">({res.topics.length})</span></p>
          <div className="grid grid-cols-2 gap-2">
            {res.topics.map((t) => (
              <button key={t.title} type="button" onClick={() => onAsk(`Tell me about “${t.title}” as it bears on this section.`)} className="flex gap-2 rounded-[12px] border border-[#E6E8ED] p-2.5 text-left hover:border-[#C7D2FE] dark:border-white/10">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-[#4F46E5]" /><span className="min-w-0"><span className="block text-[13px] font-semibold leading-snug">{t.title}</span><span className="block text-[12px] leading-snug text-[#64748B]">{t.line}</span></span>
              </button>
            ))}
          </div></div>
      )}
      {res && show("scholars") && res.scholars.length > 0 && (
        <div><p className="mb-2 text-[14px] font-semibold">Scholars <span className="font-normal text-[#64748B]">({res.scholars.length})</span></p>
          <ul className="space-y-2">
            {res.scholars.map((s) => (
              <li key={`${s.name}${s.work}`} className="flex gap-2.5 rounded-[12px] border border-[#E6E8ED] p-2.5 dark:border-white/10">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
                <span className="min-w-0 flex-1 text-[13px]"><span className="font-semibold">{s.name}</span>{s.work ? `, ${s.work}` : ""}<span className="block text-[12.5px] text-[#64748B]">{s.line}{!s.url ? " · not checked on the web" : ""}</span></span>
                {s.url && <a href={s.url} target="_blank" rel="noreferrer noopener" aria-label={`Open ${s.work || s.name}`} className="shrink-0 text-[#2563EB]"><ExternalLink className="h-4 w-4" /></a>}
              </li>
            ))}
          </ul></div>
      )}
      {mine && show("mine") && (
        <div><p className="mb-2 text-[14px] font-semibold">In my sources <span className="font-normal text-[#64748B]">({mine.length})</span></p>
          {mine.length === 0 ? <p className="text-[13px] text-[#64748B]">Not found in your uploaded documents or the manuscript.</p>
            : <ul className="space-y-2">{mine.map((h, i) => <li key={i} className="rounded-[10px] bg-[#F8FAFC] px-3 py-2 text-[13px] dark:bg-white/5"><span className="block text-[11.5px] font-semibold text-[#64748B]">{h.name}</span>{h.excerpt}</li>)}</ul>}
        </div>
      )}
      {res && !busy && res.scripture.length + res.topics.length + res.scholars.length === 0 && filter !== "mine" && <p className="text-[13px] text-[#64748B]">Nothing checked could be found for that.</p>}
    </section>
  );
}
