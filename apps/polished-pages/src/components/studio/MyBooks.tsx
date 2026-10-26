import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Library, Loader2, MoreHorizontal, PenLine, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getDocument, listDocuments, type DocSummary } from "@/lib/documents";
import { DEFAULT_SHELVES, isComplete, setComplete, setShelf, shelfOf } from "@/lib/bookshelf";

// My books: every book in the Library, on the owner's shelves. Finished books
// and works in progress, each one a click from the Library tools, from Studio
// (to keep writing it as a manuscript) or from teaching Claude the owner's voice.

const GRADIENT = "bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white shadow-[0_10px_28px_-12px_hsl(248_83%_55%/0.7)] hover:opacity-95";
const SPINES = ["from-[#1e3a5f] to-[#0f2440]", "from-[#5b2a3c] to-[#3a1626]", "from-[#2f4f3a] to-[#1b3024]", "from-[#4a3b1f] to-[#2d2311]", "from-[#3b2f5e] to-[#22193d]", "from-[#1f4a4f] to-[#11292c]"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function MyBooks({ onWorkInStudio, onLearnVoice }: {
  onWorkInStudio: (title: string, markdown: string) => Promise<void>;
  onLearnVoice: (books: { title: string; markdown: string }[]) => Promise<void>;
}) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [shelf, setShelfFilter] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "complete" | "progress">("all");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { listDocuments().then((d) => setDocs(d.filter((x) => x.kind === "book"))).catch(() => setDocs([])); }, []);

  const shelves = useMemo(() => {
    const used = new Set((docs ?? []).map(shelfOf).filter(Boolean) as string[]);
    return [...new Set([...DEFAULT_SHELVES, ...used])];
  }, [docs]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const d of docs ?? []) { const s = shelfOf(d) ?? "Unshelved"; c.set(s, (c.get(s) ?? 0) + 1); }
    return c;
  }, [docs]);
  const shown = (docs ?? []).filter((d) =>
    (shelf === "all" || (shelf === "Unshelved" ? !shelfOf(d) : shelfOf(d) === shelf)) &&
    (status === "all" || (status === "complete" ? isComplete(d) : !isComplete(d))) &&
    (!q.trim() || `${d.title} ${d.preview ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));

  const patch = (id: string, tags: string[]) => setDocs((x) => x?.map((d) => (d.id === id ? { ...d, tags } : d)) ?? null);
  const markdownOf = async (d: DocSummary) => {
    const full = await getDocument(d.id);
    const p = (full?.payload ?? {}) as { markdown?: string };
    return String(p.markdown ?? "");
  };

  const toStudio = async (d: DocSummary) => {
    setBusy(d.id);
    try { await onWorkInStudio(d.title, await markdownOf(d)); }
    catch (e) { toast({ title: "Couldn't open it in Studio", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  const learn = async () => {
    setBusy("voice");
    try {
      const books = await Promise.all((docs ?? []).filter((d) => picked.has(d.id)).map(async (d) => ({ title: d.title, markdown: await markdownOf(d) })));
      await onLearnVoice(books.filter((b) => b.markdown.trim()));
      setPicked(new Set());
    } catch (e) { toast({ title: "Couldn't start", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  if (docs === null) return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-1">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shelves</div>
        {[["all", "All books", docs.length] as const, ...shelves.map((s) => [s, s, counts.get(s) ?? 0] as const), ["Unshelved", "Not on a shelf", counts.get("Unshelved") ?? 0] as const]
          .filter(([k, , n]) => k === "all" || n > 0 || DEFAULT_SHELVES.includes(k as string))
          .map(([k, label, n]) => (
            <button key={k} type="button" onClick={() => setShelfFilter(k)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm ${shelf === k ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <span className="truncate">{label}</span><span className="text-xs">{n}</span>
            </button>
          ))}
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my books" aria-label="Search my books" className="pl-9" /></div>
          <div className="flex rounded-full border border-border p-0.5 text-xs">
            {([["all", "All"], ["complete", "Completed"], ["progress", "In progress"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setStatus(k)} className={`rounded-full px-3 py-1 ${status === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{l}</button>
            ))}
          </div>
          {picked.size > 0 && <Button size="sm" className={`rounded-full ${GRADIENT}`} disabled={busy === "voice"} onClick={learn}>{busy === "voice" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />} Learn my voice from {picked.size} {picked.size === 1 ? "book" : "books"}</Button>}
        </div>

        {shown.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {docs.length === 0 ? "No books yet. Write one in a project's Manuscript, or save a result as a book." : "No books match."}
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((d) => {
              const s = shelfOf(d); const done = isComplete(d);
              return (
                <li key={d.id} className="group relative flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:shadow-md">
                  <div className={`relative grid h-32 w-[88px] shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br ${SPINES[hash(d.title) % SPINES.length]} p-2 text-center shadow-[4px_6px_14px_-6px_rgba(0,0,0,0.5)]`}>
                    <span className="absolute inset-y-0 left-1.5 w-px bg-white/15" />
                    <span className="line-clamp-4 font-serif text-[12px] font-semibold leading-tight text-white">{d.title}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h3 className="line-clamp-2 flex-1 font-serif text-base font-bold leading-snug">{d.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Actions for ${d.title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-[60vh] w-56 overflow-y-auto">
                          <DropdownMenuItem asChild><Link to={`/library?open=${d.id}`}><Library className="mr-2 h-4 w-4" /> Open in Library</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toStudio(d)}><BookOpen className="mr-2 h-4 w-4" /> Keep writing in Studio</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => patch(d.id, await setComplete(d, !done))}><Check className="mr-2 h-4 w-4" /> {done ? "Mark as in progress" : "Mark as completed"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Shelf</DropdownMenuLabel>
                          {shelves.map((x) => <DropdownMenuItem key={x} onClick={async () => patch(d.id, await setShelf(d, x))}>{x === s && <Check className="mr-2 h-3.5 w-3.5" />}{x}</DropdownMenuItem>)}
                          <DropdownMenuItem onClick={async () => { const n = window.prompt("New shelf name"); if (n?.trim()) patch(d.id, await setShelf(d, n.trim())); }}><Plus className="mr-2 h-3.5 w-3.5" /> New shelf…</DropdownMenuItem>
                          {s && <DropdownMenuItem onClick={async () => patch(d.id, await setShelf(d, null))}>Remove from shelf</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      {s && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{s}</span>}
                      <span className={`rounded-full px-2 py-0.5 font-medium ${done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{done ? "Completed" : "In progress"}</span>
                    </div>
                    {d.preview && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{d.preview}</p>}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{new Date(d.updated_at ?? d.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" className="accent-primary" checked={picked.has(d.id)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(d.id); else n.delete(d.id); return n; })} /> voice sample</label>
                      {busy === d.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
