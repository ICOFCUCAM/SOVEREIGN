import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, Mail, FolderPlus, ExternalLink, Loader2, Trash2, BadgeCheck,
  Globe, Library as LibraryIcon, Languages, BookOpen, GraduationCap, Megaphone, Layers,
  ShieldCheck, Activity, Settings2, Save, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SpineMark from "@/components/brand/SpineMark";
import {
  getOrganization, orgMembers, orgInvitations, orgAnalytics, orgCollections, orgContent,
  orgCategories, orgAudit, updateOrganization, inviteToOrg, setOrgRole, removeOrgMember,
  createOrgCollection, can, ORG_TYPES, ROLE_LABEL, ORG_PRESENTATION, COLLECTION_KINDS,
  EDUCATIONAL_CATEGORIES,
  type OrgDetail, type OrgMember, type OrgInvite, type OrgAnalytics, type OrgCollection,
  type OrgContentRow, type OrgCategoryRow, type OrgAuditRow, type OrgRole, type CollectionKind,
} from "@/lib/organizations";

const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "O";
const KIND_LABEL: Record<string, string> = { book: "Books", storybook: "Storybooks", cv: "CVs", tailored: "Tailored", cover: "Covers", illustration: "Illustrations", "cover-letter": "Cover letters", other: "Other" };
const COLLECTION_KIND_LABEL = Object.fromEntries(COLLECTION_KINDS.map((k) => [k.value, k.label])) as Record<CollectionKind, string>;

const FOCUS_ICON = {
  catalog: BookOpen, localization: Languages, collections: Layers, education: GraduationCap, programs: Megaphone, members: Users,
} as const;

// A friendly, human label for each audit action verb.
const ACTION_LABEL: Record<string, string> = {
  "org.created": "created the organization", "org.updated": "updated organization settings",
  "member.invited": "invited", "member.joined": "joined", "member.role_changed": "changed a role",
  "member.removed": "removed", "collection.created": "created a collection", "content.added": "added content",
};

const Stat = ({ v, l }: { v: number | string; l: string }) => (
  <div className="rounded-xl border border-border bg-background p-3 text-center">
    <div className="font-serif text-2xl font-bold tabular-nums">{v}</div>
    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{l}</div>
  </div>
);

const SectionTitle = ({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">
    <Icon className="h-3.5 w-3.5" /> {children}
  </div>
);

const OrgWorkspace = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [org, setOrg] = useState<OrgDetail | null | undefined>(undefined);
  const [stats, setStats] = useState<OrgAnalytics | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [collections, setCollections] = useState<OrgCollection[]>([]);
  const [content, setContent] = useState<OrgContentRow[]>([]);
  const [categories, setCategories] = useState<OrgCategoryRow[]>([]);
  const [audit, setAudit] = useState<OrgAuditRow[]>([]);

  const pres = org ? ORG_PRESENTATION[org.type] : null;
  const manage = can.manage(org?.my_role);
  const edit = can.edit(org?.my_role);

  const loadOrgData = useCallback((id: string, role: OrgRole | null) => {
    orgAnalytics(id).then(setStats).catch(() => {});
    orgMembers(id).then(setMembers).catch(() => {});
    orgCollections(id).then(setCollections).catch(() => {});
    orgContent(id).then(setContent).catch(() => {});
    orgCategories(id).then(setCategories).catch(() => {});
    if (can.manage(role)) {
      orgInvitations(id).then(setInvites).catch(() => {});
      orgAudit(id).then(setAudit).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    setOrg(undefined);
    getOrganization(slug).then((o) => {
      setOrg(o);
      if (o) loadOrgData(o.id, o.my_role);
    }).catch(() => setOrg(null));
  }, [slug, loadOrgData]);

  const reload = () => { if (org) loadOrgData(org.id, org.my_role); };

  const eduAssets = useMemo(
    () => categories.filter((c) => EDUCATIONAL_CATEGORIES.includes(c.category)).reduce((s, c) => s + c.total, 0),
    [categories],
  );
  const programCollections = useMemo(
    () => collections.filter((c) => c.kind === "program" || c.kind === "curriculum").length,
    [collections],
  );

  if (org === undefined) return <div className="flex min-h-[60vh] items-center justify-center"><SpineMark animated /></div>;
  if (org === null) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <SpineMark className="mx-auto justify-center" />
        <h1 className="mt-6 font-serif text-2xl font-bold">Organization not found</h1>
        <p className="mt-2 text-muted-foreground font-sans">You may not have access, or its handle changed.</p>
        <Link to="/organizations" className="mt-6 inline-block text-primary hover:underline font-sans">← Back to organizations</Link>
      </div>
    );
  }
  if (!org.my_role) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl font-bold">{org.name}</h1>
        <p className="mt-2 text-muted-foreground font-sans">You’re not a member of this organization.</p>
        <Link to={`/org/${org.slug}`} className="mt-6 inline-block text-primary hover:underline font-sans">View public storefront →</Link>
      </div>
    );
  }

  const focusValue = (key: string): { v: number | string; sub: string } => {
    switch (key) {
      case "catalog": return { v: stats?.published ?? 0, sub: `${stats?.works ?? 0} total works` };
      case "localization": return { v: stats?.languages ?? 0, sub: `${stats?.translations ?? 0} editions` };
      case "collections": return { v: stats?.collections ?? 0, sub: "repositories" };
      case "education": return { v: eduAssets, sub: "educational assets" };
      case "programs": return { v: programCollections, sub: "programs & curricula" };
      case "members": return { v: stats?.members ?? 0, sub: "members" };
      default: return { v: 0, sub: "" };
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/organizations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-sans"><ArrowLeft className="h-4 w-4" /> Organizations</Link>

      {/* Institutional banner — a control center header, not a settings bar */}
      <section className="relative mt-3 overflow-hidden rounded-3xl text-white" style={{ background: `linear-gradient(135deg, ${pres!.accent[0]}, ${pres!.accent[1]})` }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-serif text-2xl font-bold ring-1 ring-white/20 backdrop-blur">{initials(org.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80"><Building2 className="h-3 w-3" /> {typeLabel(org.type)}</span>
              {org.verified && <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-900"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified</span>}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{ROLE_LABEL[org.my_role]}</span>
            </div>
            <h1 className="text-display mt-2 truncate text-3xl font-bold md:text-4xl">{org.name}</h1>
            <p className="mt-1 text-sm text-white/65 font-sans">{pres!.workspaceLine}</p>
          </div>
          <Link to={`/org/${org.slug}`} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"><ExternalLink className="h-4 w-4" /> Storefront</Link>
        </div>
      </section>

      {/* Type-specific focus lenses */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {pres!.focus.map((f) => {
          const Icon = FOCUS_ICON[f.key];
          const { v, sub } = focusValue(f.key);
          return (
            <div key={f.key} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-serif text-3xl font-bold tabular-nums">{v}</div>
              <div className="text-sm font-semibold font-sans">{f.label}</div>
              <div className="text-xs text-muted-foreground font-sans">{sub}</div>
            </div>
          );
        })}
      </div>

      {/* Organization Health */}
      <div className="mt-8">
        <SectionTitle icon={Activity}>Organization health</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <Stat v={stats?.works ?? 0} l="Works" />
          <Stat v={stats?.published ?? 0} l="Published" />
          <Stat v={stats?.views ?? 0} l="Views" />
          <Stat v={stats?.downloads ?? 0} l="Downloads" />
          <Stat v={stats?.languages ?? 0} l="Languages" />
          <Stat v={stats?.translations ?? 0} l="Editions" />
          <Stat v={stats?.members ?? 0} l="Members" />
          <Stat v={stats?.collections ?? 0} l="Collections" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Content mix */}
        <div>
          <SectionTitle icon={LibraryIcon}>Content mix</SectionTitle>
          {content.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No content in the shared library yet. Add works to this organization from your Library.</p>
          ) : (
            <div className="space-y-2">
              {content.map((c) => {
                const max = Math.max(...content.map((x) => x.total), 1);
                return (
                  <div key={c.kind}>
                    <div className="flex items-center justify-between text-sm font-sans"><span className="font-medium">{KIND_LABEL[c.kind] ?? c.kind}</span><span className="text-muted-foreground">{c.published}/{c.total} published</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold-gradient" style={{ width: `${(c.total / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Educational / category coverage */}
        <div>
          <SectionTitle icon={GraduationCap}>{org.type === "school" || org.type === "ministry" ? "Educational assets" : "Category coverage"}</SectionTitle>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No published categories yet. Once works are listed on the marketplace, their categories appear here.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c.category} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium font-sans ${EDUCATIONAL_CATEGORIES.includes(c.category) ? "border-educational/40 bg-educational/10" : "border-border"}`}>
                  {c.category} <span className="text-muted-foreground">· {c.total}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shared repositories (typed collections) */}
      <div className="mt-8">
        <SectionTitle icon={Layers}>Shared repositories</SectionTitle>
        {collections.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate font-semibold font-sans">{c.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{COLLECTION_KIND_LABEL[c.kind]}</span>
                </div>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground font-sans">{c.description}</p>}
                <div className="mt-1.5 text-xs text-muted-foreground font-sans">{c.item_count} item{c.item_count === 1 ? "" : "s"}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-sans">No repositories yet.{edit ? " Create one below to organize curriculum, series or programs." : ""}</p>
        )}
        {edit && <CollectionCreator orgId={org.id} suggested={pres!.collectionKinds} onCreated={reload} onError={(m) => toast({ title: "Could not create", description: m, variant: "destructive" })} />}
      </div>

      {/* Members */}
      <div className="mt-8">
        <SectionTitle icon={Users}>Members</SectionTitle>
        <div className="divide-y divide-border rounded-xl border border-border">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-sans">{m.email}</span>
              {manage && m.role !== "owner" ? (
                <select value={m.role} onChange={async (e) => { try { await setOrgRole(org.id, m.user_id, e.target.value as OrgRole); reload(); } catch (err) { toast({ title: "Could not update", description: err instanceof Error ? err.message : "", variant: "destructive" }); } }} className="field select-premium py-1 text-xs font-sans">
                  {(["admin", "editor", "contributor", "viewer"] as OrgRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground font-sans">{ROLE_LABEL[m.role]}</span>
              )}
              {manage && m.role !== "owner" && (
                <button onClick={async () => { try { await removeOrgMember(org.id, m.user_id); reload(); } catch (err) { toast({ title: "Could not remove", description: err instanceof Error ? err.message : "", variant: "destructive" }); } }} className="text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
        {manage && <InviteRow orgId={org.id} onInvited={() => orgInvitations(org.id).then(setInvites)} onError={(m) => toast({ title: "Could not invite", description: m, variant: "destructive" })} invites={invites} />}
      </div>

      {/* Governance & activity (managers) — Circle 8 */}
      {manage && (
        <div className="mt-8">
          <SectionTitle icon={ShieldCheck}>Governance &amp; activity</SectionTitle>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">No recorded activity yet. Member, role, content and settings changes are logged here for accountability.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {audit.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm font-sans">
                  <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate"><span className="font-medium">{a.actor_email ?? "Someone"}</span> <span className="text-muted-foreground">{ACTION_LABEL[a.action] ?? a.action}</span>{a.detail ? <span className="text-muted-foreground"> · {a.detail}</span> : null}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings (managers) */}
      {manage && <OrgSettings org={org} onSaved={() => { getOrganization(org.slug).then((o) => o && setOrg(o)); reload(); toast({ title: "Saved" }); }} onError={(m) => toast({ title: "Could not save", description: m, variant: "destructive" })} />}
    </div>
  );
};

// ---- sub-components ---------------------------------------------------------

const CollectionCreator = ({ orgId, suggested, onCreated, onError }: { orgId: string; suggested: CollectionKind[]; onCreated: () => void; onError: (m: string) => void }) => {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CollectionKind>(suggested[0] ?? "general");
  const add = async () => {
    if (!name.trim()) return;
    try { await createOrgCollection(orgId, name.trim(), kind); setName(""); onCreated(); }
    catch (e) { onError(e instanceof Error ? e.message : ""); }
  };
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 1 Mathematics" className="flex-1" />
      <select value={kind} onChange={(e) => setKind(e.target.value as CollectionKind)} className="field select-premium font-sans">
        {COLLECTION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>
      <Button variant="heroOutline" size="sm" onClick={add}><FolderPlus className="mr-1 h-4 w-4" /> Add</Button>
    </div>
  );
};

const InviteRow = ({ orgId, invites, onInvited, onError }: { orgId: string; invites: OrgInvite[]; onInvited: () => void; onError: (m: string) => void }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");
  const send = async () => {
    if (!email.trim()) return;
    try { await inviteToOrg(orgId, email.trim(), role); setEmail(""); onInvited(); }
    catch (e) { onError(e instanceof Error ? e.message : ""); }
  };
  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu" type="email" className="flex-1" />
        <select value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className="field select-premium font-sans">
          {(["admin", "editor", "contributor", "viewer"] as OrgRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <Button variant="hero" size="sm" onClick={send}><Mail className="mr-1 h-4 w-4" /> Invite</Button>
      </div>
      {invites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {invites.map((i) => <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-sans"><Mail className="h-3 w-3" /> {i.email} · {ROLE_LABEL[i.role]} · pending</span>)}
        </div>
      )}
    </div>
  );
};

const OrgSettings = ({ org, onSaved, onError }: { org: OrgDetail; onSaved: () => void; onError: (m: string) => void }) => {
  const [name, setName] = useState(org.name);
  const [tagline, setTagline] = useState(org.tagline ?? "");
  const [bio, setBio] = useState(org.bio ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await updateOrganization(org.id, { name, tagline: tagline || null, bio: bio || null, website: website || null }); onSaved(); }
    catch (e) { onError(e instanceof Error ? e.message : ""); }
    finally { setSaving(false); }
  };
  return (
    <div className="mt-8">
      <SectionTitle icon={Settings2}>Organization settings</SectionTitle>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="font-sans text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div className="space-y-1.5"><Label className="font-sans text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.org" /></div>
        </div>
        <div className="space-y-1.5"><Label className="font-sans text-xs">Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="A short institutional tagline" /></div>
        <div className="space-y-1.5"><Label className="font-sans text-xs">About</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={600} placeholder="Describe your organization for its public storefront." /></div>
        <Button variant="hero" size="sm" disabled={saving} onClick={save}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save changes</Button>
      </div>
    </div>
  );
};

export default OrgWorkspace;
