// ── LEVEL 3 · DOCUMENT LAYER ────────────────────────────────────────
// One engine renders every institutional document from the single
// intelligence object (the Valuation Constitution). A number cannot enter
// a document unless it is a traced Figure.
export { figure, numericTokens } from './figure.js';
export type { Figure } from './figure.js';
export { valuationFacts, factMap } from './facts.js';
export { validateTraceability } from './traceability.js';
export type { TraceabilityReport, Untraced, TracedSectionLike } from './traceability.js';
export { renderDocument, renderDocumentSuite, REPORT_SECTIONS } from './engine.js';
export type { DocumentKind, TracedDocument, TracedSection, DocumentInputs } from './engine.js';
