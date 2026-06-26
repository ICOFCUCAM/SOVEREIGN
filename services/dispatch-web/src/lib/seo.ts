import { VALUE } from "./value";

// Per-route <title> + meta description. Centralised so one map drives every page
// (set client-side by <RouteMeta>; helps search engines that render JS and gives
// real browser-tab / bookmark titles). Keep descriptions under ~160 chars.

export interface Meta { title: string; description: string; }

const SUF = " · Sovereign Dispatch";

const STATIC: Record<string, Meta> = {
  "/": {
    title: "Sovereign Dispatch — The Vanguard of Institutional Governance",
    description: "Institutional publication infrastructure — turn documents into governed, certified and permanently verifiable Official Records. Priced by institution, never per seat.",
  },
  "/pricing": { title: "Pricing" + SUF, description: "Priced like institutional infrastructure — never per seat. Evaluation, Institutional, Enterprise and Sovereign deployment." },
  "/procurement": { title: "Evaluation Package" + SUF, description: "A self-serve evaluation dossier — architecture, governance, security, residency and the evaluation path. No sales call required." },
  "/trust": { title: "Trust" + SUF, description: "Your records, your jurisdiction, your exit. How Sovereign Dispatch keeps the institution in control of its data and deployment." },
  "/outcomes": { title: "Outcomes" + SUF, description: "What changes when an institution adopts Sovereign Dispatch — from documents on a shared drive to governed, provable Official Records." },
  "/standard": { title: "The Standard" + SUF, description: "The standard for an Official Publication — governed, certified, preserved and permanently verifiable." },
  "/records": { title: "Records" + SUF, description: "Governed Official Records across government, universities, healthcare, justice, enterprise and regulators." },
  "/journey": { title: "Readiness Journey" + SUF, description: "The readiness path from first evaluation to production deployment of Sovereign Dispatch." },
  "/architecture": { title: "Architecture Overview" + SUF, description: "Technical architecture of Sovereign Dispatch — the governed pipeline, security model, deployment topology and data residency." },
  "/platform": { title: "Platform" + SUF, description: "The Sovereign Dispatch platform — governance, publication, certification and preservation as institutional infrastructure." },
  "/security": { title: "Security" + SUF, description: "Sovereign by design — tenant isolation, classification and clearance, immutable audit and the deployment models institutions require." },
  "/compliance": { title: "Compliance" + SUF, description: "Engineered around the governance frameworks institutions are assessed against — ISO 27001, SOC 2, NIS2, GDPR — with evidence during evaluation." },
  "/evidence": { title: "Evidence" + SUF, description: "Every Official Record carries the proof a copy can never hold — Governance and Preservation certificates and a complete evidence chain." },
  "/developers": { title: "Developers" + SUF, description: "The Sovereign Dispatch developer platform — REST API, webhooks, SDKs and a live endpoint reference. Governance as a service." },
  "/official-record": { title: "What is an Official Record?" + SUF, description: "An Official Record is more than a document — the institution's authoritative, governed, certified and permanently verifiable version of a decision." },
  "/verify": { title: "Verify a Record" + SUF, description: "Verify an Official Record. Confirm any Sovereign Dispatch publication is genuine, unrevoked and untampered — by its permanent Record ID." },
  "/walkthrough": { title: "See a Governed Record" + SUF, description: "Watch a document become an Official Record — draft, governed approval chain, certificates, evidence chain and public verification. An interactive walkthrough." },
};

const DEFAULT = STATIC["/"];

export function metaForPath(path: string): Meta {
  const clean = path.replace(/\/+$/, "") || "/";
  if (STATIC[clean]) return STATIC[clean];
  const m = clean.match(/^\/value\/(.+)$/);
  if (m) {
    const v = VALUE.find((x) => x.slug === m[1]);
    if (v) return { title: v.title + SUF, description: v.teaser };
  }
  if (clean.startsWith("/verify/")) return STATIC["/verify"];
  return DEFAULT;
}
