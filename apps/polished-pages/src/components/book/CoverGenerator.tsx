import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, CheckCircle2, Crown, Download, FileDown, ImageIcon, Loader2, Plus, Ruler, Save, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/lib/cover-fonts";
import { useToast } from "@/hooks/use-toast";
import { authHeader, fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { translateLocalize } from "@/lib/translate";
import { recordBatchOp } from "@/lib/editions";
import { LANGUAGE_NAMES } from "@/lib/languages";
import { PAPER_MM_PER_PAGE, TRIM_SIZES } from "@/lib/print-sizes";
import { COVER_FONTS, FONT_CATEGORIES, FONT_PAIRINGS, TEMPLATES, fontOf, coverChecks, defaultDesign, estimatePages, templateById, toIsbn13, type CoverDesign, type FontKey, type TitlePos } from "@/lib/cover-design";
import { artDpi, backImage, downloadBack, downloadFront, exportPrintPdf, frontImage, loadImage, shrinkImage } from "@/lib/cover-render";
import { findBookCover, saveCover } from "@/lib/book-covers";
import type { CoverCopyWriter } from "@/lib/cover-copy";
import CoverPreview from "@/components/book/CoverPreview";
import CoverPackage from "@/components/book/CoverPackage";

type Side = "front" | "back";

const STYLE_PRESETS: { label: string; text: string }[] = [
  { label: "Minimalist", text: "Clean minimalist composition, a single strong focal image, generous empty space." },
  { label: "Illustrated", text: "Hand-drawn illustration, warm palette, rich detail reminiscent of classic picture books." },
  { label: "Photographic", text: "Photorealistic, cinematic lighting, shallow depth of field, editorial quality." },
  { label: "Abstract", text: "Abstract geometric shapes, bold colours, modern graphic design." },
  { label: "Dark & Moody", text: "Dark dramatic scene, high contrast, mist and shadow, atmospheric." },
  { label: "Watercolour", text: "Soft watercolour wash, gentle brushwork, luminous and calm." },
];
const PRO_PERKS = [
  "Text-free cover artwork, typeset with professional templates",
  "Back cover with blurb, endorsements, bio and ISBN barcode",
  "Print-ready full-wrap PDF and ebook cover",
];
const INKS: { v: string | null; l: string }[] = [{ v: null, l: "Auto" }, { v: "#ffffff", l: "White" }, { v: "#14171d", l: "Dark" }, { v: "#f6e7c1", l: "Cream" }, { v: "#d8b45a", l: "Gold" }];

// A typeface menu grouped by kind, each face shown in itself.
function TypefacePicker({ label, value, fallback, sample, textOnly, onChange }: { label: string; value: FontKey | null; fallback: FontKey; sample: string; textOnly?: boolean; onChange: (v: FontKey | null) => void }) {
  const keys = (Object.keys(COVER_FONTS) as FontKey[]).filter((k) => !textOnly || fontOf(k).text);
  return (
    <div className="space-y-1.5"><Label className="font-sans text-xs">{label}</Label>
      <Select value={value ?? "__"} onValueChange={(v) => onChange(v === "__" ? null : (v as FontKey))}>
        <SelectTrigger aria-label={label}><span className="truncate" style={{ fontFamily: fontOf(value ?? fallback).family }}>{value ? fontOf(value).label : `Template's · ${fontOf(fallback).label}`}</span></SelectTrigger>
        <SelectContent className="max-h-[360px]">
          <SelectItem value="__">Template's · {fontOf(fallback).label}</SelectItem>
          {FONT_CATEGORIES.map((c) => {
            const inCat = keys.filter((k) => fontOf(k).category === c);
            if (!inCat.length) return null;
            return (
              <SelectGroup key={c}>
                <SelectLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{c}</SelectLabel>
                {inCat.map((k) => (
                  <SelectItem key={k} value={k} textValue={fontOf(k).label}>
                    <span className="flex flex-col">
                      <span className="text-base leading-tight" style={{ fontFamily: fontOf(k).family }}>{sample.slice(0, 32)}</span>
                      <span className="text-[10px] text-muted-foreground">{fontOf(k).label} · {fontOf(k).line}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Couldn't read the file.")); r.readAsDataURL(f); });
const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

// Cover Studio. Artwork comes from OpenAI's image model (the platform's image
// engine; Claude has no image model) or the author's own upload, always WITHOUT
// lettering; the title, author, back-cover copy, spine and barcode are typeset
// here from professional templates, sized to the trim, page count and paper.
// Cover design is a Pro-plan capability.
const CoverGenerator = (props: {
  title?: string; subtitle?: string; author?: string; isbn?: string; publisher?: string; pageCount?: string; paper?: string; trimSize?: string;
  onGenerated?: () => void;
  /** The book's text, for "Write with Claude" and the page estimate. */
  bookText?: () => Promise<string> | string;
  copyWriter?: CoverCopyWriter;
  /** The book this cover belongs to; its saved cover is reopened. */
  bookId?: string | null;
  ensureSaved?: () => Promise<string | null | undefined>;
  onSaved?: (coverId: string) => void;
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [d, setD] = useState<CoverDesign>(() => defaultDesign({
    title: props.title ?? "", subtitle: props.subtitle ?? "", author: props.author ?? "", isbn: props.isbn ?? "", publisher: props.publisher ?? "",
    pages: Number(props.pageCount) || 0, paper: props.paper || "Cream", trimId: props.trimSize || "6x9",
  }));
  const [coverId, setCoverId] = useState<string | null>(null);
  const [artDir, setArtDir] = useState<Record<Side, string>>({ front: "", back: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back" | "wrap">("front");
  const [guides, setGuides] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [dpi, setDpi] = useState<number | null>(null);
  const [words, setWords] = useState<number | null>(null);
  const [coverLangs, setCoverLangs] = useState<string[]>([]);
  const [batchImg, setBatchImg] = useState<Record<string, string>>({});
  const fileFor = useRef<"front" | "back" | "photo">("front");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  const isPro = !!status?.plan && status.plan !== "free"; // any paid tier

  // Reopen the cover saved for this book.
  useEffect(() => {
    if (!props.bookId) return;
    let on = true;
    findBookCover(props.bookId).then((c) => { if (on && c) { setD(c.payload.design); setCoverId(c.id); } }).catch(() => {});
    return () => { on = false; };
  }, [props.bookId]);

  useEffect(() => {
    if (!d.frontArt) { setDpi(null); return; }
    loadImage(d.frontArt).then((img) => setDpi(artDpi(img, d))).catch(() => setDpi(null));
  }, [d.frontArt, d.trimId, d.pages, d.paper]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof CoverDesign>(k: K, v: CoverDesign[K]) => setD((x) => ({ ...x, [k]: v }));
  const onOverflow = useCallback((v: boolean) => setOverflow(v), []);
  const t = templateById(d.template);

  const getText = async () => String((await props.bookText?.()) ?? "");
  const estimate = async () => {
    const n = wordCount(await getText());
    setWords(n);
    if (!n) { toast({ title: "No manuscript text to count", description: "Enter the page count from your interior PDF instead." }); return; }
    set("pages", estimatePages(n, d.trimId));
  };

  const generate = async (side: Side) => {
    if (!d.title.trim() && !artDir[side].trim()) { toast({ title: "Add the title or some art direction first", variant: "destructive" }); return; }
    setBusy(`art-${side}`);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-cover`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ side, textless: true, titlePos: d.titlePos ?? t.titlePos, instruction: artDir[side], title: d.title, subtitle: d.subtitle }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Artwork generation failed"); }
      const src = await shrinkImage((await res.json()).image as string);
      set(side === "front" ? "frontArt" : "backArt", src);
    } catch (e) {
      toast({ title: "Couldn't create the artwork", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setBusy(null); }
  };
  const pickFile = (which: "front" | "back" | "photo") => { fileFor.current = which; fileInput.current?.click(); };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { toast({ title: "Use a PNG, JPEG or WebP image", variant: "destructive" }); return; }
    const which = fileFor.current;
    const src = await shrinkImage(await readFile(f), which === "photo" ? 800 : 3000, 0.92);
    set(which === "front" ? "frontArt" : which === "back" ? "backArt" : "authorPhoto", src);
  };

  const writeCopy = async () => {
    if (!props.copyWriter) return;
    setBusy("copy");
    try {
      const text = await getText();
      if (!text.trim()) throw new Error("There's no manuscript text yet to write from.");
      const c = await props.copyWriter.write({ title: d.title, subtitle: d.subtitle, author: d.author, text });
      setD((x) => ({ ...x, tagline: c.tagline || x.tagline, backHeadline: c.backHeadline || x.backHeadline, blurb: c.blurb || x.blurb, bio: c.bio || x.bio, category: c.category || x.category, template: c.template ?? x.template }));
      setArtDir((a) => ({ front: a.front || c.frontArt, back: a.back || c.backArt }));
      toast({ title: `Cover copy written · ${props.copyWriter.label}`, description: "Read it through and fill in any [placeholders] in the bio before printing." });
    } catch (e) {
      toast({ title: "Couldn't write the cover copy", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(null); }
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast({ title: "That didn't work", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  const save = () => run("save", async () => {
    let bookId = props.bookId ?? null;
    if (!bookId && props.ensureSaved) bookId = (await props.ensureSaved()) ?? null;
    const [front, back] = await Promise.all([frontImage(d, "web"), backImage(d)]);
    const id = await saveCover({ front, back, title: d.title, subtitle: d.subtitle, author: d.author, design: d }, { id: coverId, bookId });
    setCoverId(id);
    props.onSaved?.(id);
    props.onGenerated?.();
    toast({ title: coverId ? "Cover updated" : "Cover saved", description: bookId ? "Saved with the book in your Library." : "Saved to your Library." });
  });
  const translateBatch = () => run("langs", async () => {
    const out: Record<string, string> = { ...batchImg };
    for (const lang of coverLangs) {
      setBusy(`langs:${lang}`);
      const tr = async (s: string) => (s.trim() ? (await translateLocalize({ content: s, targetLanguage: lang, mode: "translate" }).catch(() => s)).replace(/^#+\s*/, "").trim() : s);
      const [title, subtitle, tagline] = await Promise.all([tr(d.title), tr(d.subtitle), tr(d.tagline)]);
      out[lang] = await frontImage({ ...d, title, subtitle, tagline }, "web");
      setBatchImg({ ...out });
    }
    recordBatchOp(coverLangs.length);
  });

  // Gate: cover design is a Pro-plan capability.
  if (status && !isPro) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-lg"><Crown className="h-5 w-5 text-gold" /> Cover Studio is a Pro feature</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-sans">Design bookstore-quality front and back covers, a spine sized to your book, and print-ready files.</p>
          <ul className="mt-3 space-y-1.5">{PRO_PERKS.map((p) => <li key={p} className="flex items-start gap-2 text-sm font-sans"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}</li>)}</ul>
          <Button variant="hero" className="mt-4" onClick={() => startUpgrade().catch(() => {})}><Crown className="mr-2 h-4 w-4" /> Upgrade to Pro</Button>
        </CardContent>
      </Card>
    );
  }

  const checks = coverChecks(d);
  if (dpi !== null && dpi < 200) checks.push({ level: "warn", text: `The front artwork prints at about ${dpi} dpi on this trim (300 is ideal). Generated art is 1024 × 1536; for sharper print, upload a larger image.` });
  if (overflow) checks.push({ level: "warn", text: "The back-cover text doesn't fit above the barcode, even made smaller. Shorten the blurb, endorsements or bio." });
  const isbnOk = !d.isbn.trim() || Boolean(toIsbn13(d.isbn));
  const field = (k: keyof CoverDesign, label: string, o: { ph?: string; max?: number; area?: number } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`cv-${k}`} className="font-sans text-xs">{label}</Label>
      {o.area ? <Textarea id={`cv-${k}`} rows={o.area} value={String(d[k] ?? "")} placeholder={o.ph} maxLength={o.max} onChange={(e) => set(k, e.target.value as never)} className="text-sm" />
        : <Input id={`cv-${k}`} value={String(d[k] ?? "")} placeholder={o.ph} maxLength={o.max} onChange={(e) => set(k, e.target.value as never)} />}
    </div>
  );
  const artPanel = (side: Side) => {
    const src = side === "front" ? d.frontArt : d.backArt;
    return (
      <div className="space-y-2.5 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between"><span className="text-sm font-semibold">{side === "front" ? "Front artwork" : "Back artwork"}</span>
          {src && <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => set(side === "front" ? "frontArt" : "backArt", null)}><Trash2 className="inline h-3.5 w-3.5" /> Remove</button>}</div>
        <div className="flex gap-3">
          <div className="grid aspect-[2/3] w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30">
            {busy === `art-${side}` ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea rows={3} maxLength={1200} value={artDir[side]} onChange={(e) => setArtDir((a) => ({ ...a, [side]: e.target.value }))} className="resize-none text-xs"
              placeholder={side === "front" ? "Subject, mood, colours, style… (no text is drawn into the art)" : "A quieter background that matches the front…"} aria-label={`${side} art direction`} />
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="hero" className="h-8" disabled={busy !== null} onClick={() => generate(side)}><Sparkles className="mr-1 h-3.5 w-3.5" /> {src ? "Regenerate" : "Generate"}</Button>
              <Button size="sm" variant="heroOutline" className="h-8" onClick={() => pickFile(side)}><Upload className="mr-1 h-3.5 w-3.5" /> Upload</Button>
            </div>
          </div>
        </div>
        {side === "front" && <div className="flex flex-wrap gap-1">{STYLE_PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => setArtDir((a) => ({ ...a, front: a.front ? `${a.front} ${p.text}` : p.text }))}
            className="rounded-full border border-border px-2 py-0.5 text-[11px] font-sans text-muted-foreground transition hover:border-primary/40 hover:text-primary">{p.label}</button>))}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="cover-studio">
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Preview */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-border p-0.5 text-xs" role="tablist" aria-label="Cover view">
              {([["front", "Front"], ["back", "Back"], ["wrap", "Full wrap"]] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`rounded-full px-3 py-1 ${view === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={guides} onCheckedChange={setGuides} aria-label="Show print guides" /> Print guides</label>
          </div>
          <div className="grid place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_30%,hsl(var(--muted))_0%,hsl(var(--muted)/0.35)_70%)] p-5 sm:p-8">
            <CoverPreview design={d} part={view} guides={guides} onOverflow={onOverflow} className={view === "wrap" ? "w-full" : "w-full max-w-[360px]"} />
            {view === "wrap" && guides && <p className="mt-3 text-center text-[11px] text-muted-foreground"><span className="text-[#00b7ff]">Blue</span>: trim and spine folds · <span className="text-[#ff2fa8]">pink</span>: keep text inside · <span className="text-[#ffb000]">amber</span>: barcode · pale edge: bleed, cut off</p>}
          </div>
          <ul className="space-y-1.5" aria-label="Cover checks">
            {checks.map((c) => (
              <li key={c.text} className="flex items-start gap-2 text-xs">
                {c.level === "ok" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />}
                <span className={c.level === "ok" ? "text-muted-foreground" : ""}>{c.text}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="hero" size="sm" disabled={busy !== null || !d.pages} title={!d.pages ? "Set the page count first" : "Back, spine and front with bleed, at 300 dpi"} onClick={() => run("pdf", () => exportPrintPdf(d))}>
              {busy === "pdf" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} Print PDF (KDP · IngramSpark)
            </Button>
            <Button variant="heroOutline" size="sm" disabled={busy !== null || !d.pages} onClick={() => run("proof", () => exportPrintPdf(d, { guides: true }))}><Ruler className="mr-1.5 h-4 w-4" /> Proof with guides</Button>
            <Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => run("ebook", () => downloadFront(d, "ebook"))}><BookOpen className="mr-1.5 h-4 w-4" /> Ebook cover</Button>
            <Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => run("back", () => downloadBack(d))}><Download className="mr-1.5 h-4 w-4" /> Back JPEG</Button>
            <Button size="sm" className="ml-auto rounded-full bg-gradient-to-r from-[hsl(221_83%_53%)] to-[hsl(262_83%_58%)] text-white hover:opacity-95" disabled={busy !== null} onClick={save}>
              {busy === "save" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} {coverId ? "Update cover" : "Save cover"}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Tabs defaultValue="book" className="min-w-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="book">Book</TabsTrigger><TabsTrigger value="art">Artwork</TabsTrigger><TabsTrigger value="design">Design</TabsTrigger><TabsTrigger value="back">Back</TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="space-y-3 pt-2">
            {field("title", "Title", { max: 120 })}
            {field("subtitle", "Subtitle", { max: 160 })}
            {field("author", "Author", { max: 80 })}
            {field("seriesLine", "Series line (above the title)", { ph: "e.g. Book 2 of The Harbour Trilogy", max: 80 })}
            {field("tagline", "Front tagline", { ph: "One short line", max: 120 })}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="font-sans text-xs">Trim size</Label>
                <Select value={d.trimId} onValueChange={(v) => set("trimId", v)}><SelectTrigger aria-label="Trim size"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRIM_SIZES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="font-sans text-xs">Paper</Label>
                <Select value={d.paper} onValueChange={(v) => set("paper", v)}><SelectTrigger aria-label="Paper"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(PAPER_MM_PER_PAGE).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cv-pages" className="font-sans text-xs">Page count (sets the spine width)</Label>
              <div className="flex gap-2">
                <Input id="cv-pages" type="number" min={0} max={1200} value={d.pages || ""} onChange={(e) => set("pages", Math.max(0, Math.min(1200, Number(e.target.value) || 0)))} placeholder="From your interior PDF" />
                {props.bookText && <Button type="button" variant="heroOutline" size="sm" className="h-10 shrink-0" onClick={estimate}>Estimate</Button>}
              </div>
              {words !== null && words > 0 && <p className="text-[11px] text-muted-foreground">About {words.toLocaleString()} words → {estimatePages(words, d.trimId)} pages at this trim. Use the real count from your interior file before printing.</p>}
            </div>
          </TabsContent>

          <TabsContent value="art" className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Artwork is created without any lettering; the type is set by Cover Studio, so it's always sharp and spelled right. Generated by OpenAI's image model, billed to your plan, or upload your own.</p>
            {artPanel("front")}
            <div className="space-y-2 rounded-xl border border-border p-3">
              <span className="text-sm font-semibold">Back background</span>
              <div className="flex rounded-full border border-border p-0.5 text-xs">
                {([["front-blur", "Blurred front art"], ["solid", "Solid colour"]] as const).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => { set("backFill", k); set("backArt", null); }} className={`flex-1 rounded-full px-2 py-1 ${!d.backArt && d.backFill === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{l}</button>
                ))}
              </div>
            </div>
            {artPanel("back")}
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted/40">{d.authorPhoto && <img src={d.authorPhoto} alt="Author" className="h-full w-full object-cover" />}</div>
              <div className="flex-1 text-sm font-semibold">Author photo <span className="block text-xs font-normal text-muted-foreground">Shown beside the bio on the back</span></div>
              <Button size="sm" variant="heroOutline" className="h-8" onClick={() => pickFile("photo")}>{d.authorPhoto ? "Replace" : "Upload"}</Button>
              {d.authorPhoto && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove photo" onClick={() => set("authorPhoto", null)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2.5">
              {TEMPLATES.map((x) => (
                <button key={x.id} type="button" onClick={() => setD((v) => ({ ...v, template: x.id, titleFont: null, bodyFont: null, titlePos: null }))} aria-pressed={d.template === x.id} data-template={x.id}
                  className={`rounded-xl border p-1.5 text-left transition ${d.template === x.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}>
                  <CoverPreview design={{ ...d, template: x.id, titleFont: null, bodyFont: null, titlePos: null }} part="front" label={`${x.label} template`} />
                  <span className="mt-1.5 block text-xs font-semibold">{x.label}</span>
                  <span className="block text-[10px] leading-tight text-muted-foreground">{x.line}</span>
                </button>
              ))}
            </div>
            <div className="space-y-1.5"><Label className="font-sans text-xs">Font pairings</Label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_PAIRINGS.map((x) => {
                  const on = (d.titleFont ?? t.titleFont) === x.title && (d.bodyFont ?? t.bodyFont) === x.body;
                  return (
                    <button key={x.label} type="button" onClick={() => setD((v) => ({ ...v, titleFont: x.title, bodyFont: x.body }))} aria-pressed={on}
                      className={`rounded-xl border px-2.5 py-1.5 text-left transition ${on ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <span className="block text-[15px] leading-tight" style={{ fontFamily: fontOf(x.title).family }}>{x.label}</span>
                      <span className="block text-[10px] text-muted-foreground" style={{ fontFamily: fontOf(x.body).family }}>{fontOf(x.title).label} + {fontOf(x.body).label}</span>
                    </button>
                  );
                })}
              </div></div>
            <TypefacePicker label="Title typeface" value={d.titleFont} fallback={t.titleFont} sample={d.title || "The Long Road Home"} onChange={(v) => set("titleFont", v)} />
            <TypefacePicker label="Text typeface (subtitle, author, back cover)" value={d.bodyFont} fallback={t.bodyFont} sample={d.author || "A story of faith and return"} textOnly onChange={(v) => set("bodyFont", v)} />
            <div className="space-y-2"><Label className="font-sans text-xs">Title size · {Math.round(d.titleScale * 100)}%</Label>
              <Slider min={0.6} max={1.6} step={0.05} value={[d.titleScale]} onValueChange={([v]) => set("titleScale", v)} aria-label="Title size" /></div>
            <div className="space-y-1.5"><Label className="font-sans text-xs">Title position</Label>
              <div className="flex rounded-full border border-border p-0.5 text-xs">
                {(["top", "middle", "bottom"] as TitlePos[]).map((k) => (
                  <button key={k} type="button" onClick={() => set("titlePos", k)} className={`flex-1 rounded-full px-2 py-1 capitalize ${(d.titlePos ?? t.titlePos) === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{k}</button>
                ))}
              </div></div>
            <div className="space-y-1.5"><Label className="font-sans text-xs">Text colour</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {INKS.map((x) => (
                  <button key={x.l} type="button" onClick={() => set("ink", x.v)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${d.ink === x.v ? "border-primary bg-primary/10" : "border-border"}`}>
                    {x.v && <span className="h-3 w-3 rounded-full border border-border" style={{ background: x.v }} />}{x.l}</button>
                ))}
                <input type="color" aria-label="Custom text colour" value={d.ink ?? "#ffffff"} onChange={(e) => set("ink", e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent" />
              </div></div>
            <div className="flex items-center gap-3"><Label className="font-sans text-xs">Accent</Label>
              <input type="color" aria-label="Accent colour" value={d.accent ?? t.accent} onChange={(e) => set("accent", e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent" />
              {d.accent && <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => set("accent", null)}>Use template's</button>}</div>
            <div className="space-y-2"><Label className="font-sans text-xs">Shading behind the text · {Math.round(d.shade * 100)}%</Label>
              <Slider min={0} max={1} step={0.05} value={[d.shade]} onValueChange={([v]) => set("shade", v)} aria-label="Shading" /></div>
          </TabsContent>

          <TabsContent value="back" className="space-y-3 pt-2">
            {props.copyWriter && (
              <Button type="button" variant="hero" size="sm" className="w-full" disabled={busy !== null} onClick={writeCopy}>
                {busy === "copy" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1.5 h-4 w-4" />} Write the cover copy from my book · {props.copyWriter.label}
              </Button>
            )}
            {field("backHeadline", "Back headline", { ph: "A short hook line", max: 140 })}
            <div className="space-y-1.5">
              <Label htmlFor="cv-blurb" className="flex justify-between font-sans text-xs"><span>Blurb</span><span className="text-muted-foreground">{wordCount(d.blurb)} words</span></Label>
              <Textarea id="cv-blurb" rows={7} value={d.blurb} onChange={(e) => set("blurb", e.target.value)} placeholder="120–200 words. Leave a blank line between paragraphs." className="text-sm" />
            </div>
            <div className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Endorsements</span>
                <Button size="sm" variant="ghost" className="h-7" disabled={d.endorsements.length >= 3} onClick={() => set("endorsements", [...d.endorsements, { quote: "", by: "" }])}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button></div>
              <p className="text-[11px] text-muted-foreground">Only real quotes you have permission to print. Claude never writes these.</p>
              {d.endorsements.map((e, i) => (
                <div key={i} className="space-y-1.5 rounded-lg bg-muted/40 p-2">
                  <Textarea rows={2} value={e.quote} placeholder="The quote" aria-label={`Endorsement ${i + 1}`} onChange={(ev) => set("endorsements", d.endorsements.map((x, j) => (j === i ? { ...x, quote: ev.target.value } : x)))} className="text-xs" />
                  <div className="flex gap-1.5"><Input value={e.by} placeholder="Name, role or publication" aria-label={`Endorsement ${i + 1} by`} onChange={(ev) => set("endorsements", d.endorsements.map((x, j) => (j === i ? { ...x, by: ev.target.value } : x)))} className="h-8 text-xs" />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Remove endorsement" onClick={() => set("endorsements", d.endorsements.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                </div>
              ))}
            </div>
            {field("bio", "Author bio", { area: 3, ph: "40–70 words, third person" })}
            <div className="grid grid-cols-2 gap-3">
              {field("publisher", "Publisher / imprint", { max: 60 })}
              {field("price", "Price (optional)", { ph: "$16.99", max: 20 })}
            </div>
            {field("category", "Category line", { ph: "e.g. Religion / Christian Living", max: 80 })}
            <div className="space-y-1.5">
              <Label htmlFor="cv-isbn" className="font-sans text-xs">ISBN (paperback)</Label>
              <Input id="cv-isbn" value={d.isbn} onChange={(e) => set("isbn", e.target.value)} placeholder="978…" aria-invalid={!isbnOk} className={isbnOk ? "" : "border-destructive"} />
              <p className="text-[11px] text-muted-foreground">{d.isbn.trim() ? (isbnOk ? "A real EAN-13 barcode is drawn from it." : "Not a valid ISBN-10 or ISBN-13.") : "No ISBN: leave the barcode area clear and KDP adds a free barcode there."}</p>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span>Keep the barcode area clear</span><Switch checked={d.reserveBarcode} onCheckedChange={(v) => set("reserveBarcode", v)} /></label>
          </TabsContent>
        </Tabs>
      </div>

      <CoverPackage getFront={() => frontImage(d, "web", "image/png")} title={d.title || "Book"} author={d.author} subtitle={d.subtitle} pageCount={String(d.pages || "")} paper={d.paper} trimSize={d.trimId} />

      {/* The same design in other languages: the title, subtitle and tagline are translated and re-set; no new artwork is generated. */}
      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="font-serif text-base">Covers in other languages</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground font-sans">The title, subtitle and tagline are translated and set on the same artwork, so every edition matches.</p>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_NAMES.map((l) => {
              const on = coverLangs.includes(l);
              return <button key={l} type="button" onClick={() => setCoverLangs((c) => (on ? c.filter((x) => x !== l) : [...c, l]))} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>;
            })}
          </div>
          <Button variant="hero" size="sm" disabled={busy !== null || coverLangs.length === 0} onClick={translateBatch}>
            {busy?.startsWith("langs") ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {busy?.startsWith("langs:") ? `Translating · ${busy.slice(6)}` : `Make ${coverLangs.length || ""} cover${coverLangs.length === 1 ? "" : "s"}`}
          </Button>
          {Object.keys(batchImg).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(batchImg).map(([lang, src]) => (
                <div key={lang}>
                  <div className="overflow-hidden rounded-lg border border-border"><img src={src} alt={lang} className="w-full" /></div>
                  <div className="mt-1 flex items-center justify-between"><span className="text-xs text-muted-foreground font-sans">{lang}</span>
                    <button type="button" aria-label={`Download ${lang} cover`} onClick={() => { const a = document.createElement("a"); a.href = src; a.download = `cover-${lang}.jpg`; a.click(); }} className="text-xs text-primary hover:underline"><Download className="inline h-3.5 w-3.5" /></button></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoverGenerator;
