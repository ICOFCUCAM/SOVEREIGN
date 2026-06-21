import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Users, Mail, BarChart3, FolderPlus, ExternalLink, Loader2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { coverArt } from "@/lib/cover-art";
import {
  myOrganizations, createOrganization, orgMembers, orgInvitations, orgAnalytics, orgCollections,
  inviteToOrg, setOrgRole, removeOrgMember, createOrgCollection, can, ORG_TYPES, ROLE_LABEL,
  type OrgSummary, type OrgMember, type OrgInvite, type OrgAnalytics, type OrgCollection, type OrgType, type OrgRole,
} from "@/lib/organizations";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";
const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;

const ManagePanel = ({ org }: { org: OrgSummary }) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [stats, setStats] = useState<OrgAnalytics | null>(null);
  const [collections, setCollections] = useState<OrgCollection[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");
  const [colName, setColName] = useState("");
  const manage = can.manage(org.role);

  const load = () => {
    orgMembers(org.id).then(setMembers).catch(() => {});
    orgAnalytics(org.id).then(setStats).catch(() => {});
    orgCollections(org.id).then(setCollections).catch(() => {});
    if (manage) orgInvitations(org.id).then(setInvites).catch(() => {});
  };
  useEffect(load, [org.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invite = async () => {
    if (!email.trim()) return;
    try { await inviteToOrg(org.id, email.trim(), role); setEmail(""); toast({ title: "Invitation sent", description: email }); orgInvitations(org.id).then(setInvites); }
    catch (e) { toast({ title: "Could not invite", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };
  const changeRole = async (userId: string, r: OrgRole) => {
    try { await setOrgRole(org.id, userId, r); load(); }
    catch (e) { toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };
  const remove = async (userId: string) => {
    try { await removeOrgMember(org.id, userId); load(); }
    catch (e) { toast({ title: "Could not remove", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };
  const addCollection = async () => {
    if (!colName.trim()) return;
    try { await createOrgCollection(org.id, colName.trim()); setColName(""); orgCollections(org.id).then(setCollections); }
    catch (e) { toast({ title: "Could not create", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const STATS = stats ? [
    { v: stats.works, l: "Works" }, { v: stats.published, l: "Published" }, { v: stats.views, l: "Views" },
    { v: stats.downloads, l: "Downloads" }, { v: stats.members, l: "Members" }, { v: stats.collections, l: "Collections" },
  ] : [];

  return (
    <div className="mt-4 space-y-6 border-t border-border pt-5">
      {/* Analytics */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><BarChart3 className="h-3.5 w-3.5" /> Analytics</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STATS.map((s) => (
            <div key={s.l} className="rounded-lg border border-border bg-background p-2.5 text-center">
              <div className="font-serif text-lg font-bold">{s.v}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><Users className="h-3.5 w-3.5" /> Members</div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-sans">{m.email}</span>
              {manage && m.role !== "owner" ? (
                <select value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value as OrgRole)} className="field select-premium py-1 text-xs font-sans">
                  {(["admin", "editor", "contributor", "viewer"] as OrgRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground font-sans">{ROLE_LABEL[m.role]}</span>
              )}
              {manage && m.role !== "owner" && (
                <button onClick={() => remove(m.user_id)} className="text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      {manage && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><Mail className="h-3.5 w-3.5" /> Invite a member</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu" type="email" className="flex-1" />
            <select value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className="field select-premium font-sans">
              {(["admin", "editor", "contributor", "viewer"] as OrgRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <Button variant="hero" size="sm" onClick={invite}>Send invite</Button>
          </div>
          {invites.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {invites.map((i) => <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-sans"><Mail className="h-3 w-3" /> {i.email} · {ROLE_LABEL[i.role]} · pending</span>)}
            </div>
          )}
        </div>
      )}

      {/* Collections */}
      {can.edit(org.role) && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans"><FolderPlus className="h-3.5 w-3.5" /> Collections</div>
          <div className="flex flex-wrap gap-1.5">
            {collections.map((c) => <span key={c.id} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium font-sans">{c.name} <span className="text-muted-foreground">· {c.item_count}</span></span>)}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="e.g. Grade 1 Mathematics" className="flex-1" />
            <Button variant="heroOutline" size="sm" onClick={addCollection}><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Organizations = () => {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrgSummary[] | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("publisher");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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
      </div>

      {/* My orgs */}
      <div className="mt-8 space-y-4">
        {orgs === null && <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {orgs && orgs.length === 0 && <p className="text-sm text-muted-foreground font-sans">You’re not part of any organization yet. Create one above to get started.</p>}
        {orgs && orgs.map((o) => {
          const g = coverArt(o.name);
          return (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-serif text-base font-bold text-white" style={{ backgroundImage: `linear-gradient(150deg, ${g.from}, ${g.to})` }}>{initials(o.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-lg font-bold">{o.name}</span>
                    {o.verified && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-sans">{typeLabel(o.type)} · {ROLE_LABEL[o.role]} · {o.member_count} member{o.member_count === 1 ? "" : "s"}</div>
                </div>
                <Link to={`/org/${o.slug}`} className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline font-sans sm:inline-flex">Storefront <ExternalLink className="h-3.5 w-3.5" /></Link>
                <Button variant="heroOutline" size="sm" onClick={() => setOpenId(openId === o.id ? null : o.id)}>{openId === o.id ? "Close" : "Manage"}</Button>
              </div>
              {openId === o.id && <ManagePanel org={o} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Organizations;
