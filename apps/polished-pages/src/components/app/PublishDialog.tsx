import { useEffect, useState } from "react";
import { Loader2, Copy, Check, Crown, Building2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { publishDocument, CATALOG_CATEGORIES, CATALOG_LICENSES, type DocSummary } from "@/lib/documents";
import { fetchPlanStatus } from "@/lib/session";
import { isWankongPublishable } from "@/lib/wankong";
import WankongPublishButton from "@/components/app/WankongPublishButton";
import { myOrganizations, orgCollections, setDocumentOrg, addToOrgCollection, suggestCollections, can, type OrgSummary, type OrgCollection } from "@/lib/organizations";

// Publish a saved document to the public catalog: choose a category and an
// optional price, get a public link. (Free items download immediately; charging
// for paid items requires Stripe Connect — see the catalog note.)
const PublishDialog = ({ doc, trigger, onChanged }: { doc: DocSummary; trigger: React.ReactNode; onChanged?: (listed: boolean) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(doc.category ?? CATALOG_CATEGORIES[0]);
  const [author, setAuthor] = useState("");
  const [license, setLicense] = useState(CATALOG_LICENSES[2]);
  const [price, setPrice] = useState(((doc.price_cents ?? 0) / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPro, setIsPro] = useState(true); // assume true until known, so we don't flash the upsell
  // Optional: publish under an organization (→ shared library + storefront) and
  // file into a repository, all in this one action.
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [orgId, setOrgId] = useState("");
  const [cols, setCols] = useState<OrgCollection[]>([]);
  const [colId, setColId] = useState("");

  useEffect(() => { if (open) fetchPlanStatus().then((s) => setIsPro(!!s?.plan && s.plan !== "free")).catch(() => {}); }, [open]);
  useEffect(() => { if (open) myOrganizations().then((list) => setOrgs(list.filter((o) => can.edit(o.role)))).catch(() => {}); }, [open]);
  useEffect(() => {
    setColId("");
    if (!orgId) { setCols([]); return; }
    orgCollections(orgId).then(setCols).catch(() => setCols([]));
  }, [orgId]);

  const priceCents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;
  const needsPro = priceCents > 0 && !isPro;
  const link = token ? `${window.location.origin}/shared/${token}` : null;

  const publish = async (listed: boolean) => {
    setBusy(true);
    try {
      const t = await publishDocument(doc.id, { listed, category, priceCents, author, license });
      // In the same action: assign to an organization and (optionally) a repository.
      if (listed && orgId) {
        await setDocumentOrg(doc.id, orgId);
        if (colId) await addToOrgCollection(colId, doc.id);
      }
      setToken(listed ? t : null);
      onChanged?.(listed);
      const orgName = orgId ? orgs.find((o) => o.id === orgId)?.name : null;
      toast({ title: listed ? "Published" : "Removed from catalog", description: listed && orgName ? `On the marketplace and ${orgName}’s storefront.` : undefined });
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
          <DialogTitle className="font-serif">Publish “{doc.title}”</DialogTitle>
          <DialogDescription>List it on the marketplace — and, in the same step, publish it under an organization and into a repository.</DialogDescription>
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
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Bright Start Classroom" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">License</Label>
            <select value={license} onChange={(e) => setLicense(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              {CATALOG_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Price (USD) — 0 for free</Label>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            {needsPro ? (
              <p className="flex items-start gap-1.5 text-xs text-gold font-sans"><Crown className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Selling paid items is a Pro feature (commercial rights). Upgrade in Account, or set the price to 0 to share for free.</p>
            ) : (
              <p className="text-xs text-muted-foreground font-sans">Free items download immediately. Buyer charging and seller payouts arrive with Stripe Connect (not yet enabled).</p>
            )}
          </div>
          {/* Publish under an organization — one action lists it AND puts it on
              the institution's storefront and (optionally) a repository. */}
          {orgs.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><Building2 className="h-3.5 w-3.5" /> Publish under an organization <span className="font-normal normal-case">(optional)</span></div>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                <option value="">Just my marketplace listing</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {orgId && (() => {
                const suggestions = suggestCollections({ title: doc.title, category: doc.category, kind: doc.kind }, cols);
                return (
                  <>
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-sans">Suggested:</span>
                        {suggestions.slice(0, 3).map((c, i) => (
                          <button key={c.id} type="button" onClick={() => setColId(c.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium font-sans transition-colors ${colId === c.id ? "border-primary bg-primary/10 text-primary" : "border-dashed border-primary/40 text-foreground hover:bg-primary/5"}`}>
                            {i === 0 && colId !== c.id && <Sparkles className="h-3 w-3 text-gold" />} {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <select value={colId} onChange={(e) => setColId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                      <option value="">No repository</option>
                      {cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </>
                );
              })()}
            </div>
          )}

          {link && (
            <div className="rounded-lg border border-border p-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button variant="heroOutline" size="sm" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="hero" className="flex-1" disabled={busy || needsPro} onClick={() => publish(true)}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} {doc.listed ? "Update listing" : "Publish"}
            </Button>
            {doc.listed && <Button variant="ghost" disabled={busy} onClick={() => publish(false)}>Unlist</Button>}
          </div>

          {/* Other stores this title can go to. Wankong publishes directly; the
              rest are manual uploads handled in the Distribution center. */}
          {isWankongPublishable(doc.kind) && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Also sell on</p>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium font-sans">Wankong store</div>
                  <div className="text-xs text-muted-foreground font-sans">Publish straight to Wankong (you’ll need a Wankong account).</div>
                </div>
                <WankongPublishButton doc={doc} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
