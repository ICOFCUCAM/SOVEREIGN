// Sovereign Dispatch — PDF rendering via headless Chromium (Epic 6 / ADR-001).
//
// htmlToPdf(html) → Buffer. Writes the themed HTML (from @dispatch/ddm-schema
// render-html) to a temp file and drives the in-image headless Chromium shell
// with --print-to-pdf, exactly as proven by SPK-A. Chrome furniture (banners,
// running header, page numbers, cover, TOC) comes from the HTML's @page CSS;
// we pass --no-pdf-header-footer so Chromium doesn't add its own.
//
// CHROMIUM_BIN overrides the binary path; otherwise the known in-image shells
// are probed. Throws (with .deterministic=false → transient) if no binary or the
// render fails, so the worker treats it as a retryable fault.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATES = [
  process.env.CHROMIUM_BIN,
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

export function chromiumBinary() {
  return CANDIDATES.find((p) => { try { return existsSync(p); } catch { return false; } }) || null;
}

export function pdfAvailable() {
  return chromiumBinary() !== null;
}

// Normalize Chromium's embedded timestamps so re-renders are byte-identical
// (models the PDF/A timestamp normalization the sealer will apply).
export function normalizePdf(buf) {
  return Buffer.from(buf.toString("latin1").replace(/\/(CreationDate|ModDate)\s*\(D:[^)]*\)/g, "/$1 (D:NORMALIZED)"), "latin1");
}

/**
 * Render print-ready HTML to a PDF Buffer via headless Chromium.
 * @param {string} html
 * @param {{timeoutMs?:number}} [opts]
 * @returns {Buffer}
 */
export function htmlToPdf(html, opts = {}) {
  const bin = chromiumBinary();
  if (!bin) { const e = new Error("no chromium binary available for PDF render"); e.deterministic = false; throw e; }
  const dir = mkdtempSync(join(tmpdir(), "dispatch-pdf-"));
  const htmlPath = join(dir, "doc.html");
  const pdfPath = join(dir, "doc.pdf");
  try {
    writeFileSync(htmlPath, html, "utf8");
    execFileSync(bin, [
      "--headless", "--no-sandbox", "--disable-gpu",
      "--no-pdf-header-footer",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=4000",
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ], { stdio: ["ignore", "ignore", "pipe"], timeout: opts.timeoutMs ?? 60000 });
    const buf = readFileSync(pdfPath);
    if (buf.slice(0, 5).toString() !== "%PDF-") { const e = new Error("chromium produced non-PDF output"); e.deterministic = false; throw e; }
    return buf;
  } catch (e) {
    if (e.deterministic === undefined) e.deterministic = false; // chromium faults are transient
    throw e;
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// Count "/Type /Page" for a quick page estimate (used for ArtifactRef.pages).
export function pdfPageCount(buf) {
  const m = buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : null;
}
