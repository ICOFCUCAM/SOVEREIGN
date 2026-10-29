import { useState } from "react";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BOOK_FACES, BODY_FACES, HEADING_FACES, type BookFaceId } from "@/lib/typeset/font-files";
import { getInteriorType, setInteriorType, withStyle, type InteriorType } from "@/lib/typeset/prefs";
import { INTERIOR_STYLES, styleById, type InteriorStyle } from "@/lib/typeset/styles";
import "@/lib/cover-fonts";

// Preview families (the web versions of the same faces).
const CSS: Record<BookFaceId, string> = {
  ebgaramond: "'EB Garamond', Georgia, serif", cormorant: "'Cormorant Garamond', Georgia, serif", baskerville: "'Libre Baskerville', Georgia, serif",
  crimson: "'Crimson Pro', Georgia, serif", lora: "'Lora', Georgia, serif", notoserif: "Georgia, 'Noto Serif', serif",
  playfair: "'Playfair Display', Georgia, serif", montserrat: "'Montserrat', system-ui, sans-serif",
};
const NOTES: Partial<Record<BookFaceId, string>> = { notoserif: "Widest language coverage", montserrat: "Modern sans headings", playfair: "Elegant display headings" };

// A miniature chapter-opening page, drawn in the style's own type, so the styles can be compared at a glance.
function StyleThumb({ s }: { s: InteriorStyle }) {
  const center = s.titleAlign === "center";
  const lines = s.id === "large" ? 6 : 9;
  return (
    <div className="flex aspect-[2/3] flex-col overflow-hidden rounded-[3px] border border-border bg-white px-2.5 text-[#1b1b1b] shadow-sm" style={{ paddingTop: `${8 + s.sink * 46}%` }}>
      {s.chapterLabel === "word" && <div className={`text-[5px] tracking-[0.25em] text-[#777] ${center ? "text-center" : ""}`} style={{ fontFamily: CSS[s.faces.body] }}>CHAPTER ONE</div>}
      {s.chapterLabel === "numeral" && <div className="text-[15px] font-bold leading-none text-[#ccc]" style={{ fontFamily: CSS[s.faces.heading] }}>01</div>}
      <div className={`mt-0.5 text-[9px] leading-tight ${center ? "text-center" : ""} ${s.titleStyle === "bold" ? "font-bold" : ""} ${s.titleStyle === "italic" ? "italic" : ""}`} style={{ fontFamily: CSS[s.faces.heading] }}>{s.numberedHeadings ? "1 " : ""}The First Step</div>
      {s.ornament === "diamond" && <div className="mx-auto my-1 flex items-center gap-0.5"><span className="h-px w-3 bg-[#777]" /><span className="h-1 w-1 rotate-45 bg-[#777]" /><span className="h-px w-3 bg-[#777]" /></div>}
      {s.ornament === "rule" && <div className={`my-1 h-px w-5 bg-[#555] ${center ? "mx-auto" : ""}`} />}
      {s.ornament === "none" && <div className="h-1.5" />}
      <div className="flex min-w-0 gap-0.5 overflow-hidden">
        {s.dropCap > 0 && <span className="text-[13px] leading-[0.8]" style={{ fontFamily: CSS[s.faces.body] }}>E</span>}
        <div className="min-w-0 flex-1 space-y-[2.5px] overflow-hidden pt-px">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="h-[1.5px] rounded bg-[#9a9a9a]" style={{ width: !s.justify ? `${70 + ((i * 37) % 30)}%` : i === lines - 1 ? "55%" : "100%", marginLeft: s.paragraphs === "indent" && i === 4 ? "12%" : 0, marginTop: s.paragraphs === "block" && i === 4 ? 3 : 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The interior design controls (style, typefaces, size, line spacing, margins); shown in a pop-up or, large, in the Studio's panel. */
export function InteriorTypeEditor({ onChange, large }: { onChange?: (t: InteriorType) => void; large?: boolean }) {
  const [t, setT] = useState<InteriorType>(() => getInteriorType());
  const save = (n: InteriorType) => { setT(n); setInteriorType(n); onChange?.(n); };
  const update = (x: Partial<InteriorType>) => save({ ...t, ...x });
  const pick = (label: string, list: BookFaceId[], value: BookFaceId, on: (v: BookFaceId) => void, sample: string) => (
    <div className="space-y-1.5">
      <Label className="font-sans text-xs">{label}</Label>
      <div className="grid gap-1">
        {list.map((id) => (
          <button key={id} type="button" onClick={() => on(id)} aria-pressed={value === id}
            className={`flex items-baseline justify-between gap-3 rounded-lg border px-2.5 py-1.5 text-left ${value === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
            <span className={large ? "text-[17px]" : "text-[15px]"} style={{ fontFamily: CSS[id] }}>{sample}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground">{BOOK_FACES[id].label}{NOTES[id] ? ` · ${NOTES[id]}` : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="font-sans text-xs">Interior style</Label>
          <div className="grid grid-cols-3 gap-2">
            {INTERIOR_STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => save({ ...withStyle(s.id), ...(t.margins ? { margins: t.margins } : {}), ...(t.arabicFrom ? { arabicFrom: t.arabicFrom } : {}), ...(t.tocDepth ? { tocDepth: t.tocDepth } : {}) })} aria-pressed={t.style === s.id} data-style={s.id}
                className={`rounded-xl border p-1.5 text-left transition ${t.style === s.id ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/40"}`}>
                <StyleThumb s={s} />
                <span className="mt-1 block text-xs font-semibold">{s.label}</span>
                <span className="block text-[10px] leading-tight text-muted-foreground">{s.line}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Used by the print and IngramSpark interiors. Fonts are embedded in the PDF. Arabic, Hebrew, Amharic, Hindi, Bengali, Tamil, Armenian, Georgian, Chinese, Japanese and Korean text is set automatically in a matching Noto face, right to left where needed.</p>
        {pick("Body text", BODY_FACES, t.body, (v) => update({ body: v }), "The road was long")}
        {pick("Headings", HEADING_FACES, t.heading, (v) => update({ heading: v }), "Chapter One")}
        <div className="flex items-center gap-2">
          <Label className="font-sans text-xs">Size</Label>
          {[10, 10.5, 11, 11.5, 12, 14].map((s) => (
            <button key={s} type="button" onClick={() => update({ size: s })} className={`rounded-full border px-2 py-0.5 text-xs ${t.size === s ? "border-primary bg-primary/10" : "border-border"}`}>{s} pt</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="font-sans text-xs">Line spacing</Label>
          {([[undefined, "Style's own"], [1.3, "Tight"], [1.45, "Normal"], [1.6, "Relaxed"], [1.8, "Open"], [2, "Double"]] as const).map(([v, label]) => (
            <button key={label} type="button" onClick={() => update({ leading: v })} aria-pressed={t.leading === v} className={`rounded-full border px-2 py-0.5 text-xs ${t.leading === v ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="font-sans text-xs">Margins</Label>
          {([["narrow", "Narrow"], ["normal", "Normal"], ["wide", "Wide"]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => update({ margins: v })} aria-pressed={(t.margins ?? "normal") === v} className={`rounded-full border px-2 py-0.5 text-xs ${(t.margins ?? "normal") === v ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="font-sans text-xs">Page 1 is</Label>
          {([["introduction", "The Introduction"], ["chapter", "Chapter 1"]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => update({ arabicFrom: v })} aria-pressed={(t.arabicFrom ?? "introduction") === v} className={`rounded-full border px-2 py-0.5 text-xs ${(t.arabicFrom ?? "introduction") === v ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
          <span className="text-[11px] text-muted-foreground">Pages before it: i, ii, iii…</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="font-sans text-xs">Contents list</Label>
          {([[1, "Chapters"], [2, "Chapters and sections"]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => update({ tocDepth: v })} aria-pressed={(t.tocDepth ?? 2) === v} className={`rounded-full border px-2 py-0.5 text-xs ${(t.tocDepth ?? 2) === v ? "border-primary bg-primary/10" : "border-border"}`}>{label}</button>
          ))}
        </div>
      </div>
  );
}

/** Interior design for the print PDFs, in a pop-up; remembered and used by every interior export. */
export default function InteriorType({ compact, onChange }: { compact?: boolean; onChange?: (t: InteriorType) => void }) {
  const [t, setT] = useState<InteriorType>(() => getInteriorType());
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="heroOutline" size="sm" className={compact ? "h-8 text-xs" : ""} title="Interior style and typefaces for the print PDFs">
          <Type className="mr-1 h-4 w-4" /> {styleById(t.style).label} · {BOOK_FACES[t.body].label}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" collisionPadding={12} className="max-h-[var(--radix-popover-content-available-height)] w-[min(440px,94vw)] overflow-y-auto">
        <InteriorTypeEditor onChange={(n) => { setT(n); onChange?.(n); }} />
      </PopoverContent>
    </Popover>
  );
}
