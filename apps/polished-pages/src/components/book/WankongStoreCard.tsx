import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Loader2, Library as LibraryIcon, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listDocuments, type DocSummary } from "@/lib/documents";
import { isWankongPublishable } from "@/lib/wankong";
import WankongPublishButton from "@/components/app/WankongPublishButton";

// The Wankong store as a first-class, *direct* distribution target: unlike the
// KDP/IngramSpark links (manual upload), this publishes the selected book to
// the store in one click.
const WankongStoreCard = () => {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    listDocuments()
      .then((all) => {
        const books = all.filter((d) => isWankongPublishable(d.kind));
        setDocs(books);
        if (books[0]) setSelected(books[0].id);
      })
      .catch(() => setDocs([]));
  }, []);

  const selectedDoc = docs?.find((d) => d.id === selected) ?? null;

  return (
    <Card id="wankong" className="border-publishing/30 bg-publishing/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-lg">
          <Store className="h-4 w-4 text-publishing" /> Wankong store
          <span className="inline-flex items-center gap-0.5 rounded-full bg-publishing/15 px-2 py-0.5 text-[10px] font-semibold text-publishing"><Zap className="h-3 w-3" /> Direct publish</span>
        </CardTitle>
        <CardDescription className="font-sans">Publish a finished book straight to the Wankong store — no manual upload. You publish as yourself and need a Wankong account on the same email; authors earn Wankong’s 70% royalty.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {docs === null && <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading your books…</div>}
        {docs && docs.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <LibraryIcon className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground font-sans">No books or storybooks saved yet.</p>
            <Button asChild variant="hero" size="sm"><Link to="/book">Create a book</Link></Button>
          </div>
        )}
        {docs && docs.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="font-sans text-xs">Book</Label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            {selectedDoc && (
              <WankongPublishButton
                doc={selectedDoc}
                trigger={<Button variant="hero" size="sm"><Store className="mr-1 h-4 w-4" /> Publish to Wankong</Button>}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WankongStoreCard;
