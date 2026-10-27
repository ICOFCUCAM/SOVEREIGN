import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getTrim } from "@/lib/print-sizes";

// The chapter as it will print (design spec §5.1 "Book page"): set by the same
// typesetter that makes the print PDF, with the owner's interior style and
// typefaces, shown in the browser's PDF viewer. Re-set a moment after edits.
export default function BookPageView({ bookTitle, author, chapterTitle, text, trimId }: { bookTitle: string; author?: string; chapterTitle: string; text: string; trimId?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setting, setSetting] = useState(true);
  const last = useRef<string | null>(null);

  useEffect(() => {
    let live = true;
    setSetting(true);
    const t = window.setTimeout(async () => {
      try {
        const [{ typesetBook }, { getInteriorType }] = await Promise.all([import("@/lib/typeset/book"), import("@/lib/typeset/prefs")]);
        const pref = getInteriorType();
        const md = `# ${bookTitle || "Untitled book"}\n\n## ${chapterTitle || "Chapter"}\n\n${text.trim() || "(This chapter is empty.)"}`;
        const { bytes } = await typesetBook(md, { title: bookTitle || "Untitled book", author, trim: getTrim(trimId || "6x9"), layout: "standard", style: pref.style, body: pref.body, heading: pref.heading, size: pref.size });
        if (!live) return;
        const next = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        if (last.current) URL.revokeObjectURL(last.current);
        last.current = next; setUrl(next); setError(null);
      } catch (e) { if (live) setError(e instanceof Error ? e.message : "The page couldn't be set."); }
      finally { if (live) setSetting(false); }
    }, 700);
    return () => { live = false; window.clearTimeout(t); };
  }, [bookTitle, author, chapterTitle, text, trimId]);
  useEffect(() => () => { if (last.current) URL.revokeObjectURL(last.current); }, []);

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div className="mb-3 flex items-center gap-2 text-[12px] text-muted-foreground" aria-live="polite">
        {setting ? <><Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> Setting the page…</> : <>Set with your interior style · {getTrim(trimId || "6x9").label}. The chapter follows the title and contents pages.</>}
      </div>
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-amber-600" /> {error}</div>
      ) : url ? (
        <iframe title={`${chapterTitle} as a printed page`} src={url} className="h-[78vh] w-full rounded-[10px] border border-[#E6E8ED] bg-white dark:border-white/10" />
      ) : (
        <div className="h-[78vh] w-full animate-pulse rounded-[10px] bg-muted motion-reduce:animate-none" />
      )}
    </div>
  );
}
