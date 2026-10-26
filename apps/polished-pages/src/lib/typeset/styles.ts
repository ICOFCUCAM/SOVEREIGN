// Interior styles: how the inside of the book is designed, beyond the
// typeface. Each style sets the chapter opening (label, title, ornament, how
// far down the page it starts), paragraphs (first-line indents or spacing,
// drop caps, justification), running heads and page numbers.
import type { BookFaceId } from "@/lib/typeset/font-files";

export type InteriorStyleId = "classic" | "literary" | "modern" | "devotional" | "academic" | "large";

export interface InteriorStyle {
  id: InteriorStyleId;
  label: string;
  line: string;
  /** "Chapter One" in spaced capitals, a large numeral, or nothing above the title. */
  chapterLabel: "word" | "numeral" | "none";
  titleAlign: "center" | "start";
  titleSize: number;
  titleStyle: "bold" | "regular" | "italic";
  /** Share of the text block left empty above a chapter opening (a "sink"). */
  sink: number;
  ornament: "diamond" | "rule" | "none";
  paragraphs: "indent" | "block";
  /** Lines a drop cap spans at the start of each chapter (0 = none). */
  dropCap: 0 | 2 | 3;
  justify: boolean;
  runningHead: "italic" | "caps" | "none";
  headRule: boolean;
  folio: "plain" | "dashes";
  numberedHeadings: boolean;
  size: number;
  leading: number;
  faces: { body: BookFaceId; heading: BookFaceId };
}

export const INTERIOR_STYLES: InteriorStyle[] = [
  { id: "classic", label: "Classic", line: "“Chapter One”, ornament, drop cap, indented paragraphs", chapterLabel: "word", titleAlign: "center", titleSize: 20, titleStyle: "regular", sink: 0.18, ornament: "diamond", paragraphs: "indent", dropCap: 3, justify: true, runningHead: "italic", headRule: false, folio: "plain", numberedHeadings: false, size: 11, leading: 1.45, faces: { body: "ebgaramond", heading: "ebgaramond" } },
  { id: "literary", label: "Literary", line: "Deep sink, italic title, quiet and spacious", chapterLabel: "none", titleAlign: "center", titleSize: 22, titleStyle: "italic", sink: 0.3, ornament: "none", paragraphs: "indent", dropCap: 2, justify: true, runningHead: "caps", headRule: false, folio: "plain", numberedHeadings: false, size: 11, leading: 1.5, faces: { body: "cormorant", heading: "cormorant" } },
  { id: "modern", label: "Modern", line: "Big numeral, left-aligned title, rule", chapterLabel: "numeral", titleAlign: "start", titleSize: 24, titleStyle: "bold", sink: 0.08, ornament: "rule", paragraphs: "indent", dropCap: 0, justify: true, runningHead: "caps", headRule: true, folio: "plain", numberedHeadings: false, size: 10.5, leading: 1.5, faces: { body: "lora", heading: "montserrat" } },
  { id: "devotional", label: "Devotional", line: "Spaced paragraphs, centred headings, gentle", chapterLabel: "word", titleAlign: "center", titleSize: 20, titleStyle: "bold", sink: 0.12, ornament: "rule", paragraphs: "block", dropCap: 0, justify: true, runningHead: "italic", headRule: false, folio: "dashes", numberedHeadings: false, size: 11.5, leading: 1.55, faces: { body: "crimson", heading: "playfair" } },
  { id: "academic", label: "Academic", line: "Numbered headings, header rule, plain", chapterLabel: "none", titleAlign: "start", titleSize: 18, titleStyle: "bold", sink: 0, ornament: "none", paragraphs: "indent", dropCap: 0, justify: true, runningHead: "caps", headRule: true, folio: "plain", numberedHeadings: true, size: 10.5, leading: 1.45, faces: { body: "notoserif", heading: "notoserif" } },
  { id: "large", label: "Large print", line: "14 pt, ragged right, easy to read", chapterLabel: "word", titleAlign: "start", titleSize: 22, titleStyle: "bold", sink: 0.05, ornament: "none", paragraphs: "block", dropCap: 0, justify: false, runningHead: "none", headRule: false, folio: "plain", numberedHeadings: false, size: 14, leading: 1.55, faces: { body: "baskerville", heading: "baskerville" } },
];
export const styleById = (id?: string | null) => INTERIOR_STYLES.find((s) => s.id === id) ?? INTERIOR_STYLES[0];

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
/** 1 → "One", 42 → "Forty-Two" (digits from 100). */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n] || String(n);
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return String(n);
}
