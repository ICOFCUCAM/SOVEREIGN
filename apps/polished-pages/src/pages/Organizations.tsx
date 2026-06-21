import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, ExternalLink, Loader2, Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { coverArt } from "@/lib/cover-art";
import {
  myOrganizations, createOrganization, ORG_TYPES, ROLE_LABEL, ORG_PRESENTATION,
  type OrgSummary, type OrgType,
} from "@/lib/organizations";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";
const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;

const Organizations = () => {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrgSummary[] | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("publisher");
  const [creating, setCreating] = useState(false);

  const load = () => myOrganizations().then(setOrgs).catch(() => setOrgs([]));
  useEffect(load, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try { await createOrganization(name.trim(), type); setName(""); toast({ title: "Organization created" }); load(); }
    catch (e) { toast({ title: "Could not create", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-3xl font-bold tracking-tight">Organizations</h1>
      </div>
      <p className="mt-1 text-muted-foreground font-sans">Run Polished Pages as a publisher, school, NGO, ministry or company — with a shared library, team roles and a public storefront.</p>

      {/* Create */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-semibold font-sans">Create an organization</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="font-sans text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bright Future Academy" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as OrgType)} className="field select-premium w-full font-sans">
              {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Button variant="hero" disabled={creating || !name.trim()} onClick={create}>
            {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Create
          </Button>
        </div>
        {/* What this organization will feel like, by type */}
        <p className="mt-3 text-xs text-muted-foreground font-sans">{ORG_PRESENTATION[type].workspaceLine}</p>
      </div>

      {/* My orgs */}
      <div className="mt-8 space-y-3">
        {orgs === null && <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {orgs && orgs.length === 0 && <p className="text-sm text-muted-foreground font-sans">You’re not part of any organization yet. Create one above to get started.</p>}
        {orgs && orgs.map((o) => {
          const g = coverArt(o.name);
          return (
            <Link key={o.id} to={`/organizations/${o.slug}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-serif text-base font-bold text-white" style={{ backgroundImage: `linear-gradient(150deg, ${g.from}, ${g.to})` }}>{initials(o.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-serif text-lg font-bold">{o.name}</span>
                  {o.verified && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground font-sans">{typeLabel(o.type)} · {ROLE_LABEL[o.role]} · {o.member_count} member{o.member_count === 1 ? "" : "s"}</div>
              </div>
              <Link to={`/org/${o.slug}`} onClick={(e) => e.stopPropagation()} className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline font-sans sm:inline-flex">Storefront <ExternalLink className="h-3.5 w-3.5" /></Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary font-sans">Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          );
        })}
      </div>

      {/* Discover */}
      <Link to="/institutions" className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm transition-colors hover:border-primary/40">
        <Sparkles className="h-4 w-4 text-marketplace" />
        <span className="font-sans">Explore institutions publishing on Polished Pages</span>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
};

export default Organizations;
