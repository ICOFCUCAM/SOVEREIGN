import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InteriorType from "@/components/book/InteriorType";
import { TRIM_SIZES, getTrim } from "@/lib/print-sizes";
import { GROUP_ORDER, compile, kindDef, type Manuscript, type Section } from "@/lib/manuscript";

// The book as it will print (design spec §5.1 "Book page", §21): the whole manuscript set by the
// same typesetter that makes the print PDF (title page, filled contents, every section in order),
// opened at this section. The format and the page design (style, typefaces, size, line spacing,
// margins) are chosen here, in the same settings Finish and the exports use. Re-set after edits.

const MAX_PAGES = 60;

/** The section's place among the openings the typesetter makes (title page aside). */
export function openingIndex(m: Manuscript, section: Section): number {
  const ordered = [...m.sections].sort((a, b) => GROUP_ORDER[kindDef(a.kind).group] - GROUP_ORDER[kindDef(b.kind).group]).filter((s) => s.kind !== "title-page");
  return ordered.findIndex((s) => s.id === section.id);
}

export default function BookPageView({ m, section, trimId, onTrim }: {
  m: Manuscript; section: Section; trimId?: string;
  /** The book's format (trim size), kept with the book as Finish keeps it. */
  onTrim?: (id: string) => void;
}) {
  const [pages, setPages] = useState<{ url: string; n: number }[] | null>(null);
  const [front, setFront] = useState<{ url: string; n: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setting, setSetting] = useState(true);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [info, setInfo] = useState<{ total: number; from: number; to: number; bodyFirst: number } | null>(null);
  const [design, setDesign] = useState(0);
  const [showFront, setShowFront] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const docRef = useRef<{ getPage: (n: number) => Promise<unknown> } | null>(null);
  const trim = getTrim(trimId || "6x9");
  const md = useMemo(() => compile(m), [m]);
  const at = openingIndex(m, section);

  const render = async (doc: NonNullable<typeof docRef.current>, from: number, to: number) => {
    const out: { url: string; n: number }[] = [];
    for (let n = from; n <= to; n++) {
      const page = (await doc.getPage(n)) as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: unknown) => { promise: Promise<void> } };
      const view = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = view.width; canvas.height = view.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: view }).promise;
      out.push({ url: canvas.toDataURL("image/png"), n });
    }
    return out;
  };

  useEffect(() => {
    let live = true;
    setSetting(true);
    const t = window.setTimeout(async () => {
      try {
        const [{ typesetBook }, { getInteriorType }, pdfjs, worker] = await Promise.all([
          import("@/lib/typeset/book"), import("@/lib/typeset/prefs"), import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        const pref = getInteriorType();
        const r = await typesetBook(md, { title: m.title || "Untitled book", author: m.author, trim, layout: "standard", style: pref.style, body: pref.body, heading: pref.heading, size: pref.size, leading: pref.leading, margins: pref.margins });
        if (!live) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const doc = await pdfjs.getDocument({ data: r.bytes.slice() }).promise;
        docRef.current = doc as never;
        // This section's pages: from its opening to the page before the next one (the title page for a title page).
        const from = at < 0 ? 1 : r.sections[at]?.page ?? r.bodyFirst;
        const to = at < 0 ? Math.max(1, r.bodyFirst - 1) : Math.min(((r.sections[at + 1]?.page ?? r.pages + 1) - 1), from + MAX_PAGES - 1);
        const out = await render(doc as never, from, Math.max(from, to));
        if (!live) return;
        setPdf(r.bytes); setPages(out); setInfo({ total: r.pages, from, to: Math.max(from, to), bodyFirst: r.bodyFirst }); setFront(null); setError(null);
      } catch (e) { if (live) setError(e instanceof Error ? e.message : "The pages couldn't be set."); }
      finally { if (live) setSetting(false); }
    }, 900);
    return () => { live = false; window.clearTimeout(t); };
  }, [md, m.title, m.author, trim, at, design]); // eslint-disable-line react-hooks/exhaustive-deps

  // The title page and contents, on request (they are the same for every section).
  useEffect(() => {
    if (!showFront || front || !info || !docRef.current || info.from <= 1) return;
    let live = true;
    void render(docRef.current, 1, info.bodyFirst - 1).then((p) => { if (live) setFront(p); });
    return () => { live = false; };
  }, [showFront, front, info]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { holder.current?.scrollIntoView?.({ block: "start" }); }, [pages]);

  // Pages carry the numbers printed on them (as the contents lists them); the front pages are named.
  const label = (n: number) => (!info || n >= info.bodyFirst ? `Page ${info ? n - info.bodyFirst + 1 : n}` : n === 1 ? "Title page" : "Contents");
  const sheet = (p: { url: string; n: number }) => (
    <figure key={p.n} className="mx-auto" style={{ maxWidth: `${Math.round((trim.wmm / trim.hmm) * 860)}px` }}>
      <img src={p.url} alt={label(p.n)} className="w-full rounded-[2px] bg-white shadow-[0_1px_2px_rgba(15,23,42,.08),0_24px_48px_-28px_rgba(15,23,42,.35)]" />
      <figcaption className="mt-2 text-center text-[11px] text-[#64748B]">{label(p.n)}</figcaption>
    </figure>
  );

  return (
    <div ref={holder} className="mx-auto w-full max-w-[720px] scroll-mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        <label className="flex items-center gap-1.5 text-[#475569] dark:text-[#CBD5E1]">Format
          <select aria-label="Book format" value={trim.id} onChange={(e) => onTrim?.(e.target.value)} disabled={!onTrim} className="h-8 max-w-[260px] rounded-md border border-input bg-background px-2 text-[12.5px]">
            {TRIM_SIZES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        <InteriorType compact onChange={() => setDesign((d) => d + 1)} />
        {pdf && <Button size="sm" variant="ghost" className="ml-auto h-8 text-[12px]" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" })); a.download = `${(m.title || "book").replace(/_+/g, " ")}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }}><Download className="h-3.5 w-3.5" /> The book as PDF</Button>}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-[#64748B]" aria-live="polite">
        {setting ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> Setting the book…</span>
          : info && <span>The whole book as it will print, {trim.label}: {info.total} pages. {at < 0 ? "Title page and contents." : info.to > info.from ? `This section: pages ${info.from - info.bodyFirst + 1}–${info.to - info.bodyFirst + 1}.` : `This section: page ${info.from - info.bodyFirst + 1}.`}</span>}
        {info && at >= 0 && info.from > 1 && <button type="button" className="underline" onClick={() => setShowFront((v) => !v)} aria-pressed={showFront}>{showFront ? "Hide the title page and contents" : "Show the title page and contents"}</button>}
      </div>
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-amber-600" /> {error}</div>
      ) : pages ? (
        <div className="space-y-8">
          {showFront && (front ? front.map(sheet) : <p className="text-center text-[12px] text-[#64748B]"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Drawing the front pages…</p>)}
          {pages.map(sheet)}
        </div>
      ) : (
        <div className="mx-auto aspect-[2/3] w-full max-w-[560px] animate-pulse rounded-[2px] bg-white/70 motion-reduce:animate-none dark:bg-white/5" />
      )}
    </div>
  );
}
