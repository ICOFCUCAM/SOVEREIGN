import { PenTool, Rocket, Globe, Send, Store, type LucideIcon } from "lucide-react";

// Workflow-led navigation model. The platform has ~20 tools; organising them by
// what the user is trying to DO — Create → Publish → Localize → Distribute →
// Sell — removes feature-hunting and mirrors the real publishing lifecycle.
// The mega menu, the mobile drawer and the command palette all render from this
// single source so the whole app shares one mental model.

export interface NavItem {
  label: string;
  path: string;
  desc?: string;
  badge?: string;
}
export interface NavColumn {
  heading?: string;
  items: NavItem[];
}
export interface Workflow {
  id: string;
  label: string;   // the verb
  blurb: string;   // one-line intent shown in the mega menu
  icon: LucideIcon;
  columns: NavColumn[];
}

export const WORKFLOWS: Workflow[] = [
  {
    id: "create",
    label: "Create",
    blurb: "Start something new — documents, books, courses.",
    icon: PenTool,
    columns: [
      {
        heading: "Career",
        items: [
          { label: "CV Builder", path: "/cv", desc: "ATS-ready résumés" },
          { label: "Cover Letters", path: "/cover-letter", desc: "Tailored to the role" },
          { label: "Tailor to a Job", path: "/tailor", desc: "CV + letter + fit score" },
        ],
      },
      {
        heading: "Books",
        items: [
          { label: "Book Creator", path: "/book", desc: "Full-length, structured" },
          { label: "Transform a Book", path: "/book-transform", desc: "Revise & redesign" },
          { label: "Illustration Studio", path: "/illustrations", desc: "AI artwork & covers" },
        ],
      },
      {
        heading: "Children’s",
        items: [
          { label: "Children’s Studio", path: "/children", desc: "All 14 tools" },
          { label: "Storybooks & Series", path: "/storybook", desc: "Illustrated stories" },
          { label: "Coloring Books", path: "/coloring", desc: "Printable activity books" },
        ],
      },
      {
        heading: "Education",
        items: [
          { label: "Classroom Packs", path: "/classroom" },
          { label: "Primary School Books", path: "/primary-books" },
          { label: "Workbooks", path: "/workbooks" },
          { label: "Curriculum Builder", path: "/curriculum" },
          { label: "Teacher Resources", path: "/teacher" },
          { label: "Exam & Assessment", path: "/assessment" },
          { label: "Assessment Bank", path: "/assessment-bank" },
        ],
      },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    blurb: "Turn your work into editions and series.",
    icon: Rocket,
    columns: [
      {
        items: [
          { label: "Series", path: "/series", desc: "Group books into a collection" },
          { label: "Edition Manager", path: "/editions", desc: "Every language edition, linked" },
          { label: "Library", path: "/library", desc: "Everything you’ve made" },
        ],
      },
    ],
  },
  {
    id: "localize",
    label: "Localize",
    blurb: "Publish in every language and culture.",
    icon: Globe,
    columns: [
      {
        items: [
          { label: "Translate & Localize", path: "/translate", desc: "Faithful or culturally adapted" },
          { label: "Edition Manager", path: "/editions", desc: "Manage multilingual editions" },
        ],
      },
    ],
  },
  {
    id: "distribute",
    label: "Distribute",
    blurb: "Get your work into every major store.",
    icon: Send,
    columns: [
      {
        items: [
          { label: "Distribution Center", path: "/publishing", desc: "KDP, IngramSpark & more" },
          { label: "Edition Manager", path: "/editions", desc: "Export per market" },
        ],
      },
    ],
  },
  {
    id: "sell",
    label: "Sell",
    blurb: "Reach readers and schools on the marketplace.",
    icon: Store,
    columns: [
      {
        items: [
          { label: "Marketplace", path: "/catalog", desc: "Discover & get discovered" },
          { label: "Collections", path: "/collections", desc: "Curated public sets" },
          { label: "Plans & Pricing", path: "/pricing", desc: "Grow your reach" },
        ],
      },
    ],
  },
];

// Flattened, de-duplicated list of every navigable destination — handy for the
// command palette and search.
export const ALL_DESTINATIONS: NavItem[] = Array.from(
  new Map(
    WORKFLOWS.flatMap((w) => w.columns.flatMap((c) => c.items)).map((i) => [i.path, i]),
  ).values(),
);
