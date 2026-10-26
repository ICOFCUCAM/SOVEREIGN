import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, Download, FileText, Library, Loader2, PenLine, Plus, Quote, Sparkles, Square, Trash2, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Markdown from "@/components/studio/Markdown";
import { saveDocument, setTags } from "@/lib/documents";
import { COMPLETE, DEFAULT_SHELVES, SHELF } from "@/lib/bookshelf";
import { SECTION_KINDS, authorshipNotes, compile, importText, insertSection, kindDef, moveSection, words, type Manuscript, type SectionGroup } from "@/lib/manuscript";
import type { StudioThread, StudioJob, StudioEvent, RunOptions } from "@/lib/claude-studio";
import type { EngineId, StudioBackend } from "@/lib/studio-backend";

// The manuscript writer: a book as front matter, chapters and back matter. The
// owner writes; Claude expands, cites, rewrites in their voice, edits on
// request, or drafts standard sections (preface, bibliography, index…). Every
// suggestion is shown first and only replaces the text when accepted; what was
// accepted is kept as authorship notes.

const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";
const GROUPS: { id: SectionGroup; label: string }[] = [{ id: "front", label: "Front matter" }, { id: "body", label: "Chapters" }, { id: "back", label: "Back matter" }];
type Op = NonNullable<RunOptions["op"]>;
const OPS: { id: Op; label: string; icon: typeof Wand2; line: string }[] = [
  { id: "expand", label: "Expand", icon: Sparkles, line: "More depth, examples and detail" },
  { id: "cite", label: "Add citations", icon: Quote, line: "Sources from the web, never invented" },
  { id: "voice", label: "In my voice", icon: PenLine, line: "Rewrite to sound like you" },
  { id: "edit", label: "Edit as I say", icon: Wand2, line: "Your instruction, applied to this section" },
  { id: "draft", label: "Draft with Claude", icon: FileText, line: "Write this section for the book" },
];
const download = (name: string, text: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

export default function ManuscriptEditor({ thread, backend, engine, citationStyles, onChanged }: {
  thread: StudioThread; backend: StudioBackend; engine: EngineId | null; citationStyles: string[]; onChanged: () => void;
}) {
  const { toast } = useToast();
  const id = thread.id;
  const [m, setM] = useState<Manuscript | null | undefined>(undefined);
  const [sel, setSel] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [op, setOp] = useState<Op>("expand");
  const [factor, setFactor] = useState("2");
  const [style, setStyle] = useState(citationStyles[0] ?? "APA 7");
  const [instructions, setInstructions] = useState("");
  const [useVoice, setUseVoice] = useState(false);
  const [running, setRunning] = useState<{ job: StudioJob; line: string; sectionId: string; op: Op } | null>(null);
  const [proposal, setProposal] = useState<{ sectionId: string; op: Op; text: string; engine: EngineId } | null>(null);
  const [compiled, setCompiled] = useState<string | null>(null);
  const [shelf, setShelfName] = useState("");
  const [complete, setComplete] = useState(true);
  const [contents, setContents] = useState(true);
  const timer = useRef<number | null>(null);
  const latest = useRef<Manuscript | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    backend.manuscript(id).then((x) => { setM(x); latest.current = x; setSel(x?.sections.find((s) => s.kind === "chapter")?.id ?? x?.sections[0]?.id ?? null); })
      .catch((e) => { setM(null); toast({ title: "Couldn't open the manuscript", description: e instanceof Error ? e.message : "", variant: "destructive" }); });
    return () => { abort.current?.abort(); if (timer.current) window.clearTimeout(timer.current); };
  }, [backend, id, toast]);

  const persist = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    if (!latest.current) return;
    setSaving("saving");
    try { await backend.saveManuscript(id, latest.current); setSaving("saved"); }
    catch (e) { setSaving("idle"); toast({ title: "Couldn't save the manuscript", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  }, [backend, id, toast]);

  const update = (next: Manuscript) => {
    setM(next); latest.current = next; setSaving("idle");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void persist(); }, 1200);
  };

  const start = async (from: "new" | "uploads") => {
    let next: Manuscript;
    if (from === "uploads") {
      const texts: string[] = [];
      for (const f of thread.files.filter((x) => x.kind === "original")) {
        const copy = thread.files.find((x) => x.kind === "text" && x.storedAs === f.storedAs.replace(/\.[^.]+$/, "") + ".txt");
        const t = copy ? await backend.source(id, copy.storedAs) : /\.(txt|md|markdown)$/i.test(f.storedAs) ? await backend.source(id, f.storedAs) : null;
        if (t?.trim()) texts.push(t);
      }
      if (!texts.length) { toast({ title: "No readable text in the uploads", description: "Scanned files need Claude Code: use “Read scanned pages” first.", variant: "destructive" }); return; }
      next = importText(thread.title, texts.join("\n\n"));
    } else {
      next = { title: thread.title === "Untitled project" ? "" : thread.title, sections: [], history: [] };
      next = insertSection(next, "chapter", "Chapter 1").manuscript;
    }
    setM(next); latest.current = next; setSel(next.sections.find((s) => s.kind === "chapter")?.id ?? next.sections[0]?.id ?? null);
    await persist();
  };

  const section = m?.sections.find((s) => s.id === sel) ?? null;
  const def = section ? kindDef(section.kind) : null;
  const total = useMemo(() => (m ? m.sections.reduce((n, s) => n + words(s.body), 0) : 0), [m]);
  const yours = useMemo(() => (section ? [...section.body.matchAll(/\[\[YOURS:\s*([^\]]+)\]\]/g)].map((x) => ({ at: x.index ?? 0, text: x[1].trim() })) : []), [section]);

  const run = async () => {
    if (!m || !section || !engine) return;
    await persist();
    const options: RunOptions = { sectionId: section.id, op, title: section.title, instructions: instructions.trim() || undefined, factor: Number(factor), citationStyle: style, guidance: def?.guidance, useVoice: (op === "expand" || op === "edit" || op === "draft") && useVoice };
    try {
      const job = await backend.run(id, "section", options, engine);
      const ctl = new AbortController(); abort.current = ctl;
      setRunning({ job, line: "Starting…", sectionId: section.id, op });
      setProposal(null);
      await backend.follow(job, async (e: StudioEvent) => {
        if (e.type === "tool" || e.type === "status" || e.type === "notice") setRunning((r) => (r ? { ...r, line: e.line } : r));
        if (e.type === "done") {
          setRunning(null);
          onChanged();
          if (e.status !== "done") { if (e.status !== "cancelled") toast({ title: "Claude couldn't finish", description: e.error ?? "", variant: "destructive" }); return; }
          const out = e.output ?? `sections/${options.sectionId}.md`;
          try { setProposal({ sectionId: options.sectionId!, op: options.op!, text: (await backend.output(id, out)).trim(), engine }); }
          catch { toast({ title: "Couldn't open Claude's suggestion", variant: "destructive" }); }
        }
      }, ctl.signal);
    } catch (e) { setRunning(null); toast({ title: "Couldn't start", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const decide = (how: "replace" | "append" | "discard") => {
    if (!m || !proposal) return;
    const next: Manuscript = {
      ...m,
      sections: m.sections.map((s) => (s.id !== proposal.sectionId || how === "discard" ? s : { ...s, body: how === "replace" ? proposal.text : `${s.body.trim()}\n\n${proposal.text}`.trim() })),
      history: [...m.history, { sectionId: proposal.sectionId, op: proposal.op, engine: proposal.engine, at: new Date().toISOString(), accepted: how !== "discard" }],
    };
    update(next); setProposal(null);
  };

  const saveBook = async () => {
    if (!m) return;
    await persist();
    const md = compile(m, { contents });
    const title = m.title.trim() || "Untitled book";
    try {
      const docId = await saveDocument({ kind: "book", title, payload: { markdown: md, title }, preview: md.replace(/^#.*$/m, "").trim().slice(0, 160) });
      const tags = [...(shelf ? [SHELF + shelf] : []), ...(complete ? [COMPLETE] : [])];
      if (tags.length) await setTags(docId, tags).catch(() => {});
      setCompiled(docId);
      toast({ title: "Saved to your Library", description: `“${title}”${shelf ? ` on the ${shelf} shelf` : ""}.` });
    } catch (e) { toast({ title: "Couldn't save the book", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const jumpTo = (at: number) => { const t = area.current; if (!t) return; t.focus(); t.setSelectionRange(at, at); };

  if (m === undefined) return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (m === null) {
    const hasText = thread.files.some((f) => f.kind === "text" || /\.(txt|md|markdown)$/i.test(f.storedAs));
    return (
      <div className="grid min-h-[45vh] place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="max-w-md">
          <BookOpen className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-2xl font-bold">Write your book here</h2>
          <p className="mt-2 text-sm text-muted-foreground">Front matter, chapters and back matter as sections. Write, then ask Claude to expand, add citations, rewrite in your voice, or draft a preface, bibliography, index and more.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button className={`rounded-full ${GRADIENT}`} onClick={() => start("new")}><Plus className="h-4 w-4" /> Start a new book</Button>
            {hasText && <Button variant="outline" className="rounded-full" onClick={() => start("uploads")}><FileText className="h-4 w-4" /> Start from my uploads</Button>}
          </div>
        </div>
      </div>
    );
  }

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="w-full rounded-full"><Plus className="h-4 w-4" /> Add section <ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
        {GROUPS.map((g, gi) => (
          <div key={g.id}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{g.label}</DropdownMenuLabel>
            {SECTION_KINDS.filter((k) => k.group === g.id).map((k) => {
              const taken = k.single && m.sections.some((s) => s.kind === k.kind);
              return (
                <DropdownMenuItem key={k.kind} disabled={taken} onClick={() => { const r = insertSection(m, k.kind); update(r.manuscript); setSel(r.id); setProposal(null); }}>
                  {k.label}{taken && <span className="ml-auto text-[10px] text-muted-foreground">added</span>}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      {/* Book details */}
      <div className="grid gap-2 sm:grid-cols-[2fr_1.5fr_1fr]">
        <Input value={m.title} onChange={(e) => update({ ...m, title: e.target.value })} placeholder="Book title" aria-label="Book title" className="font-serif text-lg font-semibold" />
        <Input value={m.subtitle ?? ""} onChange={(e) => update({ ...m, subtitle: e.target.value })} placeholder="Subtitle" aria-label="Subtitle" />
        <Input value={m.author ?? ""} onChange={(e) => update({ ...m, author: e.target.value })} placeholder="Author" aria-label="Author" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>{total.toLocaleString()} words · {m.sections.length} sections</span>
        <span>{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => download(`${(m.title || "book").replace(/[^\p{L}\p{N} _-]+/gu, "")}.md`, compile(m, { contents }))}><Download className="h-4 w-4" /> .md</Button>
          <Button size="sm" variant="ghost" onClick={() => download("authorship-notes.md", authorshipNotes(m))}><FileText className="h-4 w-4" /> Authorship notes</Button>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Sections */}
        <nav aria-label="Sections" className="space-y-3">
          {addMenu}
          {GROUPS.map((g) => {
            const list = m.sections.filter((s) => kindDef(s.kind).group === g.id);
            if (!list.length) return null;
            return (
              <div key={g.id}>
                <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</div>
                <ol className="mt-1 space-y-0.5">
                  {list.map((s) => (
                    <li key={s.id} className={`group flex items-center gap-1 rounded-lg pr-1 ${s.id === sel ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted"}`}>
                      <button type="button" className="min-w-0 flex-1 px-2.5 py-1.5 text-left" onClick={() => { setSel(s.id); setProposal((p) => (p?.sectionId === s.id ? p : null)); }}>
                        <span className="block truncate text-sm">{s.title || kindDef(s.kind).label}</span>
                        <span className="block text-[11px] text-muted-foreground">{words(s.body) ? `${words(s.body).toLocaleString()} words` : "empty"}</span>
                      </button>
                      <span className="flex opacity-0 transition group-hover:opacity-100">
                        <button type="button" aria-label={`Move ${s.title} up`} className="p-1 text-muted-foreground hover:text-foreground" onClick={() => update(moveSection(m, s.id, -1))}><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label={`Move ${s.title} down`} className="p-1 text-muted-foreground hover:text-foreground" onClick={() => update(moveSection(m, s.id, 1))}><ArrowDown className="h-3.5 w-3.5" /></button>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </nav>

        {/* Section editor */}
        <div className="min-w-0">
          {!section ? <p className="text-sm text-muted-foreground">Choose a section, or add one.</p> : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{def!.label}</span>
                <Input value={section.title} onChange={(e) => update({ ...m, sections: m.sections.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)) })} aria-label="Section title" className="h-10 border-transparent bg-transparent px-1 font-serif text-xl font-bold shadow-none focus-visible:border-input" />
                <Button variant="ghost" size="icon" aria-label="Delete section" onClick={() => { if (window.confirm(`Delete “${section.title}”?`)) { const next = { ...m, sections: m.sections.filter((s) => s.id !== section.id) }; update(next); setSel(next.sections[0]?.id ?? null); } }}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Textarea ref={area} value={section.body} onChange={(e) => update({ ...m, sections: m.sections.map((s) => (s.id === section.id ? { ...s, body: e.target.value } : s)) })}
                placeholder={section.body ? undefined : `Write the ${def!.label.toLowerCase()} here, or ask Claude to draft it.`}
                aria-label={`${section.title} text`} className="min-h-[42vh] resize-y font-serif text-[16px] leading-relaxed" />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{words(section.body).toLocaleString()} words</span>
                {yours.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    · <span className="font-medium text-amber-700 dark:text-amber-400">{yours.length} {yours.length === 1 ? "place" : "places"} to make it yours:</span>
                    {yours.slice(0, 6).map((y, i) => <button key={i} type="button" onClick={() => jumpTo(y.at)} className="max-w-[220px] truncate rounded-full border border-amber-500/40 px-2 py-0.5 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300">{y.text}</button>)}
                  </span>
                )}
              </div>

              {/* Ask Claude */}
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="flex flex-wrap gap-1.5">
                  {OPS.map((o) => (
                    <button key={o.id} type="button" onClick={() => setOp(o.id)} title={o.line}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${op === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      <o.icon className="h-3.5 w-3.5" /> {o.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {op === "expand" && (
                    <Select value={factor} onValueChange={setFactor}><SelectTrigger className="h-9 w-[150px]" aria-label="How much longer"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1.5">1.5× longer</SelectItem><SelectItem value="2">2× longer</SelectItem><SelectItem value="3">3× longer</SelectItem></SelectContent></Select>
                  )}
                  {op === "cite" && (
                    <Select value={style} onValueChange={setStyle}><SelectTrigger className="h-9 w-[200px]" aria-label="Citation style"><SelectValue /></SelectTrigger>
                      <SelectContent>{citationStyles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  )}
                  {op !== "cite" && op !== "voice" && (
                    <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} className="h-9 min-w-[200px] flex-1"
                      placeholder={op === "edit" ? "What should change? (required)" : op === "draft" ? def!.guidance.slice(0, 80) + "…" : "Anything to focus on? (optional)"} aria-label="Instructions for Claude" />
                  )}
                  {(op === "expand" || op === "edit" || op === "draft") && (
                    <label className="flex items-center gap-2 text-xs"><Switch checked={useVoice} onCheckedChange={setUseVoice} /> In my voice</label>
                  )}
                  <Button size="sm" className={`ml-auto rounded-full ${GRADIENT}`} onClick={run}
                    disabled={!engine || Boolean(running) || (op === "edit" && !instructions.trim()) || (op !== "draft" && !section.body.trim())}>
                    {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {OPS.find((o) => o.id === op)!.label}
                  </Button>
                </div>
                {op !== "draft" && !section.body.trim() && <p className="mt-2 text-xs text-muted-foreground">This section is empty: write something first, or use “Draft with Claude”.</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">{engine === "api" ? "Runs on the API (billed per use)." : engine ? "Runs on your Claude Code." : "No engine available."} Nothing changes until you accept the suggestion.</p>
              </div>

              {running && running.sectionId === section.id && (
                <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="min-w-0 flex-1 truncate">{running.line}</span>
                  <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => backend.cancel(running.job)}><Square className="h-3.5 w-3.5" /> Stop</Button>
                </div>
              )}

              {proposal && proposal.sectionId === section.id && (
                <div className="overflow-hidden rounded-2xl border border-primary/40">
                  <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
                    <span className="text-sm font-semibold">Claude's suggestion · {OPS.find((o) => o.id === proposal.op)?.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${proposal.engine === "api" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>{proposal.engine === "api" ? "API" : "Claude Code"}</span>
                    <span className="text-xs text-muted-foreground">{words(proposal.text).toLocaleString()} words (now {words(section.body).toLocaleString()})</span>
                    <span className="ml-auto flex gap-1.5">
                      <Button size="sm" className={`rounded-full ${GRADIENT}`} onClick={() => decide("replace")}><Check className="h-4 w-4" /> Use it</Button>
                      {section.body.trim() && <Button size="sm" variant="outline" className="rounded-full" onClick={() => decide("append")}>Add below</Button>}
                      <Button size="sm" variant="ghost" onClick={() => decide("discard")}><X className="h-4 w-4" /> Discard</Button>
                    </span>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto px-5 py-4"><Markdown text={proposal.text} /></div>
                </div>
              )}
            </div>
          )}

          {/* Finish */}
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="font-semibold">Finish the book</div>
            <p className="mt-0.5 text-xs text-muted-foreground">Compiles every section in publishing order into one book in your Library, where you can edit, design the cover, export to EPUB, PDF and print, translate and publish.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Select value={shelf || "__"} onValueChange={(v) => setShelfName(v === "__" ? "" : v)}>
                <SelectTrigger className="h-9 w-[200px]" aria-label="Shelf"><SelectValue placeholder="Shelf" /></SelectTrigger>
                <SelectContent><SelectItem value="__">No shelf</SelectItem>{DEFAULT_SHELVES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm"><Switch checked={complete} onCheckedChange={setComplete} /> Completed</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={contents} onCheckedChange={setContents} /> Table of contents</label>
              {compiled
                ? <Button asChild size="sm" className={`ml-auto rounded-full ${GRADIENT}`}><Link to={`/library?open=${compiled}`}><Library className="h-4 w-4" /> Open in Library</Link></Button>
                : <Button size="sm" className={`ml-auto rounded-full ${GRADIENT}`} onClick={saveBook} disabled={!m.sections.length}><BookOpen className="h-4 w-4" /> Save book to my Library</Button>}
            </div>
            {compiled && <button type="button" className="mt-2 text-xs text-primary underline-offset-2 hover:underline" onClick={() => setCompiled(null)}>Saved. Save again as a new version</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
