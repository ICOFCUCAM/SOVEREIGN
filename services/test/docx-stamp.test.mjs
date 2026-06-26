// The in-document verification stamp must reach the DOCX too: render an Official
// Record to .docx and confirm a footer carries the Official Record id + verify URL
// (mirrors the PDF stamp). Renders the real engine pipeline; no API/DB needed.
import { buildLayout, ENGINE_VERSION } from "@dispatch/ddm-schema/engine";
import { renderDocx } from "../shared/src/render-docx.mjs";
import JSZip from "jszip";

let pass = 0; const gaps = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };

const ddm = {
  ddmVersion: "1.0", docType: "executive_briefing",
  metadata: { title: "National Vaccination Policy", date: "2026-06-26", status: "final" },
  classification: { scheme: "none", level: "UNCLASSIFIED" },
  sections: [
    { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
    { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "One." }, { text: "Two." }] }] },
    { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
    { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
  ],
};

const footerText = async (bytes) => {
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).filter((n) => /word\/footer\d*\.xml$/.test(n));
  let text = "";
  for (const n of names) text += await zip.file(n).async("string");
  return { names, text };
};

(async () => {
  const RID = "SD-2026-00004872";
  const lm = buildLayout(ddm, { engineVersion: ENGINE_VERSION });

  console.log("\n── Stamped DOCX ──");
  const stamped = await renderDocx(lm, { publicId: RID, verifyBase: "dispatch.sovereigndo.com" });
  (Buffer.isBuffer(stamped.bytes) && stamped.bytes.slice(0, 2).toString() === "PK") ? ok("renderDocx produces a valid .docx (zip) with the stamp context") : bad("docx invalid", stamped.bytes?.slice(0, 4)?.toString());
  const { names, text } = await footerText(stamped.bytes);
  (names.length > 0) ? ok(`Document has footer part(s): ${names.join(", ")}`) : bad("no footer part", JSON.stringify(Object.keys((await JSZip.loadAsync(stamped.bytes)).files)));
  text.includes(RID) ? ok(`Footer carries the Official Record id (${RID})`) : bad("id missing in footer", text.slice(0, 120));
  text.includes(`verify/${RID}`) ? ok("Footer carries the verification URL") : bad("verify url missing", text.slice(0, 200));
  text.includes("OFFICIAL RECORD") ? ok("Footer labels it an OFFICIAL RECORD") : bad("label missing", text.slice(0, 120));

  console.log("\n── Unstamped DOCX (no id) is unchanged / valid ──");
  const plain = await renderDocx(lm, {});
  const plainFooter = await footerText(plain.bytes);
  (Buffer.isBuffer(plain.bytes) && !plainFooter.text.includes("OFFICIAL RECORD") ) ? ok("Without an id, no stamp is added (backward compatible)") : bad("plain stamped unexpectedly", plainFooter.text.slice(0, 120));

  console.log(`\n════ DOCX STAMP: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
  process.exit(gaps.length ? 1 : 0);
})().catch((e) => { console.error("ERROR:", e); process.exit(2); });
