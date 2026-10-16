import { useCallback, useEffect, useState } from "react";
import { getGovernance, getUsers, getGovernancePolicies, getSsoConnection, listClients, type Department, type GovRole, type GovGrant, type Person, type GovernancePolicy, type SsoConnection, type ServiceClient } from "./api";

// How far the institution is set up, read from its live configuration (never from a tick box). The
// Welcome page shows it, and a new institution's first sign-in opens the Welcome until the ESSENTIALS are
// in place: the institution's structure (departments and offices), its approval rules, and its people in
// their offices. Sign-in for people, connected systems and the plan are shown too, but none of them holds
// the Welcome open.

export interface InstitutionConfig {
  departments: Department[]; roles: GovRole[]; grants: GovGrant[]; people: Person[];
  policies: GovernancePolicy[]; sso: SsoConnection | null; clients: ServiceClient[];
}

export type StepId = "structure" | "rules" | "people" | "signin" | "systems" | "plan";
export interface ReadinessStep { id: StepId; done: boolean; essential: boolean; detail: string }
export interface Readiness { steps: ReadinessStep[]; essentialsDone: boolean; doneCount: number }

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export function computeReadiness(c: InstitutionConfig, paidPlan: boolean): Readiness {
  const appointed = c.grants.filter((g) => g.subject.startsWith("user:")).length;
  const rules = c.policies.filter((p) => Array.isArray(p.reviewChain) && p.reviewChain.some((s) => s.role)).length;
  const canSignIn = c.people.filter((p) => p.signIn?.password).length;
  const invited = c.people.filter((p) => !p.signIn?.password && p.signIn?.invitationExpiresAt).length;
  const systems = c.clients.filter((x) => x.active).length;
  const steps: ReadinessStep[] = [
    { id: "structure", essential: true, done: c.departments.length > 0 && c.roles.length > 0,
      detail: `${plural(c.departments.length, "department")} · ${plural(c.roles.length, "office")}` },
    { id: "rules", essential: true, done: rules > 0, detail: rules ? `${plural(rules, "record type")} governed` : "No approval rules yet" },
    { id: "people", essential: true, done: c.people.length > 0 && appointed > 0,
      detail: `${plural(c.people.length, "person", "people")} · ${plural(appointed, "appointment")}` },
    { id: "signin", essential: false, done: !!c.sso?.enabled || canSignIn > 0,
      detail: c.sso?.enabled ? `Your identity provider for @${c.sso.emailDomain}` : canSignIn || invited ? `${canSignIn} signed in · ${invited} invited` : "No one invited yet" },
    { id: "systems", essential: false, done: systems > 1, detail: plural(systems, "active key") },
    { id: "plan", essential: false, done: paidPlan, detail: paidPlan ? "Subscription active" : "Evaluation" },
  ];
  return { steps, essentialsDone: steps.filter((s) => s.essential).every((s) => s.done), doneCount: steps.filter((s) => s.done).length };
}

export async function loadInstitutionConfig(): Promise<InstitutionConfig> {
  const [g, u, p, s, k] = await Promise.all([
    getGovernance(), getUsers(), getGovernancePolicies(),
    getSsoConnection().catch(() => ({ connection: null })), listClients().catch(() => ({ clients: [] as ServiceClient[] })),
  ]);
  return { departments: g.departments ?? [], roles: g.roles, grants: g.grants, people: u.users, policies: p.policies, sso: s.connection, clients: k.clients };
}

/** The live configuration; `null` while loading, and `error` when it could not be read. */
export function useInstitutionConfig(): { config: InstitutionConfig | null; error: boolean; reload: () => void } {
  const [config, setConfig] = useState<InstitutionConfig | null>(null);
  const [error, setError] = useState(false);
  const reload = useCallback(() => { loadInstitutionConfig().then((c) => { setConfig(c); setError(false); }).catch(() => setError(true)); }, []);
  useEffect(reload, [reload]);
  return { config, error, reload };
}

// The first route a session opens, for an administrator whose institution still lacks the essentials, is
// the Welcome. Once per session: the administrator can then go anywhere. Held in memory, like the session.
const welcomed = new Set<string>();
export function takeFirstEntry(token: string): boolean {
  if (welcomed.has(token)) return false;
  welcomed.add(token);
  return true;
}
