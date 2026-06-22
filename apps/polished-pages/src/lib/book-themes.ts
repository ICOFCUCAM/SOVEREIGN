import type { FontId } from "@/lib/fonts";

// Interior book designs. Each theme is a distinct reading experience — paper,
// type pairing, leading, indentation, drop caps and chapter treatment — not a
// recolour. The renderer (BookPaper) lays content out per these tokens and the
// PDF export captures the same design.
export interface BookTheme {
  id: string;
  name: string;
  blurb: string;
  paper: string;
  ink: string;
  heading: string;
  body: FontId;
  display: FontId;
  size: number;        // body px
  leading: number;     // line-height multiplier
  align: "justify" | "left";
  indent: boolean;     // first-line indent on continuation paragraphs
  dropCap: boolean;    // drop cap on the first paragraph of each chapter
  chapter: "centered-caps" | "left-bold" | "rule" | "numbered";
}

export const BOOK_THEMES: BookTheme[] = [
  {
    id: "classic", name: "Classic", blurb: "Traditional serif with drop caps and centred chapter titles on cream paper.",
    paper: "#faf7f0", ink: "#2b2b2b", heading: "#1a1a1a", body: "fraunces", display: "playfair",
    size: 16, leading: 1.75, align: "justify", indent: true, dropCap: true, chapter: "centered-caps",
  },
  {
    id: "literary", name: "Literary", blurb: "Elegant serif, generous leading and indented prose for fiction and memoir.",
    paper: "#fffef8", ink: "#33312e", heading: "#1a1a1a", body: "fraunces", display: "fraunces",
    size: 17, leading: 1.9, align: "justify", indent: true, dropCap: false, chapter: "centered-caps",
  },
  {
    id: "modern", name: "Modern", blurb: "Clean sans-serif, left-aligned, bold chapter titles — contemporary non-fiction.",
    paper: "#ffffff", ink: "#1f2937", heading: "#0f172a", body: "inter", display: "grotesk",
    size: 16, leading: 1.7, align: "left", indent: false, dropCap: false, chapter: "left-bold",
  },
  {
    id: "minimal", name: "Minimal", blurb: "Airy, hairline chapter rules and lots of white space.",
    paper: "#ffffff", ink: "#374151", heading: "#111827", body: "manrope", display: "manrope",
    size: 16, leading: 1.85, align: "left", indent: false, dropCap: false, chapter: "rule",
  },
  {
    id: "academic", name: "Academic", blurb: "Serif body with numbered chapters and justified columns for non-fiction.",
    paper: "#ffffff", ink: "#1f2937", heading: "#111827", body: "fraunces", display: "jakarta",
    size: 15.5, leading: 1.7, align: "justify", indent: true, dropCap: false, chapter: "numbered",
  },
  {
    id: "manuscript", name: "Manuscript", blurb: "Monospace, double-spaced editing format — ideal for proofing and submissions.",
    paper: "#ffffff", ink: "#111111", heading: "#111111", body: "mono", display: "mono",
    size: 15, leading: 2.0, align: "left", indent: true, dropCap: false, chapter: "left-bold",
  },
  {
    id: "childrens", name: "Children's", blurb: "Large, friendly type with airy spacing and centred chapter titles — early readers and picture-led books.",
    paper: "#fffdf7", ink: "#2a2a2a", heading: "#1a1a1a", body: "jakarta", display: "grotesk",
    size: 19, leading: 1.95, align: "left", indent: false, dropCap: false, chapter: "centered-caps",
  },
  {
    id: "educational", name: "Educational", blurb: "Clear sans-serif with numbered units and structured headings — lessons and classroom readers.",
    paper: "#ffffff", ink: "#1f2937", heading: "#0f172a", body: "inter", display: "jakarta",
    size: 16, leading: 1.7, align: "left", indent: false, dropCap: false, chapter: "numbered",
  },
  {
    id: "workbook", name: "Workbook", blurb: "Roomy sans layout with clear section rules — exercises, activities and write-in space.",
    paper: "#ffffff", ink: "#1f2937", heading: "#111827", body: "manrope", display: "grotesk",
    size: 16.5, leading: 1.95, align: "left", indent: false, dropCap: false, chapter: "rule",
  },
  {
    id: "ministry", name: "Ministry", blurb: "Dignified serif with drop caps and centred chapter titles — devotionals, scripture studies and sermons.",
    paper: "#faf7f0", ink: "#2b2b2b", heading: "#1a1a1a", body: "fraunces", display: "playfair",
    size: 16, leading: 1.8, align: "justify", indent: true, dropCap: true, chapter: "centered-caps",
  },
  {
    id: "ngo", name: "NGO / Report", blurb: "Clean modern sans with bold section headings — reports, handbooks and field guides.",
    paper: "#ffffff", ink: "#1f2937", heading: "#0f172a", body: "inter", display: "grotesk",
    size: 15.5, leading: 1.7, align: "left", indent: false, dropCap: false, chapter: "left-bold",
  },
];

export const getBookTheme = (id?: string): BookTheme => BOOK_THEMES.find((t) => t.id === id) ?? BOOK_THEMES[0];
