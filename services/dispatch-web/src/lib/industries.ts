// Layer 2 of the SEO ecosystem — Industry Landing Pages. One substantive page per
// institution type, each explaining Sovereign Dispatch in that sector's own
// language: the official publications it issues, the authorities that govern
// them, the sector's specific failure modes, and the frameworks it is assessed
// against. These are NOT thin doorway pages — each is a real reference, written
// to be cited by search engines AND by AI answer engines (Perplexity, ChatGPT,
// Claude, Gemini). The engine scales to 50+; this is the founding set.

export interface Industry {
  slug: string;
  name: string;              // "Government"
  forLabel: string;          // "for Government" (used in titles/URLs reasoning)
  banner: string;            // an existing /banners or /people image slug
  headline: string;          // the sector-specific promise
  intro: string;             // 1–2 sentences, what governed publication means here
  publications: string[];    // the official documents this sector issues
  authorities: string[];     // the offices/roles that govern them
  problems: { t: string; d: string }[]; // sector-specific governance failure modes
  frameworks: string[];      // standards / regulations this sector is held to
  metaTitle: string;
  metaDescription: string;
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "government",
    name: "Government",
    forLabel: "for Government",
    banner: "government",
    headline: "Govern every executive order, regulation and gazette as an Official Record.",
    intro:
      "A government's authority rests on documents that must be provably genuine years after they are issued. Sovereign Dispatch turns each policy, order and notice into a governed, certified, permanently verifiable Official Record — issued under the authority of an office, not an individual.",
    publications: ["Executive Orders", "Regulations & Statutory Instruments", "Official Gazettes", "Policy Directives", "Public Notices", "Ministerial Decisions"],
    authorities: ["Minister", "Permanent Secretary", "Director General", "Legal Counsel", "Government Gazette Office"],
    problems: [
      { t: "Authority that must outlive the official", d: "An order signed today must remain valid when the minister has moved on. Dispatch binds publication to the office, so authority is durable and never tied to a person who can leave." },
      { t: "Gazettes that anyone must be able to trust", d: "A circulating PDF of a regulation cannot prove it is the genuine, current version. Every Dispatch publication carries a permanent Record ID anyone can verify — with no account." },
      { t: "Provenance for every decision", d: "When a policy is challenged, the government must show who approved it, in what order, on what version. The evidence chain is recorded as the record is made, not reconstructed under pressure." },
    ],
    frameworks: ["ISO 27001-aligned controls", "National data-residency requirements", "Public-records retention law", "GDPR-aligned data handling"],
    metaTitle: "Sovereign Dispatch for Government — Govern Executive Orders, Regulations & Gazettes",
    metaDescription: "Turn executive orders, regulations and official gazettes into governed, certified, permanently verifiable Official Records — issued under the authority of an office. Institutional publication infrastructure for government.",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    forLabel: "for Healthcare",
    banner: "healthcare",
    headline: "Issue clinical directives and safety bulletins with governed, provable authority.",
    intro:
      "When a clinical directive or safety bulletin goes out, lives depend on it being the correct, current, authorised version. Sovereign Dispatch governs every health-authority publication through an enforced approval chain and seals it as a permanently verifiable Official Record.",
    publications: ["Clinical Directives", "Patient-Safety Bulletins", "Treatment Protocols", "Health Authority Notices", "Infection-Control Guidance", "Recall & Alert Notices"],
    authorities: ["Hospital Director", "Chief Medical Officer", "Clinical Governance Officer", "Health Authority", "Quality & Safety Office"],
    problems: [
      { t: "The wrong protocol can never circulate", d: "A superseded treatment protocol must not be mistaken for the current one. Dispatch maintains a single authoritative record; revoked and outdated versions cannot pass as official." },
      { t: "Every directive is attributable", d: "Clinical governance demands proof of who authorised a directive and when. Approval is bound to a named office and the exact version, on the record." },
      { t: "Evidence ready for any inspection", d: "When a regulator or coroner asks how a safety bulletin was issued, the complete evidence chain already exists — produced as the record was made." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Clinical-governance frameworks", "Patient-data residency", "Health-records retention"],
    metaTitle: "Sovereign Dispatch for Healthcare — Govern Clinical Directives & Safety Bulletins",
    metaDescription: "Govern clinical directives, patient-safety bulletins and treatment protocols as certified, permanently verifiable Official Records. Attributable approval and a complete evidence chain for health authorities.",
  },
  {
    slug: "universities",
    name: "Universities",
    forLabel: "for Universities",
    banner: "universities",
    headline: "Govern senate decisions, degree regulations and academic policy as Official Records.",
    intro:
      "A university's resolutions, regulations and conferrals are institutional acts that must stand for decades. Sovereign Dispatch governs every senate decision and academic policy through its approval chain and preserves it as a verifiable Official Record.",
    publications: ["Senate & Council Decisions", "Degree Regulations", "Academic Policies", "Examination Regulations", "Research Governance Notices", "Conferral Records"],
    authorities: ["Vice Chancellor", "Registrar", "Academic Secretary", "Senate", "Council Secretariat"],
    problems: [
      { t: "Resolutions that survive every administration", d: "A senate resolution must remain authoritative long after the senate that passed it has changed. Authority belongs to the office and the record, not the sitting members." },
      { t: "Regulations students and employers can trust", d: "Degree and examination regulations are relied upon externally. A verifiable Record ID lets any party confirm the genuine, current version." },
      { t: "Provenance for accreditation and appeal", d: "When an accreditation body or an appeal questions a policy, the approval chain and evidence are already sealed to the record." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Academic-governance frameworks", "Student-data protection", "Research-records retention"],
    metaTitle: "Sovereign Dispatch for Universities — Govern Senate Decisions & Academic Policy",
    metaDescription: "Govern senate decisions, degree regulations and academic policies as certified, permanently verifiable Official Records. Durable institutional authority for universities, registrars and academic secretariats.",
  },
  {
    slug: "justice",
    name: "Justice",
    forLabel: "for Justice & the Courts",
    banner: "justice",
    headline: "Publish judgments, court rules and legal notices with permanent, provable integrity.",
    intro:
      "Judicial authority depends on the certainty that a published judgment or rule is genuine and unaltered. Sovereign Dispatch governs every court publication and seals it with a cryptographic integrity proof anyone can verify.",
    publications: ["Judgments & Rulings", "Court Rules & Practice Directions", "Legal Notices", "Cause Lists", "Sentencing Guidelines", "Registry Notices"],
    authorities: ["Judge", "Court Administrator", "Registrar", "Clerk of Court", "Judicial Council"],
    problems: [
      { t: "A judgment that cannot be altered", d: "An altered or forged judgment undermines the rule of law. Every Dispatch publication carries a SHA-256 integrity proof; a single byte changed will not match." },
      { t: "The authoritative version, always", d: "Practitioners and the public must reach the one official judgment, not a circulating copy. The permanent Record ID resolves to the authoritative record." },
      { t: "An unbroken evidence trail", d: "From issuance to preservation, every act is recorded in an append-only chain — the provenance a court of record requires." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Court-records retention", "Open-justice publication duties", "Data-residency requirements"],
    metaTitle: "Sovereign Dispatch for Justice — Govern Judgments, Court Rules & Legal Notices",
    metaDescription: "Publish judgments, court rules and legal notices as permanently verifiable Official Records with cryptographic integrity proofs. Tamper-evident judicial publication for courts and registries.",
  },
  {
    slug: "regulators",
    name: "Regulators",
    forLabel: "for Regulators",
    banner: "regulators",
    headline: "Issue licences, enforcement decisions and public notices with enforceable authority.",
    intro:
      "A regulator's decisions carry legal weight only if they can be proven genuine, current and properly authorised. Sovereign Dispatch governs every licence, enforcement action and notice as a certified, independently verifiable Official Record.",
    publications: ["Licences & Authorisations", "Enforcement Decisions", "Public Notices", "Regulatory Determinations", "Compliance Directives", "Sanction Notices"],
    authorities: ["Regulatory Commissioner", "Director of Enforcement", "Compliance Officer", "Licensing Authority", "Board Secretariat"],
    problems: [
      { t: "Decisions that hold up under challenge", d: "Enforcement is routinely contested. The governance certificate proves the decision satisfied its approval policy, office by office, in order." },
      { t: "Licences anyone can verify", d: "A licensed party — or the public — must be able to confirm a licence is genuine and unrevoked. Verification is public, by Record ID, with no account." },
      { t: "Revocation that is provable", d: "When an authorisation is withdrawn, verification shows it plainly — a circulating copy can never appear current." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Administrative-law evidentiary standards", "Public-register duties", "Records retention"],
    metaTitle: "Sovereign Dispatch for Regulators — Govern Licences, Enforcement & Public Notices",
    metaDescription: "Issue licences, enforcement decisions and public notices as certified, independently verifiable Official Records. Provable authorisation, public verification and provable revocation for regulators.",
  },
  {
    slug: "financial-institutions",
    name: "Financial Institutions",
    forLabel: "for Banks & Financial Institutions",
    banner: "enterprise",
    headline: "Govern board resolutions, policies and regulatory filings as Official Records.",
    intro:
      "Banks operate under constant scrutiny, where a board resolution or policy must be provably the version that was approved. Sovereign Dispatch governs every institutional decision through an enforced approval chain and seals it for audit and examination.",
    publications: ["Board & Committee Resolutions", "Risk & Compliance Policies", "Regulatory Filings", "Customer Notices", "Capital & Credit Decisions", "Governance Records"],
    authorities: ["Board Chair", "Corporate Secretary", "Chief Compliance Officer", "Chief Risk Officer", "Internal Audit"],
    problems: [
      { t: "Examination-ready evidence, always", d: "When a supervisor examines a decision, the governance certificate and evidence chain already prove who approved it, on what version, in order." },
      { t: "Separation of duties enforced", d: "Approval and publication are reserved to distinct authorities; an approver can never be the publisher — enforced and logged, not assumed." },
      { t: "Policy versions that cannot drift", d: "Only one authoritative version of a policy exists; superseded versions cannot be mistaken for current in a dispute or audit." },
    ],
    frameworks: ["SOC 2-aligned principles", "ISO 27001-aligned controls", "Basel / prudential governance", "Records retention & data residency"],
    metaTitle: "Sovereign Dispatch for Financial Institutions — Govern Board Resolutions & Filings",
    metaDescription: "Govern board resolutions, risk and compliance policies and regulatory filings as certified, examination-ready Official Records. Enforced separation of duties and a complete evidence chain for banks.",
  },
  {
    slug: "insurance",
    name: "Insurance",
    forLabel: "for Insurance",
    banner: "enterprise",
    headline: "Govern policy wordings, regulatory notices and board decisions with provable authority.",
    intro:
      "Insurance rests on the precise, authoritative version of a policy or determination. Sovereign Dispatch governs every wording, notice and decision and seals it as a verifiable Official Record — so the version relied upon is provably the version that was approved.",
    publications: ["Policy Wordings & Endorsements", "Underwriting Guidelines", "Regulatory Notices", "Board & Committee Decisions", "Claims-Governance Directives", "Solvency Filings"],
    authorities: ["Chief Underwriting Officer", "Corporate Secretary", "Chief Compliance Officer", "Appointed Actuary", "Board Risk Committee"],
    problems: [
      { t: "The wording in force is provable", d: "Disputes turn on which version of a wording applied. The permanent Record ID and integrity proof settle which document was authoritative and when." },
      { t: "Decisions ready for the regulator", d: "Conduct and prudential supervisors expect provable governance. The evidence chain is produced as the decision is made." },
      { t: "Attributable, durable authority", d: "Authority belongs to the office, surviving the people who held it — essential for long-tail liabilities." },
    ],
    frameworks: ["SOC 2-aligned principles", "ISO 27001-aligned controls", "Conduct & prudential frameworks", "Records retention"],
    metaTitle: "Sovereign Dispatch for Insurance — Govern Policy Wordings & Regulatory Notices",
    metaDescription: "Govern policy wordings, underwriting guidelines and regulatory notices as certified, permanently verifiable Official Records. Provable version control and governance evidence for insurers.",
  },
  {
    slug: "energy-utilities",
    name: "Energy & Utilities",
    forLabel: "for Energy & Utilities",
    banner: "enterprise",
    headline: "Govern safety directives, tariff decisions and regulatory filings as Official Records.",
    intro:
      "Energy and utility operators issue safety-critical directives and regulated decisions that must be provably authorised. Sovereign Dispatch governs each one through its approval chain and preserves it as a verifiable, tamper-evident Official Record.",
    publications: ["Safety Directives & Bulletins", "Tariff & Pricing Decisions", "Regulatory Filings", "Operational Standards", "Outage & Incident Notices", "Board Resolutions"],
    authorities: ["Chief Operating Officer", "Safety Director", "Regulatory Affairs", "Corporate Secretary", "Board Safety Committee"],
    problems: [
      { t: "Safety directives that are never in doubt", d: "A safety directive must be unambiguously the current, authorised version. One authoritative record; integrity proof against tampering." },
      { t: "Regulated decisions, provably governed", d: "Tariff and licensing decisions are scrutinised. The governance certificate proves the approval policy was satisfied." },
      { t: "Provenance across decades", d: "Infrastructure outlives staff; the record's authority and evidence outlive them too." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Sector safety regulation", "Regulatory-filing standards", "Records retention"],
    metaTitle: "Sovereign Dispatch for Energy & Utilities — Govern Safety Directives & Tariff Decisions",
    metaDescription: "Govern safety directives, tariff decisions and regulatory filings as certified, tamper-evident Official Records. Provable authorisation and durable provenance for energy and utility operators.",
  },
  {
    slug: "defence",
    name: "Defence",
    forLabel: "for Defence",
    banner: "government",
    headline: "Govern directives, doctrine and orders with sovereign control and provable authority.",
    intro:
      "Defence institutions issue directives and doctrine where authenticity, classification and sovereignty are non-negotiable. Sovereign Dispatch governs each publication under classification and clearance controls and preserves it within sovereign boundaries.",
    publications: ["Directives & Orders", "Doctrine & Standing Instructions", "Policy Determinations", "Classified Notices", "Procurement Authorisations", "Board & Council Decisions"],
    authorities: ["Permanent Secretary", "Chief of Staff", "Directorate Heads", "Security Authority", "Records & Archives"],
    problems: [
      { t: "Classification enforced at the core", d: "Documents carry classification; reads and approvals are gated against clearance — isolation by default, not bolted on." },
      { t: "Sovereign by deployment", d: "Records can be held within approved national boundaries, on-premise or air-gapped — sovereignty is a deployment decision." },
      { t: "Authority that cannot be forged", d: "Orders are issued under an office with a provable approval chain; a forged or altered copy cannot verify." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Classification & clearance handling", "Sovereign / air-gapped deployment", "Defence records retention"],
    metaTitle: "Sovereign Dispatch for Defence — Govern Directives, Doctrine & Orders",
    metaDescription: "Govern defence directives, doctrine and orders under classification and clearance controls, preserved within sovereign boundaries. Tamper-evident authority for defence institutions.",
  },
  {
    slug: "municipalities",
    name: "Municipalities",
    forLabel: "for Municipalities & Local Government",
    banner: "government",
    headline: "Govern by-laws, council resolutions and public notices as verifiable Official Records.",
    intro:
      "Local government issues by-laws, resolutions and notices that residents and courts must be able to trust. Sovereign Dispatch governs each one through its approval chain and makes it permanently verifiable by anyone.",
    publications: ["By-laws & Ordinances", "Council Resolutions", "Public Notices", "Planning & Permit Decisions", "Tender Awards", "Local Gazettes"],
    authorities: ["Mayor", "Town Clerk", "Municipal Manager", "Council Secretariat", "Legal Services"],
    problems: [
      { t: "By-laws residents can verify", d: "A by-law or notice must be confirmable as genuine and current. The permanent Record ID makes public verification trivial." },
      { t: "Decisions provably governed", d: "Planning and tender decisions are frequently challenged; the governance certificate proves due process." },
      { t: "Continuity across council terms", d: "Authority belongs to the office and survives every election and staff change." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Local-government records law", "Open-data / transparency duties", "Retention schedules"],
    metaTitle: "Sovereign Dispatch for Municipalities — Govern By-laws, Resolutions & Notices",
    metaDescription: "Govern by-laws, council resolutions and public notices as certified, publicly verifiable Official Records. Provable due process and durable authority for municipalities and local government.",
  },
  {
    slug: "ngos",
    name: "NGOs",
    forLabel: "for NGOs & Non-Profits",
    banner: "enterprise",
    headline: "Govern board resolutions, grant decisions and policies with donor-grade provenance.",
    intro:
      "NGOs answer to donors, regulators and the public, where governance and provenance build trust. Sovereign Dispatch governs every board decision, grant approval and policy as a certified, verifiable Official Record.",
    publications: ["Board & Trustee Resolutions", "Grant & Funding Decisions", "Governance Policies", "Donor & Compliance Reports", "Safeguarding Directives", "Public Statements"],
    authorities: ["Board Chair", "Executive Director", "Company Secretary", "Compliance Officer", "Audit Committee"],
    problems: [
      { t: "Donor and regulator trust, earned", d: "Funders demand evidence of governance. The evidence chain proves how each decision was made, ready for any review." },
      { t: "Grant decisions provably attributable", d: "Who approved a grant, on what basis, is recorded and bound to the office — protecting the organisation in disputes." },
      { t: "Institutional memory preserved", d: "Provenance and authority survive volunteer and staff turnover, common in the sector." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Charity-governance codes", "Donor-reporting standards", "Data protection"],
    metaTitle: "Sovereign Dispatch for NGOs — Govern Board Resolutions & Grant Decisions",
    metaDescription: "Govern board resolutions, grant decisions and governance policies as certified, verifiable Official Records with donor-grade provenance. Institutional trust for NGOs and non-profits.",
  },
  {
    slug: "religious-institutions",
    name: "Religious Institutions",
    forLabel: "for Churches & Religious Institutions",
    banner: "government",
    headline: "Govern doctrinal decisions, canonical records and official statements as Official Records.",
    intro:
      "Religious institutions hold records and decisions that must endure for generations and remain provably authentic. Sovereign Dispatch governs each canonical decision and official statement and preserves it as a permanent, verifiable Official Record.",
    publications: ["Doctrinal & Synod Decisions", "Canonical Records", "Official Statements & Pastoral Letters", "Appointments & Ordinations", "Governance Resolutions", "Property & Trust Records"],
    authorities: ["Presiding Authority", "Synod / Council", "General Secretary", "Registrar", "Trustees"],
    problems: [
      { t: "Records that must endure for generations", d: "Canonical and governance records are kept for the very long term; preservation is sealed and tamper-evident." },
      { t: "Decisions of provable authority", d: "Synod and council decisions carry weight only if genuine; the approval chain and Record ID make them verifiable." },
      { t: "Continuity beyond any leadership", d: "Authority belongs to the office and the institution, surviving every change of leadership." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Long-term preservation", "Trust & property governance", "Data protection"],
    metaTitle: "Sovereign Dispatch for Religious Institutions — Govern Doctrinal & Canonical Records",
    metaDescription: "Govern doctrinal decisions, canonical records and official statements as permanently verifiable Official Records. Generational preservation and provable authority for religious institutions.",
  },
  {
    slug: "museums",
    name: "Museums",
    forLabel: "for Museums & Cultural Institutions",
    banner: "universities",
    headline: "Govern acquisition, provenance and deaccession decisions as Official Records.",
    intro:
      "Museums live and die by provenance. Sovereign Dispatch governs every acquisition, loan and deaccession decision through an approval chain and seals it as a permanent, verifiable record of institutional authority.",
    publications: ["Acquisition Decisions", "Provenance Records", "Deaccession Resolutions", "Loan Agreements & Authorisations", "Conservation Directives", "Board Resolutions"],
    authorities: ["Director", "Chief Curator", "Registrar", "Acquisitions Committee", "Board of Trustees"],
    problems: [
      { t: "Provenance that is itself provable", d: "A museum's provenance records must be trustworthy. Each decision is sealed with an integrity proof and an evidence chain." },
      { t: "Deaccession that withstands scrutiny", d: "Deaccession is contentious; the governance certificate proves the decision satisfied its policy and authority." },
      { t: "Authority across centuries", d: "Records outlive directors and trustees; their authority and provenance outlive them too." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Collections-governance codes", "Provenance & ethics standards", "Long-term preservation"],
    metaTitle: "Sovereign Dispatch for Museums — Govern Acquisition, Provenance & Deaccession",
    metaDescription: "Govern acquisition, provenance and deaccession decisions as certified, permanently verifiable Official Records. Trustworthy provenance and durable authority for museums and cultural institutions.",
  },
  {
    slug: "archives",
    name: "National Archives",
    forLabel: "for Archives & Records Authorities",
    banner: "government",
    headline: "Preserve the nation's records with tamper-evident, permanently verifiable integrity.",
    intro:
      "An archive's mandate is to keep records that can be proven authentic indefinitely. Sovereign Dispatch seals every record with a preservation certificate and a SHA-256 integrity proof, and makes it independently verifiable for its full retention life.",
    publications: ["Preservation Certificates", "Accession Records", "Retention & Disposal Schedules", "Authenticity Determinations", "Access Decisions", "Transfer Records"],
    authorities: ["National Archivist", "Head of Preservation", "Records Authority", "Accessions Office", "Access & Disclosure"],
    problems: [
      { t: "Authenticity provable for decades", d: "A preserved record must be provably unaltered years later. Every record carries a tamper-evident integrity proof anyone can check." },
      { t: "Terminal, immutable preservation", d: "Once archived, a record's state is terminal — no edit, withdrawal or republication is possible." },
      { t: "Verification without an account", d: "Any citizen or researcher can confirm a record is genuine by its permanent identifier." },
    ],
    frameworks: ["ISO 27001-aligned controls", "Archival preservation standards", "Public-records law", "Data residency"],
    metaTitle: "Sovereign Dispatch for Archives — Tamper-Evident Preservation of the Public Record",
    metaDescription: "Preserve records with tamper-evident, permanently verifiable integrity proofs and terminal, immutable preservation. Authenticity that holds for decades for national archives and records authorities.",
  },
  {
    slug: "pharmaceuticals",
    name: "Pharmaceuticals",
    forLabel: "for Pharmaceuticals",
    banner: "healthcare",
    headline: "Govern regulatory submissions, SOPs and safety notices with audit-ready provenance.",
    intro:
      "Pharmaceutical governance is unforgiving: the version of an SOP, submission or safety notice that was approved must be provable. Sovereign Dispatch governs each one through an enforced approval chain and seals it for inspection.",
    publications: ["Standard Operating Procedures", "Regulatory Submissions", "Safety & Recall Notices", "Quality Directives", "Batch-Release Decisions", "Board & Committee Resolutions"],
    authorities: ["Qualified Person", "Head of Quality", "Regulatory Affairs", "Pharmacovigilance Officer", "Site Director"],
    problems: [
      { t: "The approved version is provable", d: "GxP turns on document control. The permanent Record ID and integrity proof establish exactly which version was authorised." },
      { t: "Inspection-ready at all times", d: "When an inspector asks how an SOP or release was approved, the evidence chain already exists, attributable and ordered." },
      { t: "Separation of duties enforced", d: "Approval and release authorities are distinct and logged — assumption is never enough in a regulated environment." },
    ],
    frameworks: ["GxP / GMP document control", "ISO 27001-aligned controls", "Pharmacovigilance standards", "Records retention"],
    metaTitle: "Sovereign Dispatch for Pharmaceuticals — Govern SOPs, Submissions & Safety Notices",
    metaDescription: "Govern SOPs, regulatory submissions and safety notices as certified, inspection-ready Official Records. Provable version control, enforced separation of duties and a complete evidence chain.",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    forLabel: "for Manufacturing",
    banner: "enterprise",
    headline: "Govern quality standards, safety directives and board decisions as Official Records.",
    intro:
      "Manufacturers depend on the precise, authorised version of a standard or directive reaching the floor. Sovereign Dispatch governs every quality standard, safety directive and decision and seals it as a verifiable Official Record.",
    publications: ["Quality Standards & Specifications", "Safety Directives", "Engineering Change Decisions", "Supplier & Compliance Policies", "Recall Notices", "Board Resolutions"],
    authorities: ["Quality Director", "Head of Operations", "Engineering Authority", "Compliance Officer", "Board"],
    problems: [
      { t: "One authoritative specification", d: "A superseded spec on the floor causes defects and recalls. Dispatch keeps a single authoritative version; outdated copies cannot pass as current." },
      { t: "Change decisions provably governed", d: "Engineering and quality changes are auditable; the governance certificate proves who approved them, in order." },
      { t: "Evidence for certification and recall", d: "When a certifier or a recall demands proof, the evidence chain is already there." },
    ],
    frameworks: ["ISO 9001 / quality-management alignment", "ISO 27001-aligned controls", "Product-safety regulation", "Records retention"],
    metaTitle: "Sovereign Dispatch for Manufacturing — Govern Quality Standards & Safety Directives",
    metaDescription: "Govern quality standards, safety directives and engineering-change decisions as certified, verifiable Official Records. One authoritative specification and audit-ready evidence for manufacturers.",
  },
];

export const INDUSTRIES_BASE = "/industries";
export const industryBySlug = (slug?: string): Industry | undefined =>
  INDUSTRIES.find((i) => i.slug === slug);
