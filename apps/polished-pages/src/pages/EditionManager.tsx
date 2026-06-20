import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Loader2, Plus, Library as LibraryIcon, ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDocument, type DocSummary } from "@/lib/documents";
import { listEditions, saveEdition, type Edition } from "@/lib/editions";
import { translateLocalize } from "@/lib/translate";
import { LANGUAGE_NAMES } from "@/lib/languages";
import CountryDatalist from "@/components/app/CountryDatalist";

// Split long markdown into translation-sized chunks at paragraph boundaries
// (the translate function caps each request), then translate and rejoin.
function chunk(md: string, max = 12000): string[] {
  const paras = md.split(/\n\n+/);
  const out: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && (cur.length + p.length + 2) > max) { out.push(cur); cur = ""; }
    cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

// Multi-language Edition Manager: create and track every language edition of a
// book as a linked set. Reuses the translation/localization engine.
const EditionManager = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [editions, setEditions] = useState<Edition[] | null>(null);
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState<"translate" | "localize">("translate");
  const [culture, setCulture] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listDocuments().then((all) => {
      // Storybooks are the primary multilingual educational use case —
      // include them alongside long-form books and tailored CVs.
      const books = all.filter((d) => ["book", "tailored", "storybook"].includes(d.kind));
      setDocs(books);
      if (books[0]) setSelected(books[0].id);
    }).catch(() => setDocs([]));
  }, []);

  useEffect(() => {
    setEditions(null);
    if (selected) listEditions(selected).then(setEditions).catch(() => setEditions([]));
  }, [selected]);

  const createEdition = async () => {
    if (!selected || !language.trim()) { toast({ title: "Pick a book and a language" }); return; }
    setBusy(true);
    try {
      const row = await getDocument(selected);
      const p = (row?.payload ?? {}) as Record<string, unknown>;
      const md = String(p.markdown ?? "");
      if (!md.trim()) throw new Error("This book has no translatable text.");
      const title = String(p.title ?? row?.title ?? "Book");
      const parts = chunk(md);
      const translated: string[] = [];
      for (const part of parts) {
        translated.push(await translateLocalize({ content: part, targetLanguage: language.trim(), culture: culture.trim() || undefined, mode }));
      }
      const outMd = translated.join("\n\n");
      const cultureLabel = mode === "localize" && culture.trim() ? ` · ${culture.trim()}` : "";
      const edTitle = `${title} (${language.trim()}${cultureLabel})`;
      await saveEdition({ parent: selected, language: language.trim(), kind: row?.kind ?? "book", title: edTitle, payload: { markdown: outMd, title: edTitle }, preview: outMd.slice(0, 160), culture: mode === "localize" ? culture.trim() : undefined });
      setLanguage(""); setCulture("");
      setEditions(await listEditions(selected));
      toast({ title: "Edition created", description: `${edTitle} saved to your Library.` });
    } catch (e) {
      toast({ title: "Could not create edition", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const editionLangs = new Set((editions ?? []).filter((e) => !e.is_source).map((e) => (e.edition_language ?? "").toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-publishing/20 bg-publishing/5 px-4 py-1.5 mb-4">
          <Globe className="w-4 h-4 text-publishing" /><span className="text-sm text-publishing font-medium font-sans">Multi-language editions</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Edition <span className="text-gradient-gold italic">manager</span></h1>
        <p className="mt-2 text-muted-foreground font-sans">Create and manage every language edition of a book as one linked set — faithful translation or a culturally localized edition.</p>
      </motion.div>

      {docs === null && <div className="mt-10 flex items-center gap-2 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading your books…</div>}
      {docs && docs.length === 0 && (
        <Card className="mt-8 border-dashed border-border"><CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <LibraryIcon className="h-10 w-10 text-muted-foreground/60" />
          <p className="font-sans text-sm font-medium">No books or storybooks to translate yet</p>
          <div className="flex gap-2">
            <Button asChild variant="hero" size="sm"><Link to="/book">Create a book</Link></Button>
            <Button asChild variant="heroOutline" size="sm"><Link to="/storybook">Create a storybook</Link></Button>
          </div>
        </CardContent></Card>
      )}

      {docs && docs.length > 0 && (
        <>
          <Card className="mt-6 border-border"><CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Source book</Label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">New edition language</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. French" list="edition-langs" maxLength={40} />
                <datalist id="edition-langs">{LANGUAGE_NAMES.map((l) => <option key={l} value={l} />)}</datalist>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Mode</Label>
                <select value={mode} onChange={(e) => setMode(e.target.value as "translate" | "localize")} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  <option value="translate">Faithful translation</option>
                  <option value="localize">Cultural localization</option>
                </select>
              </div>
            </div>
            {mode === "localize" && (
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Culture / country</Label>
                <Input value={culture} onChange={(e) => setCulture(e.target.value)} placeholder="e.g. Japan, Cameroon, Brazil, Norway" maxLength={120} list="country-options" />
                <CountryDatalist />
                <p className="text-[11px] text-muted-foreground font-sans">A culture-native edition: names, places, food, festivals, idioms and units adapted to feel written from within that culture.</p>
              </div>
            )}
            {language && editionLangs.has(language.trim().toLowerCase()) && (
              <p className="text-xs text-gold font-sans">An edition in {language.trim()} already exists — creating another will add a second.</p>
            )}
            <Button variant="hero" size="sm" disabled={busy} onClick={createEdition}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create edition
            </Button>
            <p className="text-[11px] text-muted-foreground font-sans">Each edition is a real translation by the AI engine (counts toward your plan) and is saved to your Library, ready to export or publish.</p>
          </CardContent></Card>

          <h2 className="mt-8 font-serif text-lg font-semibold">Editions</h2>
          {editions === null ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="mt-3 space-y-2">
              {editions.map((e) => (
                <Card key={e.id} className="border-border">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-sans text-sm font-medium">{e.title}</span>
                        {e.is_source ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Source</span>
                          : <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">{e.edition_language}{e.edition_culture ? ` · ${e.edition_culture}` : ""}</span>}
                        {e.listed && <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Check className="h-3 w-3" /> Published</span>}
                      </div>
                    </div>
                    <Button asChild variant="heroOutline" size="sm"><Link to={`/library?open=${e.id}`}>Open <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EditionManager;
