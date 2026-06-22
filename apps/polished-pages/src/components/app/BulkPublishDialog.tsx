import { useEffect, useState } from "react";
import { Loader2, Building2, Store, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { publishDocument, CATALOG_CATEGORIES, CATALOG_LICENSES, type DocSummary } from "@/lib/documents";
import { fetchPlanStatus } from "@/lib/session";
import { myOrganizations, orgCollections, setDocumentOrg, addToOrgCollection, can, type OrgSummary, type OrgCollection } from "@/lib/organizations";

// Publish many works at once — the activation lever for a publisher's catalog,
// a school's curriculum or an NGO's program. One form, one action, N listings,
// optionally all under an organization and into a repository.
const BulkPublishDialog = ({ docs, onDone, trigger }: { docs: DocSummary[]; onDone: () => void; trigger: React.ReactNode }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATALOG_CATEGORIES[0]);
  const [author, setAuthor] = useState("");
  const [license, setLicense] = useState(CATALOG_LICENSES[2]);
  const [price, setPrice] = useState("0.00");
  const [isPro, setIsPro] = useState(true);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [orgId, setOrgId] = useState("");
  const [cols, setCols] = useState<OrgCollection[]>([]);
  const [colId, setColId] = useState("");
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { fetchPlanStatus().then((s) => setIsPro(!!s?.plan && s.plan !== "free")).catch(() => {}); myOrganizations().then((l) => setOrgs(l.filter((o) => can.edit(o.role)))).catch(() => {}); } }, [open]);
  useEffect(() => { setColId(""); if (!orgId) { setCols([]); return; } orgCollections(orgId).then(setCols).catch(() => setCols([])); }, [orgId]);

  const priceCents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;
  const needsPro = priceCents > 0 && !isPro;

  const run = async () => {
    setBusy(true); setDone(0);
    let ok = 0;
    for (const d of docs) {
      try {
        await publishDocument(d.id, { listed: true, category, priceCents, author, license });
        if (orgId) { await setDocumentOrg(d.id, orgId); if (colId) await addToOrgCollection(colId, d.id); }
        ok += 1; setDone(ok);
      } catch { /* continue publishing the rest */ }
    }
    setBusy(false);
    setOpen(false);
    const orgName = orgId ? orgs.find((o) => o.id === orgId)?.name : null;
    toast({ title: `Published ${ok} of ${docs.length} work${docs.length === 1 ? "" : "s"}`, description: orgName ? `On the marketplace and ${orgName}’s storefront.` : "Live on the marketplace." });
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Publish {docs.length} work{docs.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>List the selected works on the marketplace at once — and optionally under an organization and repository.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                {CATALOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Price (USD)</Label>
              <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Publisher / author name (shown publicly)</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Bright Future Academy" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">License</Label>
            <select value={license} onChange={(e) => setLicense(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              {CATALOG_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {orgs.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><Building2 className="h-3.5 w-3.5" /> Publish under an organization <span className="font-normal normal-case">(optional)</span></div>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                <option value="">Just my marketplace listings</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {orgId && (
                <select value={colId} onChange={(e) => setColId(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  <option value="">No repository</option>
                  {cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          )}
          {needsPro ? (
            <p className="flex items-start gap-1.5 text-xs text-gold font-sans"><Crown className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Selling paid items is a Pro feature. Set the price to 0 to publish for free, or upgrade in Account.</p>
          ) : (
            <p className="text-xs text-muted-foreground font-sans">All {docs.length} works will use these settings. You can fine-tune any listing individually afterward.</p>
          )}
          <Button variant="hero" className="w-full" disabled={busy || needsPro} onClick={run}>
            {busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing {done}/{docs.length}…</> : <><Store className="mr-1 h-4 w-4" /> Publish {docs.length} work{docs.length === 1 ? "" : "s"}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPublishDialog;
