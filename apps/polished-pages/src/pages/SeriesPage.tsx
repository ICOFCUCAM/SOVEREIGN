import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Library as LibraryIcon, Loader2, Plus, Trash2, BookHeart, ArrowRight, X, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CountryDatalist from "@/components/app/CountryDatalist";
import { createSeries, listSeries, getSeries, deleteSeries, setDocumentSeries, type SeriesSummary, type SeriesDetail } from "@/lib/series";
import { listDocuments, type DocSummary } from "@/lib/documents";

const BOOK_KINDS = new Set(["storybook", "book", "tailored", "cover"]);

const SeriesPage = () => {
  const { toast } = useToast();
  const [series, setSeries] = useState<SeriesSummary[] | null>(null);
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SeriesDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [form, setForm] = useState({ title: "", premise: "", setting: "", objective: "", language: "", culture: "" });

  const loadSeries = () => { listSeries().then(setSeries).catch(() => setSeries([])); };
  useEffect(() => {
    loadSeries();
    listDocuments().then((d) => setDocs(d.filter((x) => BOOK_KINDS.has(x.kind)))).catch(() => {});
  }, []);

  const openSeries = async (id: string) => {
    if (openId === id) { setOpenId(null); setDetail(null); return; }
    setOpenId(id); setDetail(null);
    try { setDetail(await getSeries(id)); } catch { /* ignore */ }
  };

  const create = async () => {
    if (!form.title.trim()) { toast({ title: "A series title is required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      await createSeries(form);
      setForm({ title: "", premise: "", setting: "", objective: "", language: "", culture: "" });
      setDlgOpen(false);
      loadSeries();
      toast({ title: "Series created", description: "Add books or start a new one in this universe." });
    } catch (e) {
      toast({ title: "Could not create", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setCreating(false); }
  };

  const removeSeries = async (id: string) => {
    try { await deleteSeries(id); if (openId === id) { setOpenId(null); setDetail(null); } loadSeries(); toast({ title: "Series deleted", description: "Its books are kept in your Library." }); }
    catch (e) { toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const attach = async (seriesId: string, documentId: string) => {
    const nextIdx = (detail?.books.length ?? 0) + 1;
    try { await setDocumentSeries(documentId, seriesId, nextIdx); setDetail(await getSeries(seriesId)); loadSeries(); }
    catch (e) { toast({ title: "Could not add book", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const detach = async (seriesId: string, documentId: string) => {
    try { await setDocumentSeries(documentId, null, null); setDetail(await getSeries(seriesId)); loadSeries(); }
    catch (e) { toast({ title: "Could not remove", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const inSeriesIds = new Set(detail?.books.map((b) => b.id) ?? []);
  const attachable = docs.filter((d) => !inSeriesIds.has(d.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-3">
            <Layers className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold-light font-medium font-sans">Series</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Book series</h1>
          <p className="mt-1 text-muted-foreground font-sans">A shared universe — characters, setting and objective — that every book in the series carries.</p>
        </div>
        <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
          <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="mr-1 h-4 w-4" /> New series</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Create a series</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs font-sans">Series title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lina the Explorer" maxLength={120} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-sans">Premise</Label><Textarea value={form.premise} onChange={(e) => setForm({ ...form, premise: e.target.value })} rows={2} placeholder="e.g. A curious girl discovers a new wonder in every book." maxLength={400} className="resize-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label className="text-xs font-sans">Setting</Label><Input value={form.setting} onChange={(e) => setForm({ ...form, setting: e.target.value })} placeholder="e.g. a glowing forest" maxLength={200} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-sans">Educational objective</Label><Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="e.g. courage & kindness" maxLength={200} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label className="text-xs font-sans">Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="e.g. English" maxLength={40} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-sans">Culture / country</Label><Input value={form.culture} onChange={(e) => setForm({ ...form, culture: e.target.value })} placeholder="e.g. United States" maxLength={120} list="country-options" /><CountryDatalist /></div>
              </div>
              <Button variant="hero" size="sm" onClick={create} disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create series</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {series === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {series && series.length === 0 && (
        <Card className="mt-8 border-dashed border-border"><CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/60" />
          <p className="font-sans text-sm font-medium">No series yet</p>
          <p className="max-w-sm text-sm text-muted-foreground font-sans">Create a series to build a whole collection of books in one shared universe — Book 1, Book 2, Book 3.</p>
        </CardContent></Card>
      )}

      {series && series.length > 0 && (
        <div className="mt-6 space-y-3">
          {series.map((s) => (
            <Card key={s.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => openSeries(s.id)} className="min-w-0 text-left">
                    <div className="flex items-center gap-2"><BookHeart className="h-4 w-4 text-primary" /><span className="font-serif text-base font-semibold">{s.title}</span><span className="text-xs text-muted-foreground font-sans">{s.book_count} book{s.book_count === 1 ? "" : "s"}</span></div>
                    {s.premise && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground font-sans">{s.premise}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground font-sans">
                      {s.setting && <span>Setting: {s.setting}</span>}
                      {s.educational_objective && <span>Objective: {s.educational_objective}</span>}
                      {s.culture && <span>Culture: {s.culture}</span>}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button asChild variant="heroOutline" size="sm"><Link to={`/storybook?series=${s.id}`}>New book <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeSeries(s.id)} aria-label="Delete series"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                {openId === s.id && (
                  <div className="mt-4 border-t border-border pt-3">
                    {detail === null ? <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div> : (
                      <>
                        {detail.books.length === 0 ? <p className="text-xs text-muted-foreground font-sans">No books in this series yet. Add a saved book below, or start a new one.</p> : (
                          <ol className="space-y-1.5">
                            {detail.books.map((b, i) => (
                              <li key={b.id} className="flex items-center justify-between gap-2 text-sm font-sans">
                                <span className="truncate"><span className="text-muted-foreground">Book {b.series_index ?? i + 1}:</span> {b.title}</span>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => detach(s.id, b.id)} aria-label="Remove from series"><X className="h-4 w-4" /></Button>
                              </li>
                            ))}
                          </ol>
                        )}
                        {attachable.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <LibraryIcon className="h-4 w-4 text-muted-foreground" />
                            <select defaultValue="" onChange={(e) => { if (e.target.value) { attach(s.id, e.target.value); e.target.value = ""; } }} className="flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-sans">
                              <option value="">Add a saved book to this series…</option>
                              {attachable.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeriesPage;
