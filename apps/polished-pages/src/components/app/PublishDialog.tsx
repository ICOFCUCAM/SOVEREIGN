import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { publishDocument, CATALOG_CATEGORIES, type DocSummary } from "@/lib/documents";

// Publish a saved document to the public catalog: choose a category and an
// optional price, get a public link. (Free items download immediately; charging
// for paid items requires Stripe Connect — see the catalog note.)
const PublishDialog = ({ doc, trigger, onChanged }: { doc: DocSummary; trigger: React.ReactNode; onChanged?: (listed: boolean) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(doc.category ?? CATALOG_CATEGORIES[0]);
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState(((doc.price_cents ?? 0) / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = token ? `${window.location.origin}/shared/${token}` : null;

  const publish = async (listed: boolean) => {
    setBusy(true);
    try {
      const cents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;
      const t = await publishDocument(doc.id, { listed, category, priceCents: cents, author });
      setToken(listed ? t : null);
      onChanged?.(listed);
      toast({ title: listed ? "Published to catalog" : "Removed from catalog" });
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => { if (link) { await navigator.clipboard.writeText(link).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); } };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Publish to catalog</DialogTitle>
          <DialogDescription>List “{doc.title}” in the public catalog with a shareable link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              {CATALOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Publisher / author name (shown publicly)</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Ms. Okafor’s Classroom" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Price (USD) — 0 for free</Label>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            <p className="text-xs text-muted-foreground font-sans">Free items download immediately. Paid pricing is displayed; charging buyers and paying sellers requires Stripe Connect (not yet enabled).</p>
          </div>
          {link && (
            <div className="rounded-lg border border-border p-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button variant="heroOutline" size="sm" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="hero" className="flex-1" disabled={busy} onClick={() => publish(true)}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} {doc.listed ? "Update listing" : "Publish"}
            </Button>
            {doc.listed && <Button variant="ghost" disabled={busy} onClick={() => publish(false)}>Unlist</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
