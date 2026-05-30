// Sovereign Dispatch — themed HTML renderer (Epic 6, input to the PDF engine).
//
// Pure: renderHtml(layoutModel) → { html, warnings }. Consumes the same
// presentation-neutral Layout Model (Epic 5) as md/docx. The HTML carries print
// CSS (@page furniture: classification banners, running header, "Page X of Y",
// cover, TOC) that headless Chromium turns into a paginated PDF. Charts render
// as inline SVG (no rasterization for PDF). Presentation only — the engine
// already resolved numbers/order/refs.

import { imageSrcAllowed } from "./src-policy.mjs";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- inline SVG charts (bar/line/area/pie) — deterministic, dependency-free ---
function chartSvg(b) {
  const W = 520, H = 240, P = 28;
  const xk = b.spec?.xKey || b.spec?.labelKey || "x";
  const series = b.spec?.series || [];
  const data = b.spec?.data || [];
  if (!data.length || !series.length) return "";
  const colors = ["#0b1f3a", "#0b6", "#b8860b", "#7a0000", "#3a6ea5", "#6a7a90", "#8a2be2", "#2e8b57"];
  const labels = data.map((d) => esc(d[xk]));
  const vals = data.map((d) => series.map((s) => Number(d[s.key]) || 0));
  const max = Math.max(1, ...vals.flat());
  const innerW = W - 2 * P, innerH = H - 2 * P;

  let body = "";
  if (b.chartType === "pie") {
    const total = vals.reduce((n, row) => n + (row[0] || 0), 0) || 1;
    let a0 = -Math.PI / 2; const cx = W / 2, cy = H / 2, r = Math.min(innerW, innerH) / 2;
    data.forEach((d, i) => {
      const frac = (vals[i][0] || 0) / total; const a1 = a0 + frac * 2 * Math.PI;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      body += `<path d="M${cx.toFixed(1)},${cy.toFixed(1)} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large},1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${colors[i % colors.length]}"/>`;
      a0 = a1;
    });
  } else if (b.chartType === "line" || b.chartType === "area") {
    series.forEach((s, si) => {
      const pts = data.map((d, i) => {
        const x = P + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
        const y = P + innerH - ((Number(d[s.key]) || 0) / max) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      if (b.chartType === "area") body += `<polygon points="${P},${P + innerH} ${pts.join(" ")} ${P + innerW},${P + innerH}" fill="${colors[si % colors.length]}" opacity="0.25"/>`;
      body += `<polyline points="${pts.join(" ")}" fill="none" stroke="${colors[si % colors.length]}" stroke-width="2"/>`;
    });
  } else { // bar
    const groups = data.length, bw = innerW / groups / (series.length + 0.5);
    data.forEach((d, gi) => {
      series.forEach((s, si) => {
        const v = Number(d[s.key]) || 0; const h = (v / max) * innerH;
        const x = P + gi * (innerW / groups) + si * bw + bw * 0.25;
        const y = P + innerH - h;
        body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.9).toFixed(1)}" height="${h.toFixed(1)}" fill="${colors[si % colors.length]}"/>`;
      });
    });
  }
  // axis baseline + x labels (non-pie)
  let axis = "";
  if (b.chartType !== "pie") {
    axis += `<line x1="${P}" y1="${P + innerH}" x2="${P + innerW}" y2="${P + innerH}" stroke="#999"/>`;
    labels.forEach((l, i) => {
      const x = P + (labels.length === 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
      axis += `<text x="${x.toFixed(1)}" y="${H - 6}" font-size="9" text-anchor="middle" fill="#555">${l}</text>`;
    });
  }
  const legend = series.map((s, i) => `<tspan fill="${colors[i % colors.length]}">■</tspan> ${esc(s.label)}`).join("&#160;&#160;");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(b.caption || b.chartType + " chart")}">`
    + `${body}${axis}<text x="${P}" y="14" font-size="9" fill="#333">${legend}</text></svg>`;
}

function block(b, warnings) {
  switch (b.kind) {
    case "paragraph": {
      const cls = b.style === "lead" ? "lead" : b.style === "note" ? "note" : "";
      return `<p class="${cls}">${esc(b.text)}${b.noteRef ? `<sup>[${b.noteRef}]</sup>` : ""}</p>`;
    }
    case "bullets": {
      const tag = b.ordered ? "ol" : "ul";
      const items = (its) => its.map((it) =>
        `<li>${esc(it.text)}${it.noteRef ? `<sup>[${it.noteRef}]</sup>` : ""}${it.children?.length ? `<${tag}>${items(it.children)}</${tag}>` : ""}</li>`).join("");
      return `<${tag}>${items(b.items)}</${tag}>`;
    }
    case "table": {
      const head = `<tr>${b.columns.map((c) => `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>`;
      const rows = b.rows.map((r) => `<tr>${r.map((cell) => `<td style="text-align:${cell.align || "left"}"${cell.emphasis === "bold" ? ' class="b"' : ""}>${esc(cell.text)}</td>`).join("")}</tr>`).join("");
      const cap = b.number || b.caption ? `<figcaption>${esc(b.number ? b.number + ". " : "")}${esc(b.caption || "")}</figcaption>` : "";
      const fn = b.footnotes?.length ? `<div class="tfn">${b.footnotes.map(esc).join("<br/>")}</div>` : "";
      return `<figure><table><thead>${head}</thead><tbody>${rows}</tbody></table>${cap}${fn}</figure>`;
    }
    case "kpi":
      return `<div class="kpis">${b.items.map((k) =>
        `<div class="kpi"><div class="kv">${esc(k.value)}${k.unit ? `<span class="ku">${esc(k.unit)}</span>` : ""}</div><div class="kl">${esc(k.label)}${k.delta ? ` <span class="kd">${esc(k.delta)}</span>` : ""}</div></div>`).join("")}</div>`;
    case "chart": {
      const svg = chartSvg(b);
      if (!svg) { warnings.push({ code: "BLOCK_FALLBACK", blockId: b.nodeId, detail: "chart had no renderable data" }); return ""; }
      const cap = b.number || b.caption ? `<figcaption>${esc(b.number ? b.number + ". " : "")}${esc(b.caption || "")}</figcaption>` : "";
      return `<figure class="chart">${svg}${cap}</figure>`;
    }
    case "quote":
      return `<blockquote>${esc(b.text)}${b.noteRef ? `<sup>[${b.noteRef}]</sup>` : ""}${b.attribution ? `<cite>— ${esc(b.attribution)}</cite>` : ""}</blockquote>`;
    case "callout":
      return `<div class="callout ${esc(b.style)}">${b.title ? `<strong>${esc(b.title)}</strong> ` : `<strong>${esc(b.style.toUpperCase())}</strong> `}${esc(b.text)}</div>`;
    case "timeline":
      return `<ul class="timeline">${b.events.map((e) => `<li><span class="ts">${esc(e.ts)}</span> ${esc(e.label)}${e.detail ? `: ${esc(e.detail)}` : ""}</li>`).join("")}</ul>`;
    case "image": {
      if (!b.altText) warnings.push({ code: "MISSING_ALT_TEXT", blockId: b.nodeId, detail: "image lacks altText" });
      const cap = b.caption ? `<figcaption>${esc(b.number ? b.number + ". " : "")}${esc(b.caption)}${b.credit ? ` — ${esc(b.credit)}` : ""}</figcaption>` : "";
      const placeholder = `<div class="imgph" role="img" aria-label="${esc(b.altText)}">[${esc(b.altText)}]</div>`;
      // SSRF gate (R-P1-3): only embed a server-fetchable <img> when the remote
      // src passes the policy. Blocked/remote-disabled or evidenceId-only → an
      // accessible placeholder (evidence embedding is Phase-3), never a silent
      // server-side fetch.
      if (b.source?.src) {
        const verdict = imageSrcAllowed(b.source.src);
        if (verdict.allowed) {
          return `<figure><img src="${esc(b.source.src)}" alt="${esc(b.altText)}"/>${cap}</figure>`;
        }
        warnings.push({ code: "IMAGE_SRC_BLOCKED", blockId: b.nodeId, detail: `image src not fetched: ${verdict.reason}` });
      }
      return `<figure>${placeholder}${cap}</figure>`;
    }
    case "reference": return b.noteRef ? `<sup class="ref">[${b.noteRef}]</sup>` : "";
    case "pagebreak": return `<div class="pb"></div>`;
    case "signature": return `<div class="sig"><span class="sigline"></span><span class="signame">${esc(b.signatureRef)}</span></div>`;
    default: return `<p>${esc(b.text || "")}</p>`;
  }
}

function section(s, warnings) {
  const lvl = Math.min(Math.max(s.level + 1, 2), 4);
  const num = s.kind === "appendix" || s.kind === "annex"
    ? `Appendix ${s.number || ""} ` : s.number ? `<span class="secnum">${esc(s.number)}</span> ` : "";
  const blocks = (s.blocks || []).map((b) => block(b, warnings)).filter(Boolean).join("\n");
  return `<section class="body"><h${lvl} class="sec" id="${esc(s.nodeId)}">${num}${esc(s.heading)}</h${lvl}>${blocks}</section>`;
}

const CSS = `
@page { size: A4; margin: 26mm 20mm 22mm 20mm;
  @top-center { content: var(--banner); font: 9px Helvetica,Arial,sans-serif; color:#7a0000; letter-spacing:.08em; }
  @bottom-center { content: var(--banner) " — Page " counter(page) " of " counter(pages); font:9px Helvetica,Arial,sans-serif; color:#7a0000; }
  @top-right { content: var(--ref); font:8px Helvetica,Arial,sans-serif; color:#555; } }
@page :first { @top-center{content:"";} @top-right{content:"";} @bottom-center{content:"";} }
* { box-sizing:border-box; } body { font:11pt/1.5 Georgia,"Times New Roman",serif; color:#111; margin:0; }
h1,h2,h3,h4 { font-family:Helvetica,Arial,sans-serif; color:#0b1f3a; }
.cover { height:240mm; display:flex; flex-direction:column; justify-content:center; page-break-after:always; }
.cover .stamp { color:#7a0000; font:700 12px Helvetica,Arial,sans-serif; letter-spacing:.1em; }
.cover h1 { font-size:30pt; margin:8mm 0 2mm; } .cover .sub { font-style:italic; color:#444; font-size:14pt; }
.cover .meta { margin-top:14mm; font:10pt Helvetica,Arial,sans-serif; color:#333; line-height:1.7; }
nav.toc { page-break-after:always; } nav.toc h2 { font-size:16pt; border-bottom:1px solid #ccc; padding-bottom:2mm; }
nav.toc ol { list-style:none; padding:0; } nav.toc li { margin:2mm 0; font-family:Helvetica,Arial,sans-serif; font-size:10.5pt; }
h2.sec { font-size:15pt; margin-top:8mm; } h3.sec{font-size:13pt;} h4.sec{font-size:11.5pt;}
.secnum { color:#6a7a90; margin-right:6px; } p.lead { font-size:12pt; color:#1a1a1a; } p.note{color:#555;font-style:italic;}
table { width:100%; border-collapse:collapse; margin:4mm 0; font-family:Helvetica,Arial,sans-serif; font-size:10pt; }
th,td { border:1px solid #bbb; padding:4px 8px; } thead th { background:#0b1f3a; color:#fff; } td.b{font-weight:700;}
figure { margin:4mm 0; } figcaption { font:italic 9pt Helvetica,Arial,sans-serif; color:#555; margin-top:2mm; }
.tfn{font:9pt Helvetica,Arial,sans-serif;color:#666;margin-top:1mm;}
.callout { border-left:4px solid #0b6; background:#f2fbf6; padding:4mm; margin:4mm 0; }
.callout.warning,.callout.risk{border-color:#b80;background:#fdf6e3;} .callout.recommendation{border-color:#0b6;background:#eefaf3;}
blockquote{margin:4mm 0;padding-left:4mm;border-left:3px solid #ccc;color:#333;font-style:italic;} blockquote cite{display:block;font-size:9pt;color:#666;}
.kpis{display:flex;gap:6mm;flex-wrap:wrap;margin:4mm 0;} .kpi{border:1px solid #ddd;padding:3mm 5mm;border-radius:3px;}
.kv{font:700 18pt Helvetica,Arial,sans-serif;color:#0b1f3a;} .ku{font-size:10pt;color:#666;margin-left:2px;} .kl{font:9pt Helvetica;color:#555;} .kd{color:#0b6;}
ul.timeline{list-style:none;padding:0;} ul.timeline li{margin:2mm 0;} .ts{font-weight:700;font-family:Helvetica,Arial,sans-serif;color:#0b1f3a;}
.imgph{border:1px dashed #aaa;color:#777;padding:8mm;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:9pt;}
.chart svg{border:1px solid #eee;} .pb{page-break-after:always;}
.sig{margin-top:8mm;} .sigline{display:inline-block;width:60mm;border-bottom:1px solid #333;margin-right:4mm;} .signame{font-family:Helvetica,Arial,sans-serif;font-size:9pt;color:#555;}
section.sources h2{font-size:14pt;border-bottom:1px solid #ccc;} ol.refs{font-size:9.5pt;color:#333;}
`;

/** Render a Layout Model to a complete print-ready HTML document. */
export function renderHtml(lm) {
  const warnings = [];
  const c = lm.cover;
  const lvl = lm.classification?.level || "";
  const sensitive = lvl && !/^(unclassified|none)$/i.test(lvl);
  const bannerText = sensitive && lm.renderHints.classificationBanner !== "none"
    ? `${(lm.classification.scheme || "").toUpperCase()} ${lvl}`.trim() : "";
  const refCode = c.referenceCode ? `Ref: ${esc(c.referenceCode)}` : "";

  const metaLines = [];
  if (c.owningBody) metaLines.push(esc(c.owningBody));
  if (c.authors?.length) metaLines.push(c.authors.map((a) => esc(a.name) + (a.title ? `, ${esc(a.title)}` : "")).join("; "));
  const dateRef = [c.date ? esc(c.date) : "", c.referenceCode ? `Reference: ${esc(c.referenceCode)}` : "", c.version ? `Version ${esc(c.version)}` : "", c.status ? esc(c.status) : ""].filter(Boolean).join(" · ");
  if (dateRef) metaLines.push(dateRef);
  if (c.distribution?.length) metaLines.push(`Distribution: ${c.distribution.map(esc).join("; ")}`);

  const toc = lm.toc?.length
    ? `<nav class="toc"><h2>Table of Contents</h2><ol>${lm.toc.map((e) =>
        `<li>${esc(e.number ? e.number + "  " : (e.kind === "appendix" ? "Appendix " : ""))}${esc(e.title)}</li>`).join("")}</ol></nav>`
    : "";

  const bodyHtml = lm.body.map((s) => section(s, warnings)).join("\n");
  const appendixHtml = lm.appendices.map((s) => section(s, warnings)).join("\n");
  const sources = lm.sources?.entries?.length
    ? `<section class="sources body"><h2>Sources</h2><ol class="refs">${lm.sources.entries.map((e) => {
        const f = e.formattedFields || {};
        const parts = [f.title, (f.authors || []).join(", "), f.publisher, f.url].filter(Boolean).map(esc);
        return `<li value="${e.ordinal}">${parts.join(". ")}</li>`;
      }).join("")}</ol></section>`
    : "";

  const html = `<!doctype html><html lang="${esc(lm.metadata?.language || "en-GB")}"><head><meta charset="utf-8"/>`
    + `<title>${esc(c.title)}</title><style>:root{--banner:"${bannerText}";--ref:"${refCode}";}${CSS}</style></head><body>`
    + `<div class="cover">${bannerText ? `<div class="stamp">${esc(bannerText)}</div>` : ""}<h1>${esc(c.title)}</h1>`
    + `${c.subtitle ? `<div class="sub">${esc(c.subtitle)}</div>` : ""}<div class="meta">${metaLines.join("<br/>")}</div></div>`
    + `${toc}${bodyHtml}${appendixHtml}${sources}</body></html>`;

  return { html, warnings };
}
