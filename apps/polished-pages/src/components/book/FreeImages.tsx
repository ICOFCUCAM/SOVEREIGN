import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SOURCE_LABEL, fetchCoverImage, searchCoverImages, type CoverImage, type Source } from "@/lib/cover-images";
import type { ArtCredit } from "@/lib/cover-design";

// Search free image libraries for cover artwork. Only images licensed for
// commercial use and adaptation are shown; each shows its licence, and any
// credit the licence requires is printed on the back cover automatically.
export default function FreeImages({ initial, side, onClose, onPick }: {
  initial: string; side: "front" | "back"; onClose: () => void; onPick: (src: string, credit: ArtCredit) => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [q, setQ] = useState(initial);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<CoverImage[] | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const search = async (query = q, p = 1) => {
    if (!query.trim()) return;
    setBusy("search");
    try {
      const r = await searchCoverImages(query.trim(), p);
      setSources(r.sources); setPage(p);
      setResults((cur) => (p > 1 && cur ? [...cur, ...r.results] : r.results));
      if (r.errors?.length && !r.results.length) toast({ title: "The image libraries didn't answer", description: r.errors.join("; "), variant: "destructive" });
    } catch (e) { toast({ title: "Search failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  useEffect(() => { if (initial.trim()) void search(initial, 1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const use = async (img: CoverImage) => {
    setBusy(img.id);
    try {
      const src = await fetchCoverImage(img);
      await onPick(src, { text: img.credit, required: img.creditRequired, license: img.license, page: img.page });
      onClose();
    } catch (e) { toast({ title: "Couldn't use that image", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Free images · {side === "front" ? "front cover" : "back cover"}</DialogTitle>
          <DialogDescription>
            Only images you may use commercially and adapt for a cover: public domain, CC0 and CC BY from Openverse (Wikimedia Commons, Flickr Commons, museums and more){sources.length > 1 ? `, plus ${sources.filter((s) => s !== "openverse").map((s) => SOURCE_LABEL[s]).join(", ")}` : ""}. If a licence asks for credit, it's printed small on the back cover. Check the image's page before printing.
          </DialogDescription>
        </DialogHeader>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(q, 1); }}>
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. mountain sunrise, old library, ocean storm" className="pl-9" aria-label="Search free images" /></div>
          <Button type="submit" variant="hero" disabled={busy === "search"}>{busy === "search" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}</Button>
        </form>
        {results === null ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{busy === "search" ? "Searching…" : "Describe the picture you want."}</p>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nothing found. Try simpler words, in English.</p>
        ) : (
          <>
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4" data-testid="free-images">
              {results.map((r) => (
                <figure key={`${r.source}-${r.id}`} className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card">
                  <button type="button" onClick={() => use(r)} disabled={busy !== null} className="group relative block w-full" aria-label={`Use ${r.title}`}>
                    <img src={r.thumb} alt={r.title} loading="lazy" className="w-full bg-muted object-cover" style={{ aspectRatio: r.width && r.height ? `${r.width} / ${r.height}` : undefined }} />
                    <span className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">{busy === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : `Use for ${side}`}</span>
                    {r.width > 0 && r.height > 0 && r.width > r.height && <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Landscape: will be cropped</span>}
                  </button>
                  <figcaption className="space-y-0.5 p-2 text-[11px]">
                    <div className="truncate font-medium" title={r.title}>{r.title}</div>
                    <div className="flex items-center justify-between gap-2 text-muted-foreground">
                      <span className="truncate">{r.creator} · {SOURCE_LABEL[r.source]}</span>
                      {r.page && <a href={r.page} target="_blank" rel="noreferrer" className="shrink-0 hover:text-foreground" aria-label="Open the image's page"><ExternalLink className="h-3 w-3" /></a>}
                    </div>
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${r.creditRequired ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                      {r.license}{r.creditRequired ? " · credit printed" : " · no credit needed"}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="flex justify-center"><Button variant="heroOutline" size="sm" disabled={busy !== null} onClick={() => search(q, page + 1)}>More images</Button></div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
