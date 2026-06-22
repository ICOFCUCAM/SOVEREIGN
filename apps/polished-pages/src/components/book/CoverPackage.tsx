import { useState } from "react";
import { Layers, Loader2, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { composeCoverPackage, type ComposedAsset } from "@/lib/cover-package";
import { composeFullWrapPdf } from "@/lib/export-cover-wrap";

const download = (src: string, name: string) => { const a = document.createElement("a"); a.href = src; a.download = name; a.click(); };

// The Cover Package: from one front cover + the book's metadata, Polished Pages
// composes the production and marketing derivatives (spine, marketplace
// thumbnail, audiobook cover, social square, marketing banner) and a print-ready
// full-wrap PDF (back + spine + front). Pure publishing layer — no image generation.
const CoverPackage = ({ frontSrc, backSrc, title, author, subtitle, pageCount, paper, trimSize }: {
  frontSrc: string;
  backSrc?: string | null;
  title: string;
  author?: string;
  subtitle?: string;
  pageCount?: string;
  paper?: string;
  trimSize?: string;
}) => {
  const [assets, setAssets] = useState<ComposedAsset[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [wrapBusy, setWrapBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pages = Number(pageCount) || 0;

  const build = async () => {
    setBusy(true); setErr(null);
    try {
      setAssets(await composeCoverPackage({ frontSrc, title, author, subtitle, pages, paper, trimId: trimSize }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not compose the package.");
    } finally { setBusy(false); }
  };

  const buildWrap = async () => {
    setWrapBusy(true); setErr(null);
    try {
      await composeFullWrapPdf({ frontSrc, backSrc, title, author, pages, trimId: trimSize || "6x9", paper: paper || "Cream", filename: `${title || "book"}-full-wrap` });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not build the full-wrap PDF.");
    } finally { setWrapBusy(false); }
  };

  return (
    <div className="mt-8 border-t border-border/60 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold"><Layers className="h-5 w-5 text-primary" /> Cover package</h3>
          <p className="text-sm text-muted-foreground font-sans">One front cover becomes a spine, marketplace thumbnail, audiobook cover, and social assets — composed here, ready to download.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="hero" size="sm" disabled={busy} onClick={build}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Layers className="mr-1.5 h-4 w-4" />} {assets ? "Rebuild package" : "Build cover package"}
          </Button>
          <Button variant="heroOutline" size="sm" disabled={wrapBusy || pages === 0} onClick={buildWrap} title={pages === 0 ? "Set a page count under Production first" : "Print-ready back + spine + front PDF"}>
            {wrapBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} Full-wrap PDF
          </Button>
          {assets && assets.length > 0 && (
            <Button variant="heroOutline" size="sm" onClick={() => assets.forEach((a) => download(a.src, a.filename))}><Download className="mr-1.5 h-4 w-4" /> Download all</Button>
          )}
        </div>
      </div>

      {pages === 0 && (
        <p className="mt-3 text-xs text-gold font-sans">Add a page count under <span className="font-medium">Production</span> to include a print spine sized to your book.</p>
      )}
      {err && <p className="mt-3 text-sm text-destructive font-sans">{err}</p>}

      {assets && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((a) => (
            <Card key={a.key} className="overflow-hidden border-border">
              <div className="flex items-center justify-center bg-secondary/40 p-3" style={{ minHeight: 120 }}>
                <img src={a.src} alt={a.label} className="max-h-36 max-w-full object-contain shadow-sm" style={{ aspectRatio: `${a.w} / ${a.h}` }} />
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium font-sans">{a.label}</div>
                    {a.note && <div className="text-[11px] text-muted-foreground font-sans">{a.note}</div>}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={() => download(a.src, a.filename)} title="Download PNG"><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoverPackage;
