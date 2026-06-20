import { useEffect, useState } from "react";
import { Loader2, Store, ExternalLink, Crown, UserPlus, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { DocSummary } from "@/lib/documents";
import { publishToWankong, wankongListing, isWankongPublishable, WANKONG_STORE_URL } from "@/lib/wankong";

// Publish one saved book/storybook straight into the Wankong store. The user
// publishes as themselves — it lands in the store only if their email already
// owns a Wankong account.
const WankongPublishButton = ({ doc, trigger }: { doc: DocSummary; trigger?: React.ReactNode }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState(((doc.price_cents ?? 0) / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) wankongListing(doc.id).then((l) => { if (l?.status === "live") setLiveUrl(l.external_url); }).catch(() => {});
  }, [open, doc.id]);

  if (!isWankongPublishable(doc.kind)) return null;

  const priceCents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;

  const publish = async () => {
    setBusy(true);
    setNeedsAccount(false);
    try {
      const res = await publishToWankong(doc, { priceCents, author });
      if (res.needs_account) {
        setNeedsAccount(true);
        return;
      }
      setLiveUrl(res.url ?? null);
      toast({ title: "Published to Wankong", description: priceCents > 0 ? "Your book is live and for sale." : "Your free book is live in the store." });
    } catch (e) {
      toast({ title: "Could not publish", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="heroOutline"><Store className="mr-1 h-4 w-4" /> Wankong store</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Publish to the Wankong store</DialogTitle>
          <DialogDescription>Sell “{doc.title}” directly on Wankong. Publishes as you — you need a Wankong account on the same email.</DialogDescription>
        </DialogHeader>

        {needsAccount ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm font-sans">
              <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>We couldn’t find a Wankong account for your email. Create one (use the same email) and publish again.</span>
            </div>
            <Button asChild variant="hero" className="w-full">
              <a href={`${WANKONG_STORE_URL}`} target="_blank" rel="noopener noreferrer">
                Create a Wankong account <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setNeedsAccount(false)}>Back</Button>
          </div>
        ) : liveUrl !== null ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-sans">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Live in the Wankong store. Re-publishing updates the same listing.</span>
            </div>
            {liveUrl && (
              <Button asChild variant="heroOutline" className="w-full">
                <a href={liveUrl} target="_blank" rel="noopener noreferrer">View in store <ExternalLink className="ml-1 h-4 w-4" /></a>
              </Button>
            )}
            <Button variant="hero" className="w-full" disabled={busy} onClick={publish}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Update listing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Author / pen name (shown in the store)</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Alex Morgan" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Price (USD) — 0 for free</Label>
              <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground font-sans">
                {priceCents > 0 ? <><Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" /> Selling a paid title needs a paid (commercial) plan. Authors earn Wankong’s 70% royalty per sale.</> : "Free titles are downloadable immediately from the store."}
              </p>
            </div>
            <Button variant="hero" className="w-full" disabled={busy} onClick={publish}>
              {busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing…</> : <><Store className="mr-1 h-4 w-4" /> Publish to Wankong</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WankongPublishButton;
