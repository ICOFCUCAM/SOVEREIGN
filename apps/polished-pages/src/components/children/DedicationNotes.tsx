import { useState } from "react";
import { Heart, Copy, Check, NotebookPen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type DedType = "parent" | "teacher" | "gift";

// Dedication & author-notes helper for a finished storybook. Produces real,
// editable front/back matter from the story's context — a dedication (parent,
// teacher or gift edition) and author notes (objective + parent and teacher
// guidance) — ready to copy into the book or a printed edition.
const DedicationNotes = ({ title, childName, theme, objective }: { title: string; childName?: string; theme?: string; objective?: string }) => {
  const [type, setType] = useState<DedType>("parent");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(childName ?? "");
  const [copied, setCopied] = useState<string | null>(null);

  const who = to.trim() || "you";
  const signed = from.trim() ? `\n\nWith love,\n${from.trim()}` : "";
  const dedication = type === "parent"
    ? `For ${who} — may you always chase what makes you wonder.${signed}`
    : type === "teacher"
      ? `To my class — may this story spark your curiosity and your kindness.${signed}`
      : `A special gift for ${who}, with a story made just for you.${signed}`;

  const obj = objective?.trim() || (theme ? `exploring ${theme}` : "curiosity, kindness and imagination");
  const notes = `About this book

“${title}” was created to nurture ${obj}.

For parents and carers
• Read it together and pause to ask “what do you think happens next?”
• Point to the pictures and let your child describe what they see.
• Link the story to your child’s own day — a small moment of bravery or kindness.

For teachers
• Discussion: What was the main character feeling, and why? How did they change?
• Activity: Have learners draw their favourite scene and label it.
• Extension: Ask the class to invent the next adventure in the story.`;

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Card className="mt-6 border-border text-left">
      <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Heart className="h-4 w-4 text-gold" /> Dedication &amp; author notes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {(["parent", "teacher", "gift"] as DedType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1 text-xs font-sans capitalize transition ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
              {t === "gift" ? "Gift edition" : `${t} dedication`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs font-sans">{type === "teacher" ? "Class / school (optional)" : "To (name)"}</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={type === "teacher" ? "e.g. Room 3B" : "e.g. James"} maxLength={60} /></div>
          <div className="space-y-1.5"><Label className="text-xs font-sans">From (optional)</Label><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Grandma" maxLength={60} /></div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="text-xs font-sans">Dedication</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => copy("ded", dedication)}>{copied === "ded" ? <Check className="mr-1 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />} Copy</Button>
          </div>
          <Textarea readOnly value={dedication} rows={3} className="resize-none text-sm" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="flex items-center gap-1 text-xs font-sans"><NotebookPen className="h-3.5 w-3.5" /> Author notes</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => copy("notes", notes)}>{copied === "notes" ? <Check className="mr-1 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />} Copy</Button>
          </div>
          <Textarea readOnly value={notes} rows={10} className="resize-none text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default DedicationNotes;
