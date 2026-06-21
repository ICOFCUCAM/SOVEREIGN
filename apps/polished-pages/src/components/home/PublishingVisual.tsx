import { Check, FileText } from "lucide-react";
import BookCover from "./BookCover";

// Publishing workflow, shown: a manuscript with structured chapters resolving
// into a finished, export-ready book.
const CHAPTERS = ["The Signal", "Cartographers", "The Long Year", "Tomorrow's Map"];
const EXPORTS = ["EPUB", "Print PDF", "KDP", "IngramSpark"];

const PublishingVisual = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-e3">
    <div className="flex gap-5">
      <div className="w-28 shrink-0">
        <BookCover spec={{ title: "The Atlas of Tomorrow", author: "A. Okonkwo", tag: "Fiction", from: "hsl(262 83% 58%)", to: "hsl(221 83% 40%)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">The Atlas of Tomorrow</div>
        <div className="mt-0.5 text-xs text-muted-foreground font-sans">A. Okonkwo · 14 chapters · 41,200 words</div>
        <div className="mt-3 space-y-1.5">
          {CHAPTERS.map((c) => (
            <div key={c} className="flex items-center gap-2 text-xs text-foreground/80 font-sans">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-educational/15">
                <Check className="h-2.5 w-2.5 text-educational" />
              </span>
              {c}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted">
              <FileText className="h-2.5 w-2.5" />
            </span>
            Chapter 5 · drafting…
          </div>
        </div>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">Export</span>
      {EXPORTS.map((e) => (
        <span key={e} className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground/80 font-sans">{e}</span>
      ))}
    </div>
  </div>
);

export default PublishingVisual;
