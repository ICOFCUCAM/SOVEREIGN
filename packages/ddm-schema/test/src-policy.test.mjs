// R-P1-3 — image-src SSRF policy + render-html enforcement.
import { imageSrcAllowed } from "../src/src-policy.mjs";
import { buildLayout } from "../src/engine.mjs";
import { renderHtml } from "../src/render-html.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };
const block = (src, m) => ok(imageSrcAllowed(src).allowed === false, m);
const allow = (src, m) => ok(imageSrcAllowed(src).allowed === true, m);

console.log("== image-src SSRF policy ==");

// default: remote disabled
delete process.env.DISPATCH_ALLOW_REMOTE_IMAGES; delete process.env.DISPATCH_IMAGE_ALLOWLIST;
block("https://example.com/a.png", "default: remote src disabled");
block("file:///etc/passwd", "file:// scheme blocked");
block("ftp://h/x", "non-http(s) scheme blocked");
block("javascript:alert(1)", "javascript: blocked");

// remote enabled → still block SSRF vectors
process.env.DISPATCH_ALLOW_REMOTE_IMAGES = "1";
allow("https://cdn.example.com/logo.png", "remote-on: named host allowed");
block("http://169.254.169.254/latest/meta-data/", "metadata IP blocked");
block("http://127.0.0.1/x", "loopback blocked");
block("http://10.0.0.5/x", "10/8 private blocked");
block("http://192.168.1.1/x", "192.168/16 private blocked");
block("http://172.16.0.1/x", "172.16/12 private blocked");
block("http://100.64.0.1/x", "CGNAT blocked");
block("http://[::1]/x", "IPv6 loopback blocked");
block("http://[fd00::1]/x", "IPv6 unique-local blocked");
block("https://8.8.8.8/x", "bare public IP blocked (no allowlist)");
block("https://user:pass@example.com/x", "credentials-in-url blocked");

// allowlist mode
process.env.DISPATCH_IMAGE_ALLOWLIST = "assets.gov.uk,cdn.acme.com";
allow("https://assets.gov.uk/seal.png", "allowlist: exact host allowed");
allow("https://img.cdn.acme.com/x.png", "allowlist: subdomain allowed");
block("https://evil.com/x.png", "allowlist: other host blocked");
block("http://169.254.169.254/x", "allowlist: metadata still blocked");
delete process.env.DISPATCH_IMAGE_ALLOWLIST; delete process.env.DISPATCH_ALLOW_REMOTE_IMAGES;

// render-html enforcement: a malicious src is NOT emitted as <img>; warns instead
console.log("== render-html SSRF enforcement ==");
const docWith = (src) => ({
  ddmVersion: "1.0", docType: "executive_briefing",
  metadata: { title: "T", date: "2026-05-29", status: "final" },
  classification: { scheme: "none", level: "UNCLASSIFIED" },
  sections: [
    { id: "s1", role: "executive_summary", heading: "S", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x" }] },
    { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "j" }] }] },
    { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "img", type: "image", src, altText: "diagram" }] },
    { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] },
  ],
});
{
  const { html, warnings } = renderHtml(buildLayout(docWith("http://169.254.169.254/latest/meta-data/")));
  ok(!html.includes("169.254.169.254") && !/<img[^>]+src=/.test(html), "metadata src NOT emitted as <img>");
  ok(html.includes('aria-label="diagram"'), "blocked image → accessible placeholder");
  ok(warnings.some((w) => w.code === "IMAGE_SRC_BLOCKED"), "IMAGE_SRC_BLOCKED warning emitted");
}
{
  // with allowlist, a permitted host IS embedded
  process.env.DISPATCH_IMAGE_ALLOWLIST = "assets.gov.uk";
  const { html } = renderHtml(buildLayout(docWith("https://assets.gov.uk/d.png")));
  ok(/<img src="https:\/\/assets\.gov\.uk\/d\.png"/.test(html), "allowlisted src IS embedded as <img>");
  delete process.env.DISPATCH_IMAGE_ALLOWLIST;
}

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
