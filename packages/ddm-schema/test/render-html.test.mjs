// HTML renderer tests (Epic 6 input). LM → print-ready HTML, presentation only.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildLayout } from "../src/engine.mjs";
import { renderHtml } from "../src/render-html.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(__dir, "..", "fixtures", "valid", f), "utf8")).document;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

console.log("== HTML renderer (Epic 6) ==");
const lm = buildLayout(load("V2-full-exec-briefing.json"));
const { html, warnings } = renderHtml(lm);

ok(html.startsWith("<!doctype html>"), "valid HTML document");
ok(html.includes("@page"), "print @page CSS present");
ok(/counter\(page\)/.test(html), "page-number counter in footer");
ok(html.includes('class="cover"') && html.includes("Regional Stability Brief"), "cover with title");
ok(html.includes('class="toc"'), "TOC nav present");
ok(/<h2 class="sec"[^>]*><span class="secnum">1<\/span>/.test(html), "numbered section heading (1)");
ok(html.includes("Appendix A"), "appendix lettered A");
ok(html.includes("<table>") && html.includes("<th"), "native HTML table");
ok(html.includes("<svg"), "chart rendered as inline SVG");
ok(/<sup[^>]*>\[1\]<\/sup>/.test(html), "citation marker [1] present");
ok(html.includes("<section class=\"sources body\">") && /<li value="1">/.test(html), "sources section with numbered entry");
ok(html.includes('class="callout recommendation"'), "recommendation callout styled");
ok(html.includes("kpis") && html.includes("Readiness"), "kpi block rendered");
ok(!/<script/i.test(html), "no script tags (safe output)");

// determinism
const h2 = renderHtml(buildLayout(load("V2-full-exec-briefing.json"))).html;
ok(h2 === html, "deterministic HTML output");

// XSS-safety: malicious text is escaped, not injected
const evil = load("V2-full-exec-briefing.json");
evil.sections[0].blocks[0].text = "<script>alert(1)</script> & <b>x</b>";
const eh = renderHtml(buildLayout(evil)).html;
ok(!eh.includes("<script>alert(1)</script>") && eh.includes("&lt;script&gt;"), "DDM text is HTML-escaped (no injection)");

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
