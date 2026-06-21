import { Check, GraduationCap, Globe } from "lucide-react";

// Education workflow, shown: a structured, standards-aligned curriculum with
// units, a worksheet, and ready-to-teach output — not a single document.
const UNITS = [
  { t: "Unit 1 · Number & Place Value", done: true },
  { t: "Unit 2 · Addition & Subtraction", done: true },
  { t: "Unit 3 · Fractions", done: true },
  { t: "Unit 4 · Measurement", done: false },
];

const CurriculumVisual = () => (
  <div className="grid grid-cols-[1.4fr_1fr] gap-3">
    {/* Curriculum outline */}
    <div className="rounded-2xl border border-border bg-card p-4 shadow-e3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-educational/15">
          <GraduationCap className="h-4 w-4 text-educational" />
        </span>
        <div>
          <div className="text-sm font-semibold text-foreground">Grade 4 · Mathematics</div>
          <div className="text-[11px] text-muted-foreground font-sans">Full-year scheme of work</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {UNITS.map((u) => (
          <div key={u.t} className="flex items-center gap-2 text-xs font-sans">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${u.done ? "bg-educational/15" : "border border-border"}`}>
              {u.done && <Check className="h-2.5 w-2.5 text-educational" />}
            </span>
            <span className={u.done ? "text-foreground/80" : "text-muted-foreground"}>{u.t}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-educational/10 px-2 py-0.5 text-[10px] font-semibold text-educational font-sans">
          <Globe className="h-2.5 w-2.5" /> Any language
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70 font-sans">Lesson plans</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70 font-sans">Exams</span>
      </div>
    </div>

    {/* Worksheet preview */}
    <div className="rounded-2xl border border-border bg-card p-3 shadow-e3">
      <div className="rounded-lg bg-gradient-to-b from-muted/60 to-background p-3">
        <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground font-sans">Worksheet 3.2</div>
        <div className="mt-1 text-[11px] font-semibold text-foreground">Equivalent Fractions</div>
        <div className="mt-3 space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-muted-foreground">{i + 1}.</span>
              <span className="h-1.5 flex-1 rounded-full bg-foreground/10" />
              <span className="h-3 w-3 rounded border border-border" />
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-educational/10" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CurriculumVisual;
