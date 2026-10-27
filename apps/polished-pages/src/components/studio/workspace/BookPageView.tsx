import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrim } from "@/lib/print-sizes";

// The chapter as it will print (design spec §5.1 "Book page"): set by the same
// typesetter that makes the print PDF (the owner's interior style and
// typefaces), then drawn page by page as paper sheets, opening at the chapter.
// Re-set a moment after edits.

const MAX_PAGES = 60;

export default function BookPageView({ bookTitle, author, chapterTitle, text, trimId, chapterNumber, plain }: {
  bookTitle: string; author?: string; chapterTitle: string; text: string; trimId?: string;
  /** The chapter's number in the book; front and back matter (plain) carry none. */
  chapterNumber?: number; plain?: boolean;
}) {
  const [pages, setPages] = useState<{ url: string; n: number }[] | null>(null);
  const [first, setFirst] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [setting, setSetting] = useState(true);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const trim = getTrim(trimId || "6x9");

  useEffect(() => {
    let live = true;
    setSetting(true);
    const t = window.setTimeout(async () => {
      try {
        const [{ typesetBook }, { getInteriorType }, pdfjs, worker] = await Promise.all([
          import("@/lib/typeset/book"), import("@/lib/typeset/prefs"), import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        const pref = getInteriorType();
        const md = `# ${chapterTitle || "Chapter"}${plain ? " {-}" : ""}\n\n${text.trim() || "(This chapter is empty.)"}`;
        const { bytes } = await typesetBook(md, { title: bookTitle || "Untitled book", author, trim, layout: "standard", style: pref.style, body: pref.body, heading: pref.heading, size: pref.size, chapterStart: chapterNumber });
        if (!live) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        const out: { url: string; n: number }[] = [];
        let start = 0;
        for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
          const page = await doc.getPage(n);
          // The chapter opens on the first page after the contents that carries its title.
          if (!start && n > 1) {
            const words = (await page.getTextContent()).items.map((i) => ("str" in i ? i.str : "")).join(" ");
            if (!/contents/i.test(words) && words.includes((chapterTitle || "").split(" ").slice(0, 3).join(" "))) start = n - 1;
          }
          const view = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = view.width; canvas.height = view.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: view }).promise;
          out.push({ url: canvas.toDataURL("image/png"), n });
          if (!live) return;
        }
        setPdf(bytes); setPages(out); setFirst(start); setError(null);
      } catch (e) { if (live) setError(e instanceof Error ? e.message : "The page couldn't be set."); }
      finally { if (live) setSetting(false); }
    }, 700);
    return () => { live = false; window.clearTimeout(t); };
  }, [bookTitle, author, chapterTitle, text, trim, chapterNumber, plain]);

  // Open at the chapter's first page.
  useEffect(() => { if (pages) holder.current?.querySelector(`[data-page="${first}"]`)?.scrollIntoView({ block: "start" }); }, [pages, first]);

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-[#64748B]" aria-live="polite">
        {setting ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> Setting the pages…</span>
          : <span>Set as it will print: your interior style, {trim.label}. {pages ? `${pages.length} pages including the title and contents pages.` : ""}</span>}
        {pdf && <Button size="sm" variant="ghost" className="ml-auto h-7 text-[12px]" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" })); a.download = `${chapterTitle || "chapter"}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }}><Download className="h-3.5 w-3.5" /> This chapter as PDF</Button>}
      </div>
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-amber-600" /> {error}</div>
      ) : pages ? (
        <div ref={holder} className="space-y-8">
          {pages.map((p, i) => (
            <figure key={p.n} data-page={i} className="mx-auto" style={{ maxWidth: `${Math.round((trim.wmm / trim.hmm) * 860)}px` }}>
              <img src={p.url} alt={`Page ${p.n}`} className="w-full rounded-[2px] bg-white shadow-[0_1px_2px_rgba(15,23,42,.08),0_24px_48px_-28px_rgba(15,23,42,.35)]" />
              <figcaption className="mt-2 text-center text-[11px] text-[#64748B]">Page {p.n}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mx-auto aspect-[2/3] w-full max-w-[560px] animate-pulse rounded-[2px] bg-white/70 motion-reduce:animate-none dark:bg-white/5" />
      )}
    </div>
  );
}
