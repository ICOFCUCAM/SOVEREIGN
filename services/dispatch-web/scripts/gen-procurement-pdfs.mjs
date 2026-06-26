import { chromium } from "playwright";

const OUT = "/home/user/SOVEREIGN/services/dispatch-web/public/procurement/";

// Shared institutional print stylesheet — a light, formal procurement document:
// serif headings, restrained gold rule, generous margins. No web fonts (offline).
const css = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.5; }
  .doc { padding: 0; }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; color: #11151c; }
  .cover { padding: 26mm 22mm 0; }
  .mark { display:flex; align-items:center; gap:9px; }
  .mark svg { width: 26px; height: 26px; }
  .mark .name { font-weight: 800; letter-spacing: .02em; font-size: 12pt; }
  .mark .name .g { color: #9a7b27; }
  .eyebrow { margin-top: 34mm; font-size: 8.5pt; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: #9a7b27; }
  h1 { margin: 8px 0 0; font-size: 30pt; line-height: 1.05; letter-spacing: -.01em; }
  .lede { margin-top: 12px; max-width: 150mm; font-size: 11.5pt; color: #3a3f48; }
  .meta { margin-top: 16mm; display:flex; gap: 14mm; font-size: 8.5pt; color: #555; border-top: 1px solid #e4e4e4; padding-top: 8px; }
  .meta b { display:block; color:#11151c; font-size: 9pt; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 2px; }
  .body { padding: 16mm 22mm 24mm; }
  h2 { font-size: 15pt; margin: 0 0 4px; padding-top: 10mm; }
  .rule { height: 2px; width: 38px; background: #c8a24b; margin: 0 0 10px; }
  h3 { font-size: 11pt; margin: 7mm 0 2mm; }
  p { margin: 0 0 8px; }
  ul { margin: 4px 0 8px; padding-left: 18px; }
  li { margin: 3px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 10mm; margin: 4mm 0; }
  .card { border: 1px solid #e2e2e2; border-radius: 6px; padding: 5mm 6mm; }
  .card .t { font-weight: 700; font-size: 10pt; color:#11151c; }
  .card p { font-size: 9.5pt; color:#454a52; margin: 3px 0 0; }
  table { width: 100%; border-collapse: collapse; margin: 4mm 0; font-size: 9.5pt; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e6e6e6; vertical-align: top; }
  th { background: #faf7ef; color:#5c4e23; font-size: 8.5pt; letter-spacing: .04em; text-transform: uppercase; }
  ol.steps { counter-reset: s; list-style: none; padding-left: 0; }
  ol.steps > li { counter-increment: s; position: relative; padding-left: 12mm; margin: 4mm 0; }
  ol.steps > li::before { content: counter(s, decimal-leading-zero); position: absolute; left: 0; top: 0; font-family: Georgia, serif; font-weight: 700; color:#9a7b27; font-size: 11pt; }
  ol.steps .t { font-weight: 700; }
  .note { background:#faf7ef; border:1px solid #ecdfbf; border-radius:6px; padding:5mm 6mm; font-size:9.5pt; color:#5c4e23; margin:5mm 0; }
  .foot { position: fixed; bottom: 8mm; left: 22mm; right: 22mm; display:flex; justify-content: space-between; font-size: 7.5pt; color:#9aa0a8; border-top:1px solid #ececec; padding-top:4px; }
  .check li { list-style: none; }
  ul.check { padding-left: 0; }
  ul.check li { padding-left: 20px; position: relative; }
  ul.check li::before { content: "\\2713"; position:absolute; left:0; color:#2e7d4f; font-weight:700; }
  a { color:#9a7b27; text-decoration: none; }
`;

const markSvg = `<svg viewBox="0 0 32 32" fill="none"><path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="#9a7b27" stroke-width="1.6"/><path d="M16 9v9m-4-5l4-4 4 4" stroke="#9a7b27" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const page = ({ eyebrow, title, lede, version, body }) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="doc">
  <div class="cover">
    <div class="mark">${markSvg}<span class="name">SOVEREIGN <span class="g">DISPATCH</span></span></div>
    <div class="eyebrow">${eyebrow}</div>
    <h1>${title}</h1>
    <p class="lede">${lede}</p>
    <div class="meta">
      <div><b>Document</b>${eyebrow}</div>
      <div><b>Version</b>${version}</div>
      <div><b>Audience</b>Procurement &amp; technical evaluation</div>
      <div><b>Distribution</b>Public — no NDA required</div>
    </div>
  </div>
  <div class="body">${body}</div>
  <div class="foot"><span>Sovereign Dispatch — Institutional Publication Infrastructure</span><span>dispatch.sovereigndo.com</span></div>
</div></body></html>`;

const card = (t, p) => `<div class="card"><div class="t">${t}</div><p>${p}</p></div>`;

// ── Document 1 — Procurement Overview & FAQ ───────────────────────────────────
const overview = page({
  eyebrow: "Procurement Overview",
  title: "Sovereign Dispatch — Procurement Overview",
  lede: "Sovereign Dispatch is institutional publication infrastructure: it turns documents into governed, certified and permanently verifiable Official Records. This overview gives a procurement and technical evaluation team what it needs to assess the platform without a sales call.",
  version: "2026.06",
  body: `
    <h2>What it is</h2><div class="rule"></div>
    <p>An institution does not pay to create a document — it pays for everything that makes a document <b>official</b>: the people, the reviews, the approvals, the authority, the preservation and the proof. Sovereign Dispatch unifies, governs, certifies and preserves that entire process on one platform, and makes every published record independently verifiable.</p>
    <div class="grid">
      ${card("Governed workflow", "Draft, review, approval and authorization in one policy-enforced pipeline. Nothing skips a step.")}
      ${card("Permanent Official Record", "Each publication receives a permanent Record ID and a hash-stamped artefact, never reused.")}
      ${card("Certificates &amp; evidence", "A Governance Certificate, a Preservation Certificate and an append-only evidence chain travel with every record.")}
      ${card("Independent verification", "Anyone holding a copy can confirm it is genuine, unrevoked and untampered — with no account.")}
    </div>

    <h2>Deployment models</h2><div class="rule"></div>
    <table><tr><th>Model</th><th>Summary</th></tr>
      <tr><td>Cloud</td><td>Managed deployment for rapid adoption.</td></tr>
      <tr><td>Private Cloud</td><td>Dedicated institutional environment.</td></tr>
      <tr><td>Sovereign Hosting</td><td>Hosted within approved national or regional boundaries.</td></tr>
      <tr><td>On-Premise</td><td>For institutions requiring local control.</td></tr>
      <tr><td>Air-Gapped</td><td>Architecture designed to support isolated deployments; availability subject to engagement scope.</td></tr>
    </table>

    <h2>Security &amp; sovereignty</h2><div class="rule"></div>
    <ul>
      <li><b>Tenant isolation</b> — row-level security on every table; a missing tenant claim denies by default.</li>
      <li><b>Encryption</b> — AES-256 at rest; TLS 1.2+ in transit.</li>
      <li><b>Authentication</b> — OAuth2 client-credentials issuing short-lived, scoped tokens; identity/SSO integration during deployment.</li>
      <li><b>Least privilege</b> — author, reviewer, approver, publisher, auditor; each scoped to exactly its actions.</li>
      <li><b>Immutable audit</b> — append-only, SHA-256-hashed trail of every submission, decision and publish.</li>
      <li><b>Data residency</b> — determined by deployment model; specific regions and retention terms agreed per institution.</li>
    </ul>

    <h2>Pricing</h2><div class="rule"></div>
    <p>Priced like institutional infrastructure — by institution and capability, <b>never per seat</b>. Concrete figures for the self-serve tiers are published openly; Enterprise and Sovereign deployments are scoped per engagement. See the public pricing page.</p>

    <h2>Procurement FAQ</h2><div class="rule"></div>
    <h3>Do we need a sales call to evaluate?</h3><p>No. The evaluation dossier is self-serve and you can begin a free evaluation in your own environment.</p>
    <h3>Can we evaluate in our own environment?</h3><p>Yes — managed cloud, private cloud, sovereign hosting, on-premise and air-gapped deployments are supported.</p>
    <h3>How is it priced?</h3><p>By institution and capability, never per seat. Self-serve tier prices are public.</p>
    <h3>Where does our data live?</h3><p>Residency is a deployment decision agreed per institution. Dispatch runs against its own dedicated database.</p>
    <h3>How do users authenticate?</h3><p>OAuth2 client-credentials with short-lived, scoped tokens. Identity and SSO integration is arranged during deployment planning.</p>
    <h3>Can it integrate with our existing systems?</h3><p>Yes — ERP, case-management and document systems integrate through the Dispatch API.</p>
    <h3>What can we verify independently?</h3><p>Any published record, through the public verification portal, with no account.</p>

    <div class="note">This document uses verifiable language. It asserts no certifications, SLAs, uptime figures or guarantees; those are defined per agreement during evaluation.</div>
  `,
});

// ── Document 2 — Evaluation Guide ─────────────────────────────────────────────
const evaluation = page({
  eyebrow: "Evaluation Guide",
  title: "How to Evaluate Sovereign Dispatch",
  lede: "A predictable path from first review to a production decision, designed to reduce procurement uncertainty. Every step can begin without contacting sales.",
  version: "2026.06",
  body: `
    <h2>The evaluation path</h2><div class="rule"></div>
    <ol class="steps">
      <li><span class="t">Self-serve review.</span> Read the procurement dossier and architecture overview. Open the interactive lifecycle to see exactly what a governed publication involves.</li>
      <li><span class="t">Free evaluation environment.</span> Create an account and produce a record end to end. Evaluation records carry a clearly-marked EVAL- identifier and are never mistaken for official.</li>
      <li><span class="t">Technical review.</span> Assess architecture, security, identity, data residency and integration against your requirements.</li>
      <li><span class="t">Pilot deployment.</span> Run a scoped environment against real document types and approval policies.</li>
      <li><span class="t">Security &amp; procurement review.</span> Confirm controls, residency, audit evidence and commercial terms.</li>
      <li><span class="t">Production rollout.</span> Phase the platform into operations.</li>
    </ol>

    <h2>What to test in a pilot</h2><div class="rule"></div>
    <div class="grid">
      ${card("Your approval policies", "Model a real document type and its chain of authority; confirm separation of duties is enforced.")}
      ${card("Your roles", "Map your offices to author, reviewer, approver, publisher and auditor.")}
      ${card("Publication &amp; certificates", "Publish a record; inspect its Record ID, Governance and Preservation certificates and evidence chain.")}
      ${card("Independent verification", "Verify a published record, then alter a copy and confirm the integrity check fails.")}
      ${card("Integration", "Exercise the API against an existing system (ERP, case or document management).")}
      ${card("Residency &amp; deployment", "Confirm the deployment model and data-residency posture your mandate requires.")}
    </div>

    <h2>Evaluation checklist</h2><div class="rule"></div>
    <ul class="check">
      <li>A document moves through its full governed lifecycle without bypassing governance.</li>
      <li>Approvals are attributable to named offices and bound to an exact version.</li>
      <li>Every published record carries a permanent Record ID and integrity hash.</li>
      <li>Governance and Preservation certificates are present and inspectable.</li>
      <li>The evidence chain is append-only and timestamped.</li>
      <li>A tampered copy fails verification; a genuine copy passes.</li>
      <li>Identity, SSO, residency and deployment satisfy your requirements.</li>
      <li>The API integrates with your existing systems.</li>
    </ul>

    <div class="note">Evaluation environments are watermarked. Records produced during evaluation use the EVAL- namespace and verify publicly as <b>not</b> official, so they can never be passed off as genuine institutional records.</div>
  `,
});

// ── Document 3 — Security & Architecture Summary ──────────────────────────────
const security = page({
  eyebrow: "Security & Architecture Summary",
  title: "Security & Architecture Summary",
  lede: "A concise reference for security and architecture reviewers: the governed pipeline, the security model, deployment topology and data-residency posture.",
  version: "2026.06",
  body: `
    <h2>The governed pipeline</h2><div class="rule"></div>
    <p>A submission becomes an Official Record through an enforced sequence: <b>Create → Review → Approve → Authorize → Publish → Certify → Verify → Preserve</b>. The approval policy is resolved per document type and classification; nothing reaches publication without satisfying it.</p>

    <h2>Security model</h2><div class="rule"></div>
    <table><tr><th>Control</th><th>Detail</th></tr>
      <tr><td>Tenant isolation</td><td>Row-level security on every table; a missing tenant claim denies by default.</td></tr>
      <tr><td>Encryption</td><td>AES-256 at rest; TLS 1.2+ in transit.</td></tr>
      <tr><td>Authentication</td><td>OAuth2 client-credentials; short-lived, scoped tokens. Identity/SSO integration during deployment.</td></tr>
      <tr><td>Authorization</td><td>Least-privilege scopes — author, reviewer, approver, publisher, auditor, administrator.</td></tr>
      <tr><td>Separation of duties</td><td>A submitter cannot approve their own document; enforced and logged.</td></tr>
      <tr><td>Immutable audit</td><td>Append-only, SHA-256-hashed trail of every submission, decision and publish.</td></tr>
      <tr><td>Classification</td><td>Documents carry visible classification; reads are gated against clearance where enabled.</td></tr>
      <tr><td>Integrity</td><td>Published artefacts are hash-stamped; any byte change is detectable on verification.</td></tr>
    </table>

    <h2>Deployment &amp; residency</h2><div class="rule"></div>
    <p>The same governed pipeline is delivered into the operating model the institution's mandate requires — cloud, private cloud, sovereign hosting, on-premise or air-gapped. Dispatch runs against its own dedicated database, independent of any other platform. Residency follows the deployment model; specific regions, data handling and retention terms are agreed per institution.</p>

    <h2>Verification &amp; preservation</h2><div class="rule"></div>
    <ul>
      <li><b>Governance Certificate</b> — proof the approval chain was satisfied, office by office, in order.</li>
      <li><b>Preservation Certificate</b> — the retention horizon and a tamper-evident integrity hash.</li>
      <li><b>Evidence chain</b> — every action, timestamped and append-only.</li>
      <li><b>Public verification</b> — any record confirmed genuine, unrevoked and untampered by its Record ID, with no account.</li>
    </ul>

    <div class="note">This summary asserts no third-party certifications. Security documentation and architecture-review materials are available to qualified institutions during evaluation.</div>
  `,
});

const docs = [
  ["sovereign-dispatch-procurement-overview.pdf", overview],
  ["sovereign-dispatch-evaluation-guide.pdf", evaluation],
  ["sovereign-dispatch-security-architecture-summary.pdf", security],
];

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [file, html] of docs) {
  const p = await b.newPage();
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.pdf({
    path: OUT + file, format: "A4", printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" },
    displayHeaderFooter: false,
  });
  await p.close();
  console.log("wrote", file);
}
await b.close();
console.log("done");
