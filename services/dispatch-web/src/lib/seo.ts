import { VALUE } from "./value";
import { industryBySlug } from "./industries";
import { problemBySlug } from "./problems";
import { articleBySlug } from "./library";
import { docBySlug } from "./docs";
import { conceptTranslation } from "./translations";

// Per-route <title> + meta description. Centralised so one map drives every page
// (set client-side by <RouteMeta>; helps search engines that render JS and gives
// real browser-tab / bookmark titles). Keep descriptions under ~160 chars.

export interface Meta { title: string; description: string; }

const SUF = " · Sovereign Dispatch";

const STATIC: Record<string, Meta> = {
  "/": {
    title: "Sovereign Dispatch — The Vanguard of Institutional Governance",
    description: "Institutional trust infrastructure — turn documents into governed, certified and permanently verifiable Official Records. Priced by institution, never per seat.",
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
  "/cost-of-publication": { title: "The Cost of an Official Publication" + SUF, description: "Why Dispatch exists — an official publication is the output of a long, fragmented, costly institutional process. See it honestly, then unified into one governed record." },
  "/lifecycle": { title: "The Governed Lifecycle" + SUF, description: "Exactly what you are buying — eight governed stages, each showing who participates, the decisions made, the evidence generated and the risks prevented." },
  "/roi": { title: "Operational Model Estimator" + SUF, description: "Model the scale of governed publication from your own figures. Illustrative only — Dispatch governs the process; it never promises savings." },
  "/industries": { title: "Industries — Built for Every Institution" + SUF, description: "Sovereign Dispatch governs official publication across government, healthcare, justice, regulators, finance, defence, archives and more. Find your institution." },
  "/learn": { title: "Knowledge — Official Publication, Governance & Proof" + SUF, description: "Authoritative references on official publication, document governance, evidence chains, cryptographic sealing and verification — what they mean, why they matter, and how institutions prove them." },
  "/library": { title: "Knowledge Library — Guides to Governed Publication" + SUF, description: "In-depth guides on official records, document governance, evidence, digital preservation and compliance — the authoritative reference for institutional publication." },
  "/docs": { title: "Developer Documentation — Dispatch Platform API" + SUF, description: "Build governed, verifiable publication into your systems. Authentication, the documents API, verification, webhooks, SDKs, architecture and schemas for the Dispatch Platform API." },
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
  const ind = clean.match(/^\/industries\/(.+)$/);
  if (ind) {
    const x = industryBySlug(ind[1]);
    if (x) return { title: x.metaTitle, description: x.metaDescription };
  }
  const lp = clean.match(/^\/learn\/(.+)$/);
  if (lp) {
    const x = problemBySlug(lp[1]);
    if (x) return { title: x.metaTitle, description: x.metaDescription };
  }
  // localized concept page — /fr/learn/:slug → French meta when a translation exists
  const llp = clean.match(/^\/([a-z]{2})\/learn\/(.+)$/);
  if (llp) {
    const tr = conceptTranslation(llp[1], llp[2]);
    if (tr) return { title: tr.metaTitle + SUF, description: tr.metaDescription };
    const x = problemBySlug(llp[2]);
    if (x) return { title: x.metaTitle, description: x.metaDescription };
  }
  const ar = clean.match(/^\/library\/(.+)$/);
  if (ar) {
    const x = articleBySlug(ar[1]);
    if (x) return { title: x.metaTitle + SUF, description: x.metaDescription };
  }
  const dc = clean.match(/^\/docs\/(.+)$/);
  if (dc) {
    const x = docBySlug(dc[1]);
    if (x) return { title: x.metaTitle + SUF, description: x.summary };
  }
  if (clean.startsWith("/verify/")) return STATIC["/verify"];
  return DEFAULT;
}
