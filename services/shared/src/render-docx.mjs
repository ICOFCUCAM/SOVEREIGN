// Sovereign Dispatch — DOCX renderer (Epic 7 / ADR-006).
//
// renderDocx(layoutModel) → { bytes: Buffer, warnings }. Consumes the same
// presentation-neutral Layout Model (Epic 5) as md/pdf, via the maintained
// `docx` library behind this single interface (swappable per ADR-006). Produces
// an editable, style-driven .docx: cover, Word TOC field, numbered headings,
// native tables, footnotes/endnotes from citations, headers/footers with
// classification banner + "Page X of Y", lettered appendices, signature blocks.
// Charts are rasterized elsewhere for PDF; in DOCX they render as a data table
// fallback (CHART_RASTERIZED) — dependency-free, deterministic.
//
// Lives in services/shared because it depends on the `docx` npm package (the
// ddm-schema package is intentionally dependency-light: ajv only).

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  Header, Footer, PageNumber, TableOfContents, Tab,
} from "docx";

const HEADING = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };
const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT };

function runs(text, opts = {}) { return [new TextRun({ text: String(text ?? ""), ...opts })]; }

function blockToParagraphs(b, warnings, footnoteMap) {
  switch (b.kind) {
    case "paragraph": {
      const children = [new TextRun({ text: b.text, bold: b.style === "lead", italics: b.style === "note" })];
      if (b.noteRef) children.push(new TextRun({ text: `[${b.noteRef}]`, superScript: true }));
      return [new Paragraph({ children, spacing: { after: 120 } })];
    }
    case "bullets": {
      const out = [];
      const walk = (items, level) => {
        for (const it of items) {
          const children = [new TextRun(it.text)];
          if (it.noteRef) children.push(new TextRun({ text: `[${it.noteRef}]`, superScript: true }));
          out.push(new Paragraph({ children, numbering: b.ordered ? { reference: "num-ordered", level } : undefined,
            bullet: b.ordered ? undefined : { level } }));
          if (it.children?.length) walk(it.children, level + 1);
        }
      };
      walk(b.items, 0);
      return out;
    }
    case "table": {
      const out = [];
      if (b.number || b.caption) out.push(new Paragraph({ children: runs(`${b.number ? b.number + ". " : ""}${b.caption || ""}`, { italics: true, size: 18 }), spacing: { before: 80, after: 40 } }));
      const headRow = new TableRow({ tableHeader: true, children: b.columns.map((c) =>
        new TableCell({ width: { size: Math.floor(100 / b.columns.length), type: WidthType.PERCENTAGE },
          shading: { fill: "0B1F3A" }, children: [new Paragraph({ alignment: ALIGN[c.align] || AlignmentType.LEFT, children: runs(c.label, { bold: true, color: "FFFFFF" }) })] })) });
      const bodyRows = b.rows.map((r) => new TableRow({ children: r.map((cell) =>
        new TableCell({ columnSpan: cell.colspan && cell.colspan > 1 ? cell.colspan : undefined,
          children: [new Paragraph({ alignment: ALIGN[cell.align] || AlignmentType.LEFT, children: runs(cell.text, { bold: cell.emphasis === "bold" || cell.emphasis === "header" }) })] })) }));
      out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headRow, ...bodyRows] }));
      for (const fn of b.footnotes || []) out.push(new Paragraph({ children: runs(fn, { italics: true, size: 16, color: "666666" }) }));
      return out;
    }
    case "kpi":
      return [new Paragraph({ children: b.items.flatMap((k, i) => [
        ...(i ? [new TextRun({ text: "    " })] : []),
        new TextRun({ text: `${k.value}${k.unit ? " " + k.unit : ""}`, bold: true, color: "0B1F3A" }),
        new TextRun({ text: ` ${k.label}${k.delta ? ` (${k.delta})` : ""}  `, size: 18, color: "555555" }),
      ]), spacing: { after: 120 } })];
    case "chart": {
      // DOCX: chart → data table fallback (vector/PNG embedding deferred). Same
      // data the PDF SVG draws, so content parity holds.
      warnings.push({ code: "CHART_RASTERIZED", blockId: b.nodeId, detail: "chart rendered as data table in docx" });
      const xk = b.spec?.xKey || b.spec?.labelKey || "x";
      const series = b.spec?.series || [];
      const header = [xk, ...series.map((s) => s.label)];
      const out = [];
      if (b.number || b.caption) out.push(new Paragraph({ children: runs(`${b.number ? b.number + ". " : ""}${b.caption || "Chart"} (${b.chartType})`, { italics: true, size: 18 }) }));
      out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: header.map((h) => new TableCell({ shading: { fill: "0B1F3A" }, children: [new Paragraph({ children: runs(h, { bold: true, color: "FFFFFF" }) })] })) }),
          ...(b.spec?.data || []).map((d) => new TableRow({ children: [d[xk], ...series.map((s) => d[s.key])].map((v) => new TableCell({ children: [new Paragraph({ children: runs(v) })] })) })),
        ] }));
      return out;
    }
    case "quote": {
      const children = [new TextRun({ text: b.text, italics: true })];
      if (b.noteRef) children.push(new TextRun({ text: `[${b.noteRef}]`, superScript: true }));
      const out = [new Paragraph({ children, indent: { left: 480 }, spacing: { after: 60 } })];
      if (b.attribution) out.push(new Paragraph({ children: runs(`— ${b.attribution}`, { size: 18, color: "666666" }), indent: { left: 480 } }));
      return out;
    }
    case "callout":
      return [new Paragraph({
        shading: { fill: b.style === "warning" || b.style === "risk" ? "FDF6E3" : "EEFAF3" },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: b.style === "warning" || b.style === "risk" ? "BB8800" : "00BB66" } },
        children: [new TextRun({ text: (b.title || b.style.toUpperCase()) + ": ", bold: true }), new TextRun(b.text)],
        spacing: { before: 80, after: 80 },
      })];
    case "timeline":
      return b.events.map((e) => new Paragraph({ children: [new TextRun({ text: `${e.ts}  `, bold: true, color: "0B1F3A" }), new TextRun(`${e.label}${e.detail ? `: ${e.detail}` : ""}`)] }));
    case "image": {
      if (!b.altText) warnings.push({ code: "MISSING_ALT_TEXT", blockId: b.nodeId, detail: "image lacks altText" });
      // Evidence embedding is Phase-3; render an accessible caption placeholder.
      const out = [new Paragraph({ children: runs(`[Image: ${b.altText || ""}]`, { italics: true, color: "777777" }) })];
      if (b.caption) out.push(new Paragraph({ children: runs(`${b.number ? b.number + ". " : ""}${b.caption}${b.credit ? ` — ${b.credit}` : ""}`, { italics: true, size: 16, color: "555555" }) }));
      return out;
    }
    case "reference":
      return b.noteRef ? [new Paragraph({ children: [new TextRun({ text: `[${b.noteRef}]`, superScript: true })] })] : [];
    case "pagebreak":
      return [new Paragraph({ children: [], pageBreakBefore: true })];
    case "signature":
      return [new Paragraph({ spacing: { before: 240 }, children: runs("__________________________") }),
        new Paragraph({ children: runs(b.signatureRef, { size: 18, color: "555555" }) })];
    default:
      return [new Paragraph({ children: runs(b.text || "") })];
  }
}

function sectionParagraphs(s, warnings) {
  const num = s.kind === "appendix" || s.kind === "annex"
    ? `Appendix ${s.number || ""} ` : s.number ? `${s.number} ` : "";
  const out = [new Paragraph({ heading: HEADING[Math.min(Math.max(s.level, 1), 4)] || HeadingLevel.HEADING_2,
    children: runs(`${num}${s.heading}`), spacing: { before: 200, after: 80 } })];
  for (const b of s.blocks || []) out.push(...blockToParagraphs(b, warnings));
  return out;
}

/** Render a Layout Model to a .docx Buffer. */
export async function renderDocx(lm, ctx = {}) {
  const warnings = [];
  const c = lm.cover;
  const lvl = lm.classification?.level || "";
  const sensitive = lvl && !/^(unclassified|none)$/i.test(lvl);
  const banner = sensitive && lm.renderHints.classificationBanner !== "none"
    ? `${(lm.classification.scheme || "").toUpperCase()} ${lvl}`.trim() : "";

  // Cover
  const cover = [
    ...(banner ? [new Paragraph({ alignment: AlignmentType.CENTER, children: runs(banner, { bold: true, color: "7A0000" }) })] : []),
    new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: runs(c.title, { bold: true, size: 56, color: "0B1F3A" }) }),
    ...(c.subtitle ? [new Paragraph({ alignment: AlignmentType.CENTER, children: runs(c.subtitle, { italics: true, size: 28, color: "444444" }) })] : []),
  ];
  const metaLines = [];
  if (c.owningBody) metaLines.push(c.owningBody);
  if (c.authors?.length) metaLines.push(c.authors.map((a) => a.name + (a.title ? `, ${a.title}` : "")).join("; "));
  const dr = [c.date, c.referenceCode ? `Reference: ${c.referenceCode}` : "", c.version ? `Version ${c.version}` : "", c.status].filter(Boolean).join(" · ");
  if (dr) metaLines.push(dr);
  if (c.distribution?.length) metaLines.push(`Distribution: ${c.distribution.join("; ")}`);
  for (const m of metaLines) cover.push(new Paragraph({ alignment: AlignmentType.CENTER, children: runs(m, { size: 20, color: "333333" }) }));
  cover.push(new Paragraph({ children: [], pageBreakBefore: false }));

  // TOC (Word field — updates on open) + heading
  const tocChildren = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs("Table of Contents"), pageBreakBefore: true }),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: `1-${lm.renderHints.tocDepth || 2}` }),
  ];

  // Body + appendices
  const bodyChildren = [];
  bodyChildren.push(new Paragraph({ children: [], pageBreakBefore: true }));
  for (const s of lm.body) bodyChildren.push(...sectionParagraphs(s, warnings));
  for (const s of lm.appendices) bodyChildren.push(...sectionParagraphs(s, warnings));

  // Sources
  if (lm.sources?.entries?.length) {
    bodyChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs("Sources"), pageBreakBefore: true }));
    for (const e of lm.sources.entries) {
      const f = e.formattedFields || {};
      const parts = [f.title, (f.authors || []).join(", "), f.publisher, f.url].filter(Boolean).join(". ");
      bodyChildren.push(new Paragraph({ children: runs(`[${e.ordinal}] ${parts}`, { size: 19 }) }));
    }
  }

  const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: runs(banner || c.title || "", { size: 16, color: banner ? "7A0000" : "555555" }) })] });
  const pageNumPara = new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: (banner ? banner + " — " : "") + "Page ", size: 16, color: "7A0000" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 16 }), new TextRun({ text: " of ", size: 16 }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 })] });
  // The in-document verification stamp — the file self-advertises its Official
  // Record id and where to verify it, on every page (mirrors the PDF footer).
  const verifyBase = String(ctx.verifyBase || "dispatch.sovereigndo.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  // Evaluation (free-tier) records carry an EVAL- id and must be marked NOT an
  // official record, in a warning tone, on every page (mirrors the PDF stamp).
  const isEval = /^EVAL-/i.test(String(ctx.publicId || ""));
  const stampPara = ctx.publicId ? new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 },
    children: isEval
      ? [new TextRun({ text: "EVALUATION COPY · NOT AN OFFICIAL RECORD · ", bold: true, size: 14, color: "9A3412" }),
         new TextRun({ text: String(ctx.publicId), bold: true, size: 14, color: "9A3412" })]
      : [new TextRun({ text: "OFFICIAL RECORD · ", size: 14, color: "777777" }),
         new TextRun({ text: String(ctx.publicId), bold: true, size: 14, color: "555555" }),
         new TextRun({ text: `  ·  Verify at ${verifyBase}/verify/${ctx.publicId}`, size: 14, color: "777777" })] }) : null;
  const footer = new Footer({ children: stampPara ? [pageNumPara, stampPara] : [pageNumPara] });

  const doc = new Document({
    creator: "Sovereign Dispatch",
    title: c.title,
    description: `${lm.docType} · ${lm.engineVersion}`,
    numbering: { config: [{ reference: "num-ordered", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }] }] },
    sections: [
      { properties: {}, children: cover }, // cover (no header/footer on first section's first page is default-ish)
      { properties: {}, headers: { default: header }, footers: { default: footer }, children: [...tocChildren, ...bodyChildren] },
    ],
  });

  const bytes = await Packer.toBuffer(doc);
  return { bytes, warnings };
}
