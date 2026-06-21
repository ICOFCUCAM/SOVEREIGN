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
export interface OrgAnalytics { works: number; published: number; views: number; downloads: number; members: number; collections: number }
export interface OrgCollection { id: string; name: string; description: string | null; item_count: number }
export interface OrgLibraryItem { id: string; kind: string; title: string; preview: string | null; listed: boolean; created_at: string; author_name: string | null }

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
export async function createOrgCollection(orgId: string, name: string, description?: string): Promise<string> {
  const { data, error } = await r().rpc("polished_org_collection_create", { p_org: orgId, p_name: name, p_desc: description ?? null });
  if (error) throw new Error(error.message || "Could not create collection.");
  return data as string;
}
