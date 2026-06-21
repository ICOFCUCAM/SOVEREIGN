import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem } from "@/lib/documents";

// Organization model — publishers, schools, NGOs, ministries and companies run
// Polished Pages as an organization rather than a single account. All access is
// through security-definer RPCs that enforce role permissions server-side.

export type OrgType = "publisher" | "school" | "ngo" | "ministry" | "company";
export type OrgRole = "owner" | "admin" | "editor" | "contributor" | "viewer";

export const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "publisher", label: "Publisher" },
  { value: "school", label: "School / District" },
  { value: "ngo", label: "NGO" },
  { value: "ministry", label: "Ministry of Education" },
  { value: "company", label: "Company" },
];

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Owner", admin: "Admin", editor: "Editor", contributor: "Contributor", viewer: "Viewer",
};

export type CollectionKind = "general" | "curriculum" | "publishing" | "program" | "series";
export const COLLECTION_KINDS: { value: CollectionKind; label: string }[] = [
  { value: "general", label: "General" },
  { value: "curriculum", label: "Curriculum" },
  { value: "publishing", label: "Publishing" },
  { value: "program", label: "Program" },
  { value: "series", label: "Series" },
];

// The ordered command-center modules each institution type sees. Each key maps
// to a real, data-backed panel rendered in the workspace.
export type ModuleKey =
  | "catalog" | "pipeline" | "series" | "localization" | "curriculum"
  | "assets" | "programs" | "regions" | "distribution" | "repositories";

// Repository templates — one-click starting points that feel native to the
// institution (a publisher starts a Series; a school starts Grade 1).
export interface RepoTemplate { name: string; kind: CollectionKind; hint: string }

// Per-type presentation — what makes a publisher's workspace feel like a
// publishing house and a school's feel like an educational system. Drives the
// command-center language, accent, modules, and repository templates.
export interface OrgPresentation {
  noun: string;            // "publishing house", "educational system", …
  workspaceLine: string;   // command-center subtitle
  storefrontKicker: string; // storefront eyebrow, e.g. "Publishing house"
  accent: [string, string]; // gradient hsl stops for the institutional banner
  collectionKinds: CollectionKind[]; // suggested repository types
  // ordered focus lenses, each maps to real data the workspace renders
  focus: { key: "catalog" | "localization" | "collections" | "education" | "programs" | "members"; label: string }[];
  modules: ModuleKey[];          // ordered, type-specific command modules
  repoTemplates: RepoTemplate[]; // one-click repositories to get started
}

export const ORG_PRESENTATION: Record<OrgType, OrgPresentation> = {
  publisher: {
    noun: "publishing house",
    workspaceLine: "Run your catalog, editions and distribution from one place.",
    storefrontKicker: "Publishing house",
    accent: ["hsl(265 70% 22%)", "hsl(222 60% 10%)"],
    collectionKinds: ["publishing", "series", "general"],
    focus: [
      { key: "catalog", label: "Publishing catalog" },
      { key: "localization", label: "Editions & localization" },
      { key: "collections", label: "Series & collections" },
      { key: "members", label: "Editorial team" },
    ],
    modules: ["catalog", "pipeline", "series", "localization"],
    repoTemplates: [
      { name: "Front list", kind: "publishing", hint: "Your current catalog" },
      { name: "New series", kind: "series", hint: "A multi-title series" },
      { name: "Imprint", kind: "publishing", hint: "A distinct imprint" },
    ],
  },
  school: {
    noun: "educational system",
    workspaceLine: "Organize curriculum, subjects, assessments and teacher resources.",
    storefrontKicker: "Educational institution",
    accent: ["hsl(199 70% 24%)", "hsl(222 60% 10%)"],
    collectionKinds: ["curriculum", "general", "series"],
    focus: [
      { key: "education", label: "Curriculum & assessments" },
      { key: "collections", label: "Grade & subject collections" },
      { key: "catalog", label: "Published resources" },
      { key: "members", label: "Teachers & staff" },
    ],
    modules: ["curriculum", "assets", "catalog", "localization"],
    repoTemplates: [
      { name: "Grade 1", kind: "curriculum", hint: "Grade-level materials" },
      { name: "Mathematics", kind: "curriculum", hint: "A subject area" },
      { name: "Teacher resources", kind: "general", hint: "Staff materials" },
      { name: "Assessments", kind: "curriculum", hint: "Tests & quizzes" },
    ],
  },
  ngo: {
    noun: "program",
    workspaceLine: "Manage literacy programs, campaigns and multi-language deployments.",
    storefrontKicker: "Non-profit organization",
    accent: ["hsl(160 60% 20%)", "hsl(222 60% 10%)"],
    collectionKinds: ["program", "curriculum", "general"],
    focus: [
      { key: "programs", label: "Programs & campaigns" },
      { key: "localization", label: "Languages & reach" },
      { key: "catalog", label: "Published content" },
      { key: "members", label: "Program team" },
    ],
    modules: ["programs", "regions", "localization", "pipeline"],
    repoTemplates: [
      { name: "Literacy program", kind: "program", hint: "A field program" },
      { name: "Teacher training", kind: "program", hint: "Training resources" },
      { name: "Campaign", kind: "program", hint: "An awareness campaign" },
    ],
  },
  ministry: {
    noun: "educational infrastructure",
    workspaceLine: "Coordinate national curriculum, regional initiatives and languages.",
    storefrontKicker: "Government / ministry",
    accent: ["hsl(222 65% 26%)", "hsl(222 60% 9%)"],
    collectionKinds: ["program", "curriculum", "general"],
    focus: [
      { key: "programs", label: "Initiatives & curriculum" },
      { key: "localization", label: "Languages & regions" },
      { key: "education", label: "Educational assets" },
      { key: "members", label: "Ministry team" },
    ],
    modules: ["programs", "regions", "localization", "distribution"],
    repoTemplates: [
      { name: "National curriculum", kind: "curriculum", hint: "Standard curriculum" },
      { name: "Regional curriculum", kind: "curriculum", hint: "Region-specific" },
      { name: "National program", kind: "program", hint: "A rollout initiative" },
    ],
  },
  company: {
    noun: "company",
    workspaceLine: "Manage your content library, team and storefront.",
    storefrontKicker: "Company",
    accent: ["hsl(28 60% 28%)", "hsl(222 60% 10%)"],
    collectionKinds: ["general", "publishing", "series"],
    focus: [
      { key: "catalog", label: "Content library" },
      { key: "collections", label: "Collections" },
      { key: "localization", label: "Localization" },
      { key: "members", label: "Team" },
    ],
    modules: ["catalog", "repositories", "localization"],
    repoTemplates: [
      { name: "Content library", kind: "general", hint: "General content" },
      { name: "Product series", kind: "series", hint: "A product line" },
    ],
  },
};

// Categories that count as educational assets (schools / ministries).
export const EDUCATIONAL_CATEGORIES = [
  "Educational readers", "Textbooks", "Workbooks", "Classroom packs", "Curriculum", "Teacher resources",
];

// What each role can do (mirrors the server checks; used to gate UI).
export const can = {
  manage: (r?: OrgRole | null) => r === "owner" || r === "admin",
  edit: (r?: OrgRole | null) => r === "owner" || r === "admin" || r === "editor",
  publish: (r?: OrgRole | null) => r === "owner" || r === "admin" || r === "editor",
  delete: (r?: OrgRole | null) => r === "owner",
};

export interface OrgSummary { id: string; slug: string; name: string; type: OrgType; role: OrgRole; verified: boolean; member_count: number }
export interface OrgDetail { id: string; slug: string; name: string; type: OrgType; tagline: string | null; bio: string | null; website: string | null; verified: boolean; my_role: OrgRole | null }
export interface OrgMember { user_id: string; role: OrgRole; email: string; created_at: string }
export interface OrgInvite { id: string; email: string; role: OrgRole; status: string; created_at: string }
export interface OrgAnalytics { works: number; published: number; views: number; downloads: number; members: number; collections: number; translations: number; languages: number }
export interface OrgCollection { id: string; name: string; description: string | null; kind: CollectionKind; item_count: number }
export interface OrgLibraryItem { id: string; kind: string; title: string; preview: string | null; listed: boolean; created_at: string; author_name: string | null }
export interface OrgContentRow { kind: string; total: number; published: number }
export interface OrgCategoryRow { category: string; total: number }
export interface OrgAuditRow { id: string; actor_email: string | null; action: string; detail: string | null; created_at: string }
export interface OrgShowcaseRow { slug: string; name: string; type: OrgType; tagline: string | null; verified: boolean; works: number; languages: number }

type Rpc = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> };
const r = () => supabase as unknown as Rpc;
const rows = <T,>(d: unknown): T[] => (Array.isArray(d) ? d : []) as T[];
const one = <T,>(d: unknown): T | null => (Array.isArray(d) ? (d[0] ?? null) : (d ?? null)) as T | null;
const ok = async (p: Promise<{ error: { message?: string } | null }>, msg: string) => { const { error } = await p; if (error) throw new Error(error.message || msg); };

export async function createOrganization(name: string, type: OrgType): Promise<{ id: string; slug: string }> {
  const { data, error } = await r().rpc("polished_org_create", { p_name: name, p_type: type });
  if (error) throw new Error(error.message || "Could not create the organization.");
  return one<{ id: string; slug: string }>(data)!;
}
export async function myOrganizations(): Promise<OrgSummary[]> {
  const { data, error } = await r().rpc("polished_org_list_mine");
  return error ? [] : rows<OrgSummary>(data);
}
export async function getOrganization(slug: string): Promise<OrgDetail | null> {
  const { data, error } = await r().rpc("polished_org_get", { p_slug: slug });
  return error ? null : one<OrgDetail>(data);
}
export async function updateOrganization(orgId: string, p: { name: string; tagline?: string | null; bio?: string | null; website?: string | null }): Promise<void> {
  await ok(r().rpc("polished_org_update", { p_org: orgId, p_name: p.name, p_tagline: p.tagline ?? null, p_bio: p.bio ?? null, p_website: p.website ?? null }), "Could not update.");
}
export async function orgStorefront(slug: string): Promise<CatalogItem[]> {
  const { data, error } = await r().rpc("polished_org_storefront", { p_slug: slug });
  return error ? [] : rows<CatalogItem>(data);
}
export async function orgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await r().rpc("polished_org_members", { p_org: orgId });
  return error ? [] : rows<OrgMember>(data);
}
export async function orgInvitations(orgId: string): Promise<OrgInvite[]> {
  const { data, error } = await r().rpc("polished_org_invitations", { p_org: orgId });
  return error ? [] : rows<OrgInvite>(data);
}
export async function orgAnalytics(orgId: string): Promise<OrgAnalytics | null> {
  const { data, error } = await r().rpc("polished_org_analytics", { p_org: orgId });
  return error ? null : one<OrgAnalytics>(data);
}
export async function orgCollections(orgId: string): Promise<OrgCollection[]> {
  const { data, error } = await r().rpc("polished_org_collections", { p_org: orgId });
  return error ? [] : rows<OrgCollection>(data);
}
export async function orgLibrary(orgId: string): Promise<OrgLibraryItem[]> {
  const { data, error } = await r().rpc("polished_org_library", { p_org: orgId });
  return error ? [] : rows<OrgLibraryItem>(data);
}
export async function inviteToOrg(orgId: string, email: string, role: OrgRole): Promise<void> {
  await ok(r().rpc("polished_org_invite", { p_org: orgId, p_email: email, p_role: role }), "Could not send invite.");
}
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await r().rpc("polished_org_accept_invite", { p_token: token });
  if (error) throw new Error(error.message || "Could not accept the invitation.");
  return data as string;
}
export async function setOrgRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
  await ok(r().rpc("polished_org_set_role", { p_org: orgId, p_user: userId, p_role: role }), "Could not update role.");
}
export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await ok(r().rpc("polished_org_remove_member", { p_org: orgId, p_user: userId }), "Could not remove member.");
}
export async function setDocumentOrg(docId: string, orgId: string | null): Promise<void> {
  await ok(r().rpc("polished_org_set_document", { p_doc: docId, p_org: orgId }), "Could not move to the organization.");
}
export async function copyDocumentToOrg(docId: string, orgId: string): Promise<string> {
  const { data, error } = await r().rpc("polished_org_copy_document", { p_doc: docId, p_org: orgId });
  if (error) throw new Error(error.message || "Could not copy to the organization.");
  return data as string;
}
export async function addToOrgCollection(collectionId: string, docId: string): Promise<void> {
  await ok(r().rpc("polished_org_collection_add", { p_collection: collectionId, p_doc: docId }), "Could not add to the repository.");
}
export async function createOrgCollection(orgId: string, name: string, kind: CollectionKind = "general", description?: string): Promise<string> {
  const { data, error } = await r().rpc("polished_org_collection_create", { p_org: orgId, p_name: name, p_desc: description ?? null, p_kind: kind });
  if (error) throw new Error(error.message || "Could not create collection.");
  return data as string;
}
export async function orgContent(orgId: string): Promise<OrgContentRow[]> {
  const { data, error } = await r().rpc("polished_org_content", { p_org: orgId });
  return error ? [] : rows<OrgContentRow>(data);
}
export async function orgCategories(orgId: string): Promise<OrgCategoryRow[]> {
  const { data, error } = await r().rpc("polished_org_categories", { p_org: orgId });
  return error ? [] : rows<OrgCategoryRow>(data);
}
export async function orgAudit(orgId: string): Promise<OrgAuditRow[]> {
  const { data, error } = await r().rpc("polished_org_audit", { p_org: orgId });
  return error ? [] : rows<OrgAuditRow>(data);
}
export async function orgShowcase(): Promise<OrgShowcaseRow[]> {
  const { data, error } = await r().rpc("polished_org_showcase");
  return error ? [] : rows<OrgShowcaseRow>(data);
}

export interface OrgTrendRow { period: string; created: number; published: number; editions: number }
export interface OrgTopWork { title: string; kind: string; views: number; downloads: number; listed: boolean }
export interface OrgContribution { email: string; role: OrgRole; works: number; published: number }
export interface OrgLanguageRow { language: string; total: number }
export interface OrgCollectionHealth { id: string; name: string; kind: CollectionKind; items: number; published: number }

export async function orgTrends(orgId: string): Promise<OrgTrendRow[]> {
  const { data, error } = await r().rpc("polished_org_trends", { p_org: orgId });
  return error ? [] : rows<OrgTrendRow>(data);
}
export async function orgTopWorks(orgId: string): Promise<OrgTopWork[]> {
  const { data, error } = await r().rpc("polished_org_top_works", { p_org: orgId });
  return error ? [] : rows<OrgTopWork>(data);
}
export async function orgMemberContributions(orgId: string): Promise<OrgContribution[]> {
  const { data, error } = await r().rpc("polished_org_member_contributions", { p_org: orgId });
  return error ? [] : rows<OrgContribution>(data);
}
export async function orgLanguages(orgId: string): Promise<OrgLanguageRow[]> {
  const { data, error } = await r().rpc("polished_org_languages", { p_org: orgId });
  return error ? [] : rows<OrgLanguageRow>(data);
}
export interface OrgRegionRow { region: string; total: number }
export async function orgRegions(orgId: string): Promise<OrgRegionRow[]> {
  const { data, error } = await r().rpc("polished_org_regions", { p_org: orgId });
  return error ? [] : rows<OrgRegionRow>(data);
}
export async function orgCollectionHealth(orgId: string): Promise<OrgCollectionHealth[]> {
  const { data, error } = await r().rpc("polished_org_collection_health", { p_org: orgId });
  return error ? [] : rows<OrgCollectionHealth>(data);
}

export interface DocOrgInfo { org_id: string; org_slug: string; org_name: string; org_type: OrgType; listed: boolean; collections: string[] }
interface DocOrgRow extends DocOrgInfo { document_id: string }
// A lookup of the creator's own documents → the organization (and repositories)
// they belong to, so the Library can show where each document lives.
export async function documentOrgMap(): Promise<Record<string, DocOrgInfo>> {
  const { data, error } = await r().rpc("polished_doc_orgs");
  if (error) return {};
  const out: Record<string, DocOrgInfo> = {};
  for (const row of rows<DocOrgRow>(data)) {
    out[row.document_id] = { org_id: row.org_id, org_slug: row.org_slug, org_name: row.org_name, org_type: row.org_type, listed: row.listed, collections: row.collections ?? [] };
  }
  return out;
}
