import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TRIM_SIZES, PAPER_MM_PER_PAGE, getTrim, coverSpec, ingramGutterIn, INGRAM_OUTSIDE_MM } from "@/lib/print-sizes";
import ExportCenter from "@/components/book/ExportCenter";

const TARGETS: { name: string; format: string; url: string }[] = [
  { name: "Amazon KDP", format: "EPUB (e-book) · interior PDF + wrap cover (print)", url: "https://kdp.amazon.com" },
  { name: "IngramSpark", format: "EPUB · interior PDF + wrap cover (print)", url: "https://www.ingramspark.com" },
  { name: "Kobo Writing Life", format: "EPUB", url: "https://www.kobo.com/us/en/p/writinglife" },
  { name: "Apple Books", format: "EPUB", url: "https://authors.apple.com" },
  { name: "Google Play Books", format: "EPUB or PDF", url: "https://play.google.com/books/publish" },
  { name: "Draft2Digital", format: "EPUB (distributes to 40+ stores)", url: "https://www.draft2digital.com" },
  { name: "Lulu", format: "EPUB · interior PDF + cover (print)", url: "https://www.lulu.com" },
];

const inIn = (n: number) => `${n.toFixed(3)} in`;
const inMm = (n: number) => `${n.toFixed(1)} mm`;

const PublishingPrep = () => {
  const [trimId, setTrimId] = useState("6x9");
  const [paper, setPaper] = useState("White");
  const [pages, setPages] = useState(40);
  const trim = getTrim(trimId);
  const spec = coverSpec(trim, pages, paper);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-publishing/20 bg-publishing/5 px-4 py-1.5 mb-4">
        <Rocket className="w-4 h-4 text-publishing" />
        <span className="text-sm text-publishing font-medium font-sans">Publish & Distribute</span>
      </div>
      <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Get <span className="text-gradient-gold italic">store-ready</span></h1>
      <p className="mt-2 text-muted-foreground font-sans">Export your book where each store needs it, and size your print cover correctly.</p>

      <div className="mt-6"><ExportCenter /></div>

      <Card className="mt-6 border-border">
        <CardHeader><CardTitle className="font-serif text-lg">Where it goes</CardTitle><CardDescription className="font-sans">Every book exports to EPUB (in the reader) and to a print PDF at your trim size.</CardDescription></CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {TARGETS.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-4 py-2 text-sm font-sans">
                <div>
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-primary hover:underline">
                    {t.name} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <div className="text-xs text-muted-foreground">{t.format}</div>
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground font-sans">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> EPUB is built in the book reader (Kobo, Apple, Google, Draft2Digital take it directly).</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Print PDF exports at the trim size you pick in the reader (proof / POD).</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border">
        <CardHeader><CardTitle className="font-serif text-lg">Cover &amp; spine calculator</CardTitle><CardDescription className="font-sans">For a paperback wrap cover (back + spine + front, with bleed).</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Trim size</Label>
              <select value={trimId} onChange={(e) => setTrimId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                {TRIM_SIZES.filter((t) => t.id !== "a4").map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Paper</Label>
              <select value={paper} onChange={(e) => setPaper(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
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
  );
};

export default PublishingPrep;
