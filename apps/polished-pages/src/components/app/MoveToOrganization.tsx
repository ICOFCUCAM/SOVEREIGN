import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Building2, ArrowRight, Check, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  myOrganizations, orgCollections, setDocumentOrg, copyDocumentToOrg, addToOrgCollection,
  can, ORG_TYPES, COLLECTION_KINDS,
  type OrgSummary, type OrgCollection, type CollectionKind,
} from "@/lib/organizations";

const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;
const KIND_LABEL = Object.fromEntries(COLLECTION_KINDS.map((k) => [k.value, k.label])) as Record<CollectionKind, string>;

// The simplest path from personal creation to organizational ownership.
// Move (re-assign ownership) or Copy (leave a draft) into an organization the
// user can edit, optionally filing it into a repository — in as few clicks as
// possible (a single org pre-selects; "Move" then confirms in two clicks).
const MoveToOrganization = ({ documentId, listed, onDone, trigger }: {
  documentId: string; listed?: boolean; onDone?: () => void; trigger: React.ReactNode;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<OrgSummary[] | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [cols, setCols] = useState<OrgCollection[]>([]);
  const [colId, setColId] = useState<string>("");
  const [mode, setMode] = useState<"move" | "copy">("move");
  const [busy, setBusy] = useState(false);

  const editable = (list: OrgSummary[]) => list.filter((o) => can.edit(o.role));
  const current = orgs?.find((o) => o.id === orgId) ?? null;

  const load = async () => {
    setOrgs(null); setOrgId(""); setCols([]); setColId(""); setMode("move");
    try {
      const list = editable(await myOrganizations());
      setOrgs(list);
      if (list.length === 1) selectOrg(list[0].id);
    } catch (e) { toast({ title: "Could not load organizations", description: e instanceof Error ? e.message : "", variant: "destructive" }); setOrgs([]); }
  };

  const selectOrg = async (id: string) => {
    setOrgId(id); setColId(""); setCols([]);
    try { setCols(await orgCollections(id)); } catch { /* repositories are optional */ }
  };

  const confirm = async () => {
    if (!orgId || !current) return;
    setBusy(true);
    try {
      const targetDoc = mode === "copy" ? await copyDocumentToOrg(documentId, orgId) : (await setDocumentOrg(documentId, orgId), documentId);
      if (colId) await addToOrgCollection(colId, targetDoc);
      setOpen(false);
      toast({
        title: mode === "copy" ? "Copied to organization" : "Moved to organization",
        description: (
          <span className="font-sans">
            {current.name}{colId ? ` · ${cols.find((c) => c.id === colId)?.name ?? ""}` : ""}.{" "}
            <Link to={`/org/${current.slug}`} className="font-semibold text-primary underline">View storefront</Link>
          </span>
        ),
      });
      onDone?.();
    } catch (e) {
      toast({ title: "Could not complete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Add to an organization</DialogTitle>
          <DialogDescription>Publish this work under an institution — its shared library, analytics and storefront update automatically.</DialogDescription>
        </DialogHeader>

        {orgs === null ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : orgs.length === 0 ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-muted-foreground font-sans">You don’t have edit access to any organization yet.</p>
            <Button asChild variant="hero" size="sm"><Link to="/organizations">Create an organization <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Move / Copy */}
            <div className="grid grid-cols-2 gap-2">
              {(["move", "copy"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`rounded-lg border px-3 py-2 text-left transition-colors ${mode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <div className="flex items-center gap-1.5 text-sm font-semibold font-sans">{mode === m && <Check className="h-3.5 w-3.5 text-primary" />}{m === "move" ? "Move" : "Copy"}</div>
                  <div className="text-xs text-muted-foreground font-sans">{m === "move" ? "Transfer this document to the organization." : "Keep yours; add a draft copy."}</div>
                </button>
              ))}
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Organization</label>
              <select value={orgId} onChange={(e) => selectOrg(e.target.value)} className="field select-premium w-full font-sans">
                <option value="" disabled>Choose an organization…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} · {typeLabel(o.type)}</option>)}
              </select>
            </div>

            {/* Repository (optional) */}
            {orgId && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">Repository <span className="font-normal normal-case">(optional)</span></label>
                <select value={colId} onChange={(e) => setColId(e.target.value)} className="field select-premium w-full font-sans">
                  <option value="">— No repository —</option>
                  {cols.map((c) => <option key={c.id} value={c.id}>{c.name} · {KIND_LABEL[c.kind]}</option>)}
                </select>
              </div>
            )}

            {mode === "move" && listed && (
              <p className="flex items-start gap-1.5 rounded-lg bg-marketplace/5 px-3 py-2 text-xs text-muted-foreground font-sans">
                <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marketplace" /> This is listed on the marketplace — it will appear on the organization’s storefront.
              </p>
            )}

            <Button variant="hero" className="w-full" disabled={!orgId || busy} onClick={confirm}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {mode === "copy" ? "Copy to organization" : "Move to organization"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MoveToOrganization;
