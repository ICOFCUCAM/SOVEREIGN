import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InteriorType from "@/components/book/InteriorType";
import { TRIM_SIZES, getTrim } from "@/lib/print-sizes";
import { INTERIOR_CHANGED } from "@/lib/typeset/prefs";
import { GROUP_ORDER, bookFacts, compile, kindDef, type Manuscript, type Section } from "@/lib/manuscript";

// The book as it will print (design spec §5.1 "Book page", §21): the whole manuscript set by the
// same typesetter that makes the print PDF (title page, filled contents, every section in order),
// opened at this section. The format and the page design (style, typefaces, size, line spacing,
// margins) are chosen here, in the same settings Finish and the exports use. Re-set after edits.

const MAX_PAGES = 60;

/** The section's place among the openings the typesetter makes (title page aside). */
export function openingIndex(m: Manuscript, section: Section): number {
  const ordered = [...m.sections].sort((a, b) => GROUP_ORDER[kindDef(a.kind).group] - GROUP_ORDER[kindDef(b.kind).group]).filter((s) => s.kind !== "title-page" && s.kind !== "half-title");
  return ordered.findIndex((s) => s.id === section.id);
}

export default function BookPageView({ m, section, trimId, onTrim, designInPanel, showContents, onEditParagraph }: {
  m: Manuscript; section: Section; trimId?: string;
  /** The book's format (trim size), kept with the book as Finish keeps it. */
  onTrim?: (id: string) => void;
  /** The page design is in the panel beside the page, so the toolbar doesn't repeat it. */
  designInPanel?: boolean;
  /** When the sidebar asks for the contents: show the front pages. */
  showContents?: number;
  /** A paragraph clicked on a page, by its text as set (§21). */
  onEditParagraph?: (setText: string) => void;
}) {
  const [pages, setPages] = useState<{ url: string; n: number }[] | null>(null);
  const [front, setFront] = useState<{ url: string; n: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setting, setSetting] = useState(true);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const placed = useRef<{ list: { page: number; top: number; bottom: number; text: string }[]; H: number }>({ list: [], H: 0 });
  const [info, setInfo] = useState<{ total: number; from: number; to: number; bodyFirst: number; contents: [number, number] | null; folios: string[]; runts: { title: string; folio: string; lines: number }[] } | null>(null);
  const [design, setDesign] = useState(0);
  const [showFront, setShowFront] = useState(Boolean(showContents));
  useEffect(() => { if (showContents) setShowFront(true); }, [showContents]);
  const holder = useRef<HTMLDivElement>(null);
  const docRef = useRef<{ getPage: (n: number) => Promise<unknown> } | null>(null);
  const trim = getTrim(trimId || "6x9");
  const md = useMemo(() => compile(m, { contents: true }), [m]);
  const at = openingIndex(m, section);
  // A change of design anywhere (this toolbar, the panel, Finish) sets the pages again.
  useEffect(() => { const on = () => setDesign((d) => d + 1); window.addEventListener(INTERIOR_CHANGED, on); return () => window.removeEventListener(INTERIOR_CHANGED, on); }, []);

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
        const r = await typesetBook(md, { title: m.title || "Untitled book", author: m.author, ...bookFacts(m), trim, layout: "standard", style: pref.style, body: pref.body, heading: pref.heading, size: pref.size, leading: pref.leading, margins: pref.margins, arabicFrom: pref.arabicFrom, tocDepth: pref.tocDepth, numberSections: pref.numberSections });
        if (!live) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const doc = await pdfjs.getDocument({ data: r.bytes.slice() }).promise;
        docRef.current = doc as never;
        // This section's pages: from its opening to the page before the next one (the title page for a title page).
        const from = at < 0 ? 1 : r.sections[at]?.page ?? r.bodyFirst;
        const to = at < 0 ? Math.max(1, r.bodyFirst - 1) : Math.min(((r.sections[at + 1]?.page ?? r.pages + 1) - 1), from + MAX_PAGES - 1);
        const out = await render(doc as never, from, Math.max(from, to));
        if (!live) return;
        placed.current = { list: r.placed, H: r.pageHeight };
        setPdf(r.bytes); setPages(out); setInfo({ total: r.pages, from, to: Math.max(from, to), bodyFirst: r.bodyFirst, contents: r.contents, folios: r.folios, runts: r.runts }); setFront(null); setError(null);
      } catch (e) { if (live) setError(e instanceof Error ? e.message : "The pages couldn't be set."); }
      finally { if (live) setSetting(false); }
    }, 900);
    return () => { live = false; window.clearTimeout(t); };
  }, [md, m.title, m.author, m.subtitle, m.meta, trim, at, design]); // eslint-disable-line react-hooks/exhaustive-deps

  // The title page and contents, on request (they are the same for every section).
  useEffect(() => {
    if (!showFront || front || !info || !docRef.current || info.from <= 1) return;
    let live = true;
    // The pages before the first section (half-title, title, copyright) and the contents, wherever they stand.
    const doc = docRef.current;
    void (async () => {
      const head = info.bodyFirst > 1 ? await render(doc, 1, info.bodyFirst - 1) : [];
      const toc = info.contents && info.contents[0] >= info.bodyFirst ? await render(doc, info.contents[0], info.contents[1]) : [];
      if (live) setFront([...head, ...toc]);
    })();
    return () => { live = false; };
  }, [showFront, front, info]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { holder.current?.scrollIntoView?.({ block: "start" }); }, [pages]);

  // Pages carry the numbers printed on them (as the contents lists them); the front pages are named.
  // Preliminary pages carry Roman numerals (i, ii…), the main text Arabic, as printed.
  const folio = (n: number) => info?.folios[n - 1] || String(n);
  const label = (n: number) => (info?.contents && n >= info.contents[0] && n <= info.contents[1] ? "Contents" : !info || n >= info.bodyFirst ? `Page ${folio(n)}` : "Front page");
  const sheet = (p: { url: string; n: number }) => (
    <figure key={p.n} className="mx-auto" style={{ maxWidth: `${Math.round((trim.wmm / trim.hmm) * 860)}px` }}>
      <img src={p.url} alt={label(p.n)} title={onEditParagraph ? "Click a paragraph to correct it" : undefined}
        onClick={onEditParagraph ? (e) => {
          // Where on the page: PDF points from the bottom, then the paragraph set there.
          const r = e.currentTarget.getBoundingClientRect();
          const y = placed.current.H * (1 - (e.clientY - r.top) / r.height);
          const hit = placed.current.list.find((x) => x.page === p.n && y <= x.top + 2 && y >= x.bottom - 2);
          if (hit) onEditParagraph(hit.text);
        } : undefined}
        className={`w-full rounded-[2px] bg-white shadow-[0_1px_2px_rgba(15,23,42,.08),0_24px_48px_-28px_rgba(15,23,42,.35)] ${onEditParagraph ? "cursor-text" : ""}`} />
      <figcaption className="mt-2 text-center text-[11px] text-[#64748B]">{label(p.n)}</figcaption>
    </figure>
  );

  return (
    <div ref={holder} className="mx-auto w-full max-w-[720px] scroll-mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        {!designInPanel && <>
          <label className="flex items-center gap-1.5 text-[#475569] dark:text-[#CBD5E1]">Format
            <select aria-label="Book format" value={trim.id} onChange={(e) => onTrim?.(e.target.value)} disabled={!onTrim} className="h-8 max-w-[260px] rounded-md border border-input bg-background px-2 text-[12.5px]">
              {TRIM_SIZES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>
          <InteriorType compact />
        </>}
        {pdf && <Button size="sm" variant="ghost" className="ml-auto h-8 text-[12px]" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" })); a.download = `${(m.title || "book").replace(/_+/g, " ")}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }}><Download className="h-3.5 w-3.5" /> The book as PDF</Button>}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-[#64748B]" aria-live="polite">
        {setting ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> Setting the book…</span>
          : info && <span>The whole book as it will print, {trim.label}: {info.total} pages. {at < 0 ? "Title page and contents." : info.to > info.from ? `This section: pages ${folio(info.from)}–${folio(info.to)}.` : `This section: page ${folio(info.from)}.`}</span>}
        {/* Chapters ending with only a line or two on their last page (§22): worth tightening by a line. */}
        {info && info.runts.length > 0 && <span className="w-full text-[#92400E] dark:text-amber-300">{info.runts.length === 1 ? "A chapter ends" : `${info.runts.length} chapters end`} with only a line or two on the last page: {info.runts.slice(0, 3).map((x) => `“${x.title}” (page ${x.folio}, ${x.lines} ${x.lines === 1 ? "line" : "lines"})`).join("; ")}{info.runts.length > 3 ? "…" : ""}. Shorten the chapter by a few words, or choose a slightly tighter line spacing in Page design.</span>}
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
