import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ClipboardCheck, Globe, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listDocuments, type DocSummary } from "@/lib/documents";

// Publishing metadata captured on a book project. Stored with the book draft and
// fed into the cover (ISBN/publisher) and — later — the spine and print package.
export interface BookMeta {
  author?: string;
  subtitle?: string;
  isbn?: string;
  publisher?: string;
  imprint?: string;
  trimSize?: string;
  pageCount?: string;
}

export const TRIM_SIZES = ["5 × 8 in", "5.25 × 8 in", "5.5 × 8.5 in", "6 × 9 in", "7 × 10 in", "8.5 × 11 in"];

// Approx spine width for white/cream paper (inches) — pages × per-page thickness.
// Shown as guidance; the print package will use it to size the full wrap.
const spineInches = (pages: number) => (pages > 0 ? (pages * 0.0025).toFixed(3) : null);

// The Book Production Center: a project-centric readiness view + the publishing
// metadata that turns a manuscript into a distributable book.
const ProductionPanel = ({
  meta, setMeta, bookTitle, manuscriptComplete, coverDone, parentId,
}: {
  meta: BookMeta;
  setMeta: (m: BookMeta) => void;
  bookTitle: string;
  manuscriptComplete: boolean;
  coverDone: boolean;
  parentId: string | null;
}) => {
  const [children, setChildren] = useState<DocSummary[] | null>(null);

  // The project's saved assets (language editions + audiobook) link back via
  // parent_document_id, so we can score readiness across the whole project.
  useEffect(() => {
    if (!parentId) { setChildren([]); return; }
    listDocuments().then((all) => setChildren(all.filter((d) => d.parent_document_id === parentId))).catch(() => setChildren([]));
  }, [parentId]);

  const editions = (children ?? []).filter((c) => c.edition_language).length;
  const hasAudiobook = (children ?? []).some((c) => c.kind === "audiobook");
  const pages = Number(meta.pageCount) || 0;

  const set = (k: keyof BookMeta) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMeta({ ...meta, [k]: e.target.value });

  const items: { label: string; ok: boolean; hint?: string }[] = [
    { label: "Manuscript written", ok: manuscriptComplete },
    { label: "Title & author", ok: !!bookTitle.trim() && !!meta.author?.trim() },
    { label: "Cover designed", ok: coverDone },
    { label: "ISBN assigned", ok: !!meta.isbn?.trim(), hint: "Enables the print barcode" },
    { label: "Publisher set", ok: !!meta.publisher?.trim() },
    { label: "Print specs (trim + page count)", ok: !!meta.trimSize && pages > 0, hint: "Needed for the spine & print wrap" },
    { label: "Localized edition", ok: editions > 0 },
    { label: "Audiobook produced", ok: hasAudiobook },
  ];
  const done = items.filter((i) => i.ok).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="space-y-6">
      {/* Production readiness */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-bold">Production readiness</h3>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-bold tabular-nums">{pct}%</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-sans">{done}/{items.length} ready</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.label} className="flex items-start gap-2 text-sm font-sans">
                {it.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />}
                <span>
                  <span className={it.ok ? "" : "text-muted-foreground"}>{it.label}</span>
                  {!it.ok && it.hint && <span className="block text-[11px] text-muted-foreground/70">{it.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          {(editions > 0 || hasAudiobook) && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3 text-[11px] font-sans">
              {editions > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"><Globe className="h-3 w-3" /> {editions} edition{editions === 1 ? "" : "s"}</span>}
              {hasAudiobook && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"><Headphones className="h-3 w-3" /> Audiobook</span>}
              <Link to="/library" className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-primary hover:bg-primary/5">Open in Library →</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing metadata */}
      <Card className="border-border">
        <CardContent className="space-y-4 p-5">
          <h3 className="font-serif text-base font-semibold">Publishing details</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Author</Label>
              <Input value={meta.author ?? ""} onChange={set("author")} placeholder="e.g. Chama Meyembi" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Subtitle</Label>
              <Input value={meta.subtitle ?? ""} onChange={set("subtitle")} placeholder="e.g. Recovering the Original Authority…" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">ISBN <span className="text-muted-foreground/60">(optional)</span></Label>
              <Input value={meta.isbn ?? ""} onChange={set("isbn")} placeholder="978-1-23456-789-0" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Publisher</Label>
              <Input value={meta.publisher ?? ""} onChange={set("publisher")} placeholder="e.g. Polished Pages" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Imprint <span className="text-muted-foreground/60">(optional)</span></Label>
              <Input value={meta.imprint ?? ""} onChange={set("imprint")} placeholder="e.g. Wankong Publishing" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Trim size</Label>
              <select value={meta.trimSize ?? ""} onChange={set("trimSize")} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                <option value="">Choose…</option>
                {TRIM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Page count</Label>
              <Input value={meta.pageCount ?? ""} onChange={set("pageCount")} placeholder="e.g. 220" inputMode="numeric" maxLength={5} />
              {pages > 0 && <p className="text-[11px] text-muted-foreground font-sans">Approx spine width: {spineInches(pages)} in</p>}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans">ISBN and publisher feed the cover’s barcode and imprint mark; trim size and page count size the spine and print wrap.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionPanel;
