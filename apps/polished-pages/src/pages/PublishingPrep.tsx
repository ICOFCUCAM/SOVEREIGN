import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Check, ExternalLink, BookOpen, Image as ImageIcon, FileDown, Store, Lightbulb, AlertTriangle, Globe, Languages, Network, ArrowRight, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PublishingWorkspaceNav from "@/components/app/PublishingWorkspaceNav";
import { TRIM_SIZES, PAPER_MM_PER_PAGE, getTrim, coverSpec, ingramGutterIn, INGRAM_OUTSIDE_MM } from "@/lib/print-sizes";
import ExportCenter from "@/components/book/ExportCenter";
import WankongStoreCard from "@/components/book/WankongStoreCard";
import { StatValue } from "@/components/brand/CountUp";

// Wankong publishes directly from here (no manual upload); the rest take an
// EPUB / print PDF you upload to them yourself.
const TARGETS: { name: string; format: string; url: string; direct?: boolean }[] = [
  { name: "Wankong store", format: "Direct publish — one click, no upload", url: "#wankong", direct: true },
  { name: "Amazon KDP", format: "EPUB (e-book) · interior PDF + wrap cover (print)", url: "https://kdp.amazon.com" },
  { name: "IngramSpark", format: "EPUB · interior PDF + wrap cover (print)", url: "https://www.ingramspark.com" },
  { name: "Kobo Writing Life", format: "EPUB", url: "https://www.kobo.com/us/en/p/writinglife" },
  { name: "Apple Books", format: "EPUB", url: "https://authors.apple.com" },
  { name: "Google Play Books", format: "EPUB or PDF", url: "https://play.google.com/books/publish" },
  { name: "Draft2Digital", format: "EPUB (distributes to 40+ stores)", url: "https://www.draft2digital.com" },
  { name: "Lulu", format: "EPUB · interior PDF + cover (print)", url: "https://www.lulu.com" },
];

// Deterministic pre-flight: the real steps a title goes through before it's
// store-ready. Each links to the tool that completes it.
const READINESS: { label: string; hint: string; to: string; icon: typeof BookOpen }[] = [
  { label: "Write the manuscript", hint: "Draft or transform the full book", to: "/book", icon: BookOpen },
  { label: "Design the cover", hint: "Front + back wrap, print-ready", to: "/illustrations", icon: ImageIcon },
  { label: "Export the files", hint: "EPUB + print PDF at your trim", to: "/library", icon: FileDown },
  { label: "Go to market", hint: "List and distribute everywhere", to: "/catalog", icon: Store },
];

const LANGS = ["English", "Español", "Français", "Kiswahili", "العربية", "中文", "Português", "हिन्दी", "Deutsch", "Italiano"];
const TINTS = ["hsl(221 83% 53%)", "hsl(262 83% 58%)", "hsl(160 84% 38%)", "hsl(38 92% 50%)", "hsl(330 80% 52%)", "hsl(192 84% 44%)", "hsl(24 80% 50%)", "hsl(280 72% 52%)"];
const initials = (name: string) => {
  const w = name.trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
};

const inIn = (n: number) => `${n.toFixed(3)} in`;
const inMm = (n: number) => `${n.toFixed(1)} mm`;

const PublishingPrep = () => {
  const [trimId, setTrimId] = useState("6x9");
  const [paper, setPaper] = useState("White");
  const [pages, setPages] = useState(40);
  const trim = getTrim(trimId);
  const spec = coverSpec(trim, pages, paper);

  // Deterministic, rule-based publishing advice from the current print
  // settings — print-industry conventions, not generated text.
  const advice: { kind: "tip" | "warn"; text: string }[] = [];
  if (pages < 24) advice.push({ kind: "warn", text: "Most print-on-demand printers require a minimum of ~24 pages. Add content or choose a smaller trim before ordering print." });
  if (pages >= 100) advice.push({ kind: "tip", text: "At this page count the spine is wide enough for text — add the title and author to the spine of your wrap cover." });
  else advice.push({ kind: "tip", text: "Below ~100 pages the spine is narrow; leave spine text off so it can't wrap onto the front or back." });
  advice.push({ kind: "tip", text: paper === "White" ? "White paper suits non-fiction, workbooks and any color or image-heavy interior." : "Cream paper is the convention for novels, chapter books and long-form prose — easier on the eyes." });
  if (trimId === "6x9") advice.push({ kind: "tip", text: "6×9 in is the standard trade-paperback size and a safe default for most fiction and non-fiction." });

  const STATS = [
    { v: String(TARGETS.length), l: "distribution channels" },
    { v: "40+", l: "languages" },
    { v: "1-click", l: "direct to store" },
    { v: "70%", l: "creator royalty" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6"><PublishingWorkspaceNav /></div>

      {/* Command-center hero */}
      <section className="relative overflow-hidden text-white" style={{ background: "radial-gradient(120% 90% at 50% -10%, hsl(222 47% 12%) 0%, hsl(222 47% 7%) 45%, hsl(224 60% 4%) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/4 h-[26rem] w-[26rem] animate-glow-pulse rounded-full bg-[hsl(262_83%_58%)]/25 blur-[120px]" />
          <div className="absolute -top-16 right-1/4 h-[22rem] w-[22rem] animate-glow-pulse rounded-full bg-[hsl(221_83%_53%)]/25 blur-[120px]" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(262_83%_64%)]/60 to-transparent" />
        <div className="container relative max-w-5xl px-6 pb-12 pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
            <Rocket className="h-4 w-4 text-[hsl(262_83%_72%)]" />
            <span className="eyebrow text-white/70">Publishing command center</span>
          </div>
          <h1 className="text-display mt-4 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Run your <span className="bg-gradient-to-r from-[hsl(217_91%_70%)] via-[hsl(245_85%_74%)] to-[hsl(280_85%_74%)] bg-clip-text italic text-transparent">publishing operation</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/55 font-sans">From finished manuscript to every major store and forty languages — one launch console.</p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="bg-[hsl(222_47%_8%)] px-4 py-4 text-center">
                <div className="font-serif text-2xl font-bold text-white"><StatValue text={s.v} /></div>
                <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-white/45">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Launch readiness track */}
        <section>
          <div className="flex items-baseline gap-2">
            <Zap className="h-4 w-4 text-publishing" />
            <h2 className="font-serif text-xl font-bold">Launch sequence</h2>
            <span className="text-xs text-muted-foreground font-sans">manuscript → market</span>
          </div>
          <div className="relative mt-5">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-3">
              {READINESS.map((r, i) => (
                <Link key={r.label} to={r.to} className="group relative text-center">
                  <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-publishing/10 text-publishing ring-4 ring-background transition-colors group-hover:bg-publishing group-hover:text-white">
                    <r.icon className="h-5 w-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-muted-foreground ring-1 ring-border">{i + 1}</span>
                  </span>
                  <div className="mt-3 text-sm font-semibold font-sans group-hover:text-publishing">{r.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-sans">{r.hint}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Distribution network */}
        <section className="mt-12">
          <div className="flex items-baseline gap-2">
            <Network className="h-4 w-4 text-publishing" />
            <h2 className="font-serif text-xl font-bold">Distribution network</h2>
            <span className="text-xs text-muted-foreground font-sans">where your book goes</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TARGETS.map((t, i) => {
              const epub = /epub/i.test(t.format);
              const print = /pdf|print/i.test(t.format);
              const tint = TINTS[i % TINTS.length];
              const inner = (
                <div className={`group flex h-full flex-col rounded-xl border bg-card p-3.5 shadow-e1 transition-all hover:-translate-y-0.5 hover:shadow-e2 ${t.direct ? "border-publishing/40 ring-1 ring-publishing/20" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg font-serif text-xs font-bold text-white" style={{ background: `linear-gradient(150deg, ${tint}, ${tint})`, opacity: 0.95 }}>{initials(t.name)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold font-sans">{t.name}</span>
                    {t.direct ? <Zap className="h-3.5 w-3.5 shrink-0 text-publishing" /> : <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.direct && <span className="rounded-full bg-publishing/15 px-1.5 py-0.5 text-[9px] font-bold text-publishing">DIRECT</span>}
                    {epub && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">EPUB</span>}
                    {print && <span className="rounded-full bg-educational/10 px-1.5 py-0.5 text-[9px] font-bold text-educational">PRINT</span>}
                  </div>
                </div>
              );
              return t.direct
                ? <a key={t.name} href={t.url} className="block h-full">{inner}</a>
                : <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a>;
            })}
          </div>
        </section>

        {/* Localization coverage */}
        <section className="mt-12">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-educational/[0.06] via-card to-primary/[0.05] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-educational" />
                  <h2 className="font-serif text-xl font-bold">Localization coverage</h2>
                </div>
                <p className="mt-1.5 max-w-md text-sm text-muted-foreground font-sans">Adapt any title into new markets — translation and cultural localization into 40+ languages, each a sellable edition.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {LANGS.map((l) => (
                    <span key={l} className="rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium text-foreground/75 font-sans">{l}</span>
                  ))}
                  <span className="rounded-full bg-educational/10 px-2 py-0.5 text-[11px] font-semibold text-educational font-sans">+30 more</span>
                </div>
              </div>
              <Link to="/translate" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.03]">
                <Languages className="h-4 w-4" /> Localize a title <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10"><ExportCenter /></div>

        <div className="mt-6"><WankongStoreCard /></div>

        <Card className="mt-10 border-border">
          <CardHeader><CardTitle className="font-serif text-lg">Cover &amp; spine calculator</CardTitle><CardDescription className="font-sans">For a paperback wrap cover (back + spine + front, with bleed).</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Trim size</Label>
                <select value={trimId} onChange={(e) => setTrimId(e.target.value)} className="w-full field select-premium font-sans">
                  {TRIM_SIZES.filter((t) => t.id !== "a4").map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Paper</Label>
                <select value={paper} onChange={(e) => setPaper(e.target.value)} className="w-full field select-premium font-sans">
                  {Object.keys(PAPER_MM_PER_PAGE).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Page count</Label>
                <Input type="number" min={1} value={pages} onChange={(e) => setPages(Math.max(1, parseInt(e.target.value, 10) || 0))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">Spine width</div>
                <div className="mt-1 font-serif text-lg font-semibold">{inIn(spec.spineIn)}</div>
                <div className="text-xs text-muted-foreground">{inMm(spec.spineMm)}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">Full cover width</div>
                <div className="mt-1 font-serif text-lg font-semibold">{inIn(spec.fullWin)}</div>
                <div className="text-xs text-muted-foreground">{inMm(spec.fullWmm)}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">Full cover height</div>
                <div className="mt-1 font-serif text-lg font-semibold">{inIn(spec.fullHin)}</div>
                <div className="text-xs text-muted-foreground">{inMm(spec.fullHmm)}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-sans">Includes 0.125 in bleed on all outer edges. Spine text is only recommended above ~100 pages. Figures follow KDP guidance; always confirm against your printer’s template before final upload.</p>
          </CardContent>
        </Card>

        <Card className="mt-6 border-publishing/20 bg-publishing/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg"><Lightbulb className="h-4 w-4 text-publishing" /> Publishing advisor</CardTitle>
            <CardDescription className="font-sans">Print-industry guidance for your current settings — {trim.label}, {paper.toLowerCase()} paper, {pages} pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm font-sans">
              {advice.map((a) => (
                <li key={a.text} className="flex gap-2">
                  {a.kind === "warn"
                    ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    : <Check className="mt-0.5 h-4 w-4 shrink-0 text-publishing" />}
                  <span className={a.kind === "warn" ? "text-foreground" : "text-muted-foreground"}>{a.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 border-border">
          <CardHeader><CardTitle className="font-serif text-lg">IngramSpark interior margins</CardTitle><CardDescription className="font-sans">The “IngramSpark” export in the book reader builds these automatically for your page count.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">Inside (gutter) margin</div>
                <div className="mt-1 font-serif text-lg font-semibold">{inIn(ingramGutterIn(pages))}</div>
                <div className="text-xs text-muted-foreground">grows with page count</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">Outside / top / bottom</div>
                <div className="mt-1 font-serif text-lg font-semibold">{inIn(INGRAM_OUTSIDE_MM / 25.4)}</div>
                <div className="text-xs text-muted-foreground">safety margin</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground font-sans">For</div>
                <div className="mt-1 font-serif text-lg font-semibold">{pages} pages</div>
                <div className="text-xs text-muted-foreground">set above</div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground font-sans">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Mirrored margins — the gutter sits on the binding edge of each left/right page.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Title page and copyright page generated as front matter.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Each chapter opens on a right-hand (recto) page; page numbers on the outer edge.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Set in Liberation Serif (SIL OFL), fully embedded so it passes “all fonts embedded” preflight.</li>
            </ul>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground font-sans">
          Open any book in the <Link to="/library" className="text-primary hover:underline">Library</Link> or a creator to export EPUB / print PDF.
        </p>
      </div>
    </div>
  );
};

export default PublishingPrep;
