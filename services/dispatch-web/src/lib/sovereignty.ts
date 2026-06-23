// Sovereignty posture — the institutional trust surface. Every value here is a
// PROVABLE property of the deployment (residency, encryption, isolation, audit)
// or is honestly badged as "configurable" (set per engagement) or "architected"
// (control-aligned, not yet independently certified). Nothing here is a fabricated
// metric. The shape is tenant-ready: getSovereignty(tenantId) can later resolve
// per-deployment metadata from the API without changing any consumer.

export type SovBasis = "active" | "configurable" | "architected";

export interface SovItem {
  label: string;
  value: string;
  basis: SovBasis;
  note?: string;
}
export interface SovSection {
  title: string;
  kicker: string;
  items: SovItem[];
}

export const BASIS_LABEL: Record<SovBasis, string> = {
  active: "Active",
  configurable: "Configurable",
  architected: "Architected for",
};

// AWS region → human residency. The live deployment runs in eu-west-1.
const REGION_RESIDENCY: Record<string, string> = {
  "eu-west-1": "European Union · Ireland (eu-west-1)",
  "eu-central-1": "European Union · Frankfurt (eu-central-1)",
  "eu-north-1": "European Union · Stockholm (eu-north-1)",
};

export interface SovereigntyProfile {
  residencyRegion: string;
  sections: SovSection[];
}

// Default platform profile. `region` defaults to the live deployment region but
// is an argument so a tenant-specific profile can override it.
export function getSovereignty(region = "eu-west-1"): SovereigntyProfile {
  const residency = REGION_RESIDENCY[region] ?? `Region ${region}`;
  return {
    residencyRegion: residency,
    sections: [
      {
        kicker: "Locality",
        title: "Data & Residency",
        items: [
          { label: "Data residency", value: residency, basis: "active", note: "Dedicated regional database; relocatable per deployment." },
          { label: "Storage isolation", value: "Dedicated PostgreSQL 17", basis: "active", note: "Independent of any other platform or tenant." },
          { label: "Tenant isolation", value: "Row-level security · deny-by-default", basis: "active", note: "A missing tenant claim denies — never allow-all." },
          { label: "Deployment model", value: "Managed cloud", basis: "configurable", note: "Private cloud, on-premise and air-gapped available per engagement." },
        ],
      },
      {
        kicker: "Integrity",
        title: "Cryptography & Records",
        items: [
          { label: "Encryption at rest", value: "AES-256", basis: "active" },
          { label: "Encryption in transit", value: "TLS 1.2+", basis: "active" },
          { label: "Audit trail", value: "Append-only · SHA-256 hashed", basis: "active", note: "Every submission, decision and publish is recorded and read-only." },
          { label: "Record immutability", value: "Versioned · hash-stamped artifacts", basis: "active", note: "Published artefacts are never silently altered." },
        ],
      },
      {
        kicker: "Identity",
        title: "Access & Authority",
        items: [
          { label: "Authentication", value: "OAuth2 client-credentials", basis: "active", note: "Short-lived, scoped JWTs held in memory only." },
          { label: "Authorization", value: "Scoped tokens · least privilege", basis: "active" },
          { label: "Separation of duties", value: "Submitter ≠ approver — enforced", basis: "active" },
          { label: "Clearance enforcement", value: "Per-scheme classification gating", basis: "configurable", note: "Enabled per deployment for classified estates." },
        ],
      },
      {
        kicker: "Assurance",
        title: "Governance & Compliance",
        items: [
          { label: "Approval policy", value: "N-eyes, per document type", basis: "active" },
          { label: "Retention", value: "Policy-driven, per type", basis: "configurable", note: "Retention horizon set per institution and classification." },
          { label: "Compliance posture", value: "ISO 27001 · SOC 2 · GDPR · NIS2", basis: "architected", note: "Control-aligned architecture; certification scoped per deployment." },
          { label: "Accessibility", value: "WCAG 2.1 AA", basis: "architected", note: "Design target for the operator console." },
        ],
      },
    ],
  };
}
