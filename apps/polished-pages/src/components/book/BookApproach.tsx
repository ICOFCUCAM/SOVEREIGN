import { BookCopy, BookOpenCheck, FlaskConical, Library, Sparkles } from "lucide-react";
import type { BookApproach } from "@/lib/book-engine";

// How the Book wizard writes each chapter when it runs on the owner's Claude
// Code: from their own uploaded book, with or without outside research, or new
// from the outline.
export const APPROACHES: { id: BookApproach; label: string; line: string; icon: typeof Sparkles }[] = [
  { id: "polish", label: "Polish my book", line: "Your own words, put in order and cleaned up. Nothing added.", icon: BookOpenCheck },
  { id: "mine", label: "From my book only", line: "All of your teaching, rewritten in better prose. Nothing from outside.", icon: BookCopy },
  { id: "mine-and-research", label: "My book + other sources", line: "Your book first, strengthened with scholars and sources, all cited.", icon: Library },
  { id: "research", label: "Research-led", line: "Written mainly from research, arguing your book's position. Cited.", icon: FlaskConical },
  { id: "new", label: "New from the outline", line: "A fresh book from the outline, your notes and rules.", icon: Sparkles },
];
export const usesBook = (a: BookApproach) => a !== "new";

export default function BookApproachPicker({ value, onChange, disabled }: { value: BookApproach; onChange: (a: BookApproach) => void; disabled?: boolean }) {
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-4" disabled={disabled}>
      <legend className="px-1 text-sm font-semibold">How Claude writes each chapter</legend>
      <div role="radiogroup" aria-label="How Claude writes each chapter" className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {APPROACHES.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={value === a.id} onClick={() => onChange(a.id)}
            className={`rounded-xl border p-3 text-left transition ${value === a.id ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}>
            <span className="flex items-center gap-1.5 text-sm font-medium"><a.icon className="h-4 w-4 text-primary" /> {a.label}</span>
            <span className="mt-1 block text-xs leading-snug text-muted-foreground">{a.line}</span>
          </button>
        ))}
      </div>
      {usesBook(value) && <p className="mt-2 text-[11px] text-muted-foreground">Claude reads the documents uploaded to this project, follows your chapter notes and Knowledge rules, and leaves a note with each chapter on what it used.</p>}
    </fieldset>
  );
}
