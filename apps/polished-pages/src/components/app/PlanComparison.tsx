import { Fragment } from "react";
import { Check, Minus } from "lucide-react";

// Detailed capability matrix for the four self-serve tiers. Values mirror the
// plan config and feature gates (FEATURE_MIN_PLAN, plan_image_limit). A real
// comparison table is a premium-pricing expectation and makes the upgrade
// reason concrete rather than implied by an image-credit integer.
type Cell = boolean | string;
const TIERS = ["Creator", "Professional", "Publisher Pro", "Business"] as const;

const SECTIONS: { group: string; rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: "Create",
    rows: [
      { label: "CVs, cover letters & job tailoring", cells: [true, true, true, true] },
      { label: "Book Creator & Transform", cells: [true, true, true, true] },
      { label: "Children’s storybooks & coloring books", cells: [true, true, true, true] },
      { label: "Educational Studio, curriculum & assessments", cells: [false, true, true, true] },
    ],
  },
  {
    group: "Localize & Publish",
    rows: [
      { label: "Translate & localize", cells: [false, true, true, true] },
      { label: "Bulk translation & multi-language editions", cells: [false, false, true, true] },
      { label: "Series & edition management", cells: [true, true, true, true] },
      { label: "Marketplace storefront & author profile", cells: [false, false, true, true] },
    ],
  },
  {
    group: "Distribute & Sell",
    rows: [
      { label: "KDP & IngramSpark export", cells: [true, true, true, true] },
      { label: "Sell on the marketplace", cells: [true, true, true, true] },
      { label: "Marketplace analytics", cells: [false, false, false, true] },
    ],
  },
  {
    group: "Teams",
    rows: [
      { label: "Team collaboration & shared libraries", cells: [false, false, false, true] },
      { label: "Brand kits & approval workflows", cells: [false, false, false, true] },
    ],
  },
  {
    group: "Monthly allowances",
    rows: [
      { label: "Image credits / month", cells: ["250", "800", "1,500", "4,000"] },
      { label: "Everyday document generation", cells: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
    ],
  },
];

const renderCell = (c: Cell) =>
  typeof c === "string" ? (
    <span className="text-sm font-medium text-foreground font-sans">{c}</span>
  ) : c ? (
    <Check className="mx-auto h-4 w-4 text-primary" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
  );

const PlanComparison = () => (
  <section className="mx-auto mt-16 max-w-4xl">
    <h2 className="text-center font-serif text-2xl font-bold tracking-tight">Compare every plan</h2>
    <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground font-sans">Exactly what unlocks at each tier — no guesswork.</p>
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-background py-3 text-left text-sm font-semibold font-sans" />
            {TIERS.map((t) => (
              <th key={t} className="px-3 py-3 text-center text-sm font-semibold font-sans">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map((sec) => (
            <Fragment key={sec.group}>
              <tr>
                <td colSpan={5} className="border-t border-border bg-muted/30 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-sans">{sec.group}</td>
              </tr>
              {sec.rows.map((r) => (
                <tr key={r.label} className="border-t border-border/60">
                  <td className="sticky left-0 bg-background py-2.5 pr-3 text-left text-sm text-foreground/90 font-sans">{r.label}</td>
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">{renderCell(c)}</td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PlanComparison;
