import type { Config } from "tailwindcss";

// ExitOS identity — deliberately distinct from Dispatch's government gold.
// The exit motion is a deal closing, not a gazette publication: dense ink
// neutrals + an emerald deal accent + amber for urgency/loi states. The
// design vocabulary is a founder/operator's terminal, not a marketing page.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          // 950 was referenced (bars, tooltips, button text) but never
          // defined, so those classes compiled to nothing.
          950: "#060b12",
          900: "#0a1018",
          800: "#0f1827",
          700: "#172238",
          600: "#243353",
        },
        paper: "#f5f7f9",
        // ExitOS deal accent — emerald (closed/positive)
        deal: {
          50:  "#ecfdf5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
        },
        // Urgency / LOI / hot lead — amber
        loi: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // ── Acquisition Intelligence Workstation (`xo`) ──────────────
        // The ExitOS institutional design system, adopted page by page
        // (Terminal first). Additive: existing ink/deal/loi tokens are
        // untouched so pages not yet redesigned do not move. Text tokens
        // are contrast-checked (≥ 4.5:1) on xo-ink / xo-panel; paper-*
        // tokens are for light editorial reading surfaces.
        xo: {
          ink: "#0b1220",        // command surface
          panel: "#101a2b",      // raised panel on ink
          raise: "#16233a",      // hover / selected row
          line: "#22314b",       // hairline on dark
          text: "#e8edf5",       // primary text on dark (14.8:1 on panel)
          muted: "#a3b1c6",      // secondary text on dark (8.0:1)
          faint: "#8796ad",      // labels / captions on dark (5.2:1 on raise)
          paper: "#f6f4ef",      // editorial reading surface
          "paper-line": "#ddd8cc",
          "paper-text": "#1a2233", // on paper (14.5:1)
          "paper-muted": "#4f5b6e", // on paper (6.3:1)
          verified: "#34d399",   // verified / positive (emerald)
          "verified-ink": "#047857", // emerald on paper
          action: "#7cb2ff",     // semantic blue for actions on dark
          "action-ink": "#1d4ed8", // action on paper
          brass: "#c9a86a",      // restrained institutional accent
          caution: "#fbbf24",    // assumption / prior / gated
          risk: "#f87171",       // negative trend
        },
        // ── The exchange ink (homepage phase 13, EE1) ───────────────────
        // One deep blue ink for every dark marketing surface, one paper pair,
        // signal blue and two greens. Mirrored as CSS variables in index.css
        // for gradients written inline.
        ex: {
          0: "#040c18",          // floor: footers, the deepest fall-off
          1: "#071a31",          // field: dark chapters
          2: "#0a2142",          // raised: panels and cards on the field
          3: "#163459",          // edge: rings and rules on the field
          paper: "#f6f8fb",      // story chapters
          live: "#7CFF9F",       // the travelling light only
          done: "#6ee7b7",       // closed / positive, on ink
          "done-ink": "#047857", // closed / positive, on paper
          hair: "rgba(147,197,253,0.18)", // hairline on ink
          // the hero and insignia palette (owner's final correction, HX2)
          porcelain: "#F5F1E9",  // warm porcelain: the hero's editorial page
          graphite: "#242522",   // mineral graphite: the signature field
          shadow: "#111310",     // soft black: deep shadow, the capability rail
          bronze: "#B49A75",     // muted champagne bronze: the signature accent
          "bronze-ink": "#7A6344", // bronze deepened for text on porcelain (5.2:1)
          ivory: "#E8E0D2",      // warm ivory: lettering and highlights on graphite
          "slate-ink": "#55504A", // secondary text on porcelain (7.0:1)
        },
        // Deal-stage bands for pipeline visualization
        stage: {
          sourcing:  "#475569",
          engaged:   "#0ea5e9",
          diligence: "#f59e0b",
          loi:       "#a855f7",
          signed:    "#10b981",
          closed:    "#059669",
          dead:      "#64748b",
        },
      },
      // one radius scale and three shadow levels for the marketing surfaces (EE25)
      borderRadius: { "ex-xs": "3px", "ex-sm": "4px", "ex-md": "6px", "ex-lg": "10px" },
      boxShadow: {
        "ex-1": "0 1px 0 rgba(10,16,24,0.04), 0 1px 2px rgba(7,26,49,0.06)",
        "ex-2": "0 18px 40px -20px rgba(7,26,49,0.45)",
        "ex-3": "0 40px 80px -40px rgba(7,26,49,0.6), 0 18px 36px -24px rgba(7,26,49,0.35)",
        "ex-bezel": "inset 0 1px 0 rgba(200,225,255,0.16), 0 0 0 1px rgba(10,33,66,0.12), 0 40px 80px -40px rgba(7,26,49,0.6), 0 18px 36px -24px rgba(7,26,49,0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        // headings use a bold geometric display sans (was Fraunces serif); the
        // `serif` token is kept so existing font-serif classes pick it up.
        serif: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // the editorial serif already loaded in index.css (Source Serif 4) —
        // the marketing site's display headlines.
        editorial: ['"Source Serif 4"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
