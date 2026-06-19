import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, inputCls } from "../../lib/ui";
import { generateBookOutline, generateBookChapter, type BookOutline } from "../../lib/polished-pages";
import ResultPanel from "./ResultPanel";

const DEPTHS = [
  { value: "short", label: "Short (1.5–2k words/chapter)" },
  { value: "standard", label: "Standard (2.5–3.5k words)" },
  { value: "detailed", label: "Detailed (3.5–5k words)" },
];

const Book: React.FC = () => {
  const [bookTitle, setBookTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [depth, setDepth] = useState("standard");
  const [outline, setOutline] = useState<BookOutline | null>(null);
  const [chapterText, setChapterText] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyChapter, setBusyChapter] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [assembled, setAssembled] = useState<string | null>(null);

  const onOutline = async (): Promise<void> => {
    setErr(null); setBusy(true); setOutline(null); setChapterText({}); setAssembled(null);
    try {
      const r = await generateBookOutline({ bookTitle, genre, targetAudience, depth, mode: "guided" });
      setOutline(r.outline);
    } catch (e) { setErr(e instanceof Error ? e.message : "Outline failed"); }
    finally { setBusy(false); }
  };

  const onChapter = async (index: number): Promise<void> => {
    if (!outline) return;
    setErr(null); setBusyChapter(index);
    try {
      // Pass already-written chapters so the engine avoids repeating itself.
      const previousChapters = outline.chapters.map((_, i) => chapterText[i]).filter(Boolean) as string[];
      const r = await generateBookChapter({
        bookTitle: outline.title || bookTitle, genre, targetAudience,
        chapters: outline.chapters, chapterIndex: index, depth, previousChapters,
      });
      setChapterText((p) => ({ ...p, [index]: r.chapter }));
      setAssembled(null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Chapter failed"); }
    finally { setBusyChapter(null); }
  };

  const onGenerateAll = async (): Promise<void> => {
    if (!outline) return;
    for (let i = 0; i < outline.chapters.length; i++) {
      if (!chapterText[i]) await onChapter(i);
    }
  };

  const assemble = (): void => {
    if (!outline) return;
    const parts: string[] = [`# ${outline.title || bookTitle}`];
    if (outline.subtitle) parts.push(`### ${outline.subtitle}`);
    if (outline.description) parts.push(outline.description);
    outline.chapters.forEach((ch, i) => {
      parts.push(chapterText[i] || `## ${ch.title}\n\n_(not yet generated)_`);
    });
    setAssembled(parts.join("\n\n---\n\n"));
  };

  const writtenCount = outline ? outline.chapters.filter((_, i) => chapterText[i]).length : 0;

  return (
    <div>
      <header className="mb-6">
        <Link to="/console/polished" className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70">← Polished Pages</Link>
        <h1 className="mt-1 text-2xl font-bold text-white">Book</h1>
        <p className="text-sm text-white/50">Generate an outline, then write it chapter by chapter, then assemble.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <Card className="mb-6 space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Book title / idea"><input className={inputCls} value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="The Calm Founder" /></Field>
          <Field label="Genre"><input className={inputCls} value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Business / self-help" /></Field>
          <Field label="Target audience"><input className={inputCls} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="First-time startup founders" /></Field>
          <Field label="Depth"><select className={inputCls} value={depth} onChange={(e) => setDepth(e.target.value)}>{DEPTHS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></Field>
        </div>
        <Button onClick={onOutline} disabled={!bookTitle.trim() || busy}>{busy ? "Generating outline…" : outline ? "Regenerate outline" : "Generate outline →"}</Button>
      </Card>

      {outline && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{outline.title}</h2>
              {outline.subtitle && <p className="text-sm text-white/50">{outline.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white/40">{writtenCount}/{outline.chapters.length} written</span>
              <Button variant="ghost" onClick={onGenerateAll} disabled={busyChapter !== null}>Generate all</Button>
              <Button onClick={assemble} disabled={writtenCount === 0}>Assemble book</Button>
            </div>
          </div>
          {outline.description && <p className="text-[13px] leading-relaxed text-white/60">{outline.description}</p>}

          <div className="space-y-2">
            {outline.chapters.map((ch, i) => (
              <div key={i} className="rounded-md border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{i + 1}. {ch.title}</div>
                    {ch.summary && <div className="mt-0.5 text-[12px] leading-snug text-white/45">{ch.summary}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {chapterText[i] && <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">✓ written</span>}
                    <Button variant="ghost" onClick={() => onChapter(i)} disabled={busyChapter !== null}>
                      {busyChapter === i ? "Writing…" : chapterText[i] ? "Rewrite" : "Write"}
                    </Button>
                  </div>
                </div>
                {chapterText[i] && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70">View chapter</summary>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-ink-900/70 p-3 font-sans text-[13px] leading-relaxed text-white/80">{chapterText[i]}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {assembled && <div className="mt-6"><ResultPanel title="Assembled book" content={assembled} filename={`${(outline?.title || bookTitle || "book").replace(/[^\w]+/g, "-").toLowerCase()}.md`} /></div>}
    </div>
  );
};

export default Book;
