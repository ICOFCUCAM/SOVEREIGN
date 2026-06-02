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
        },
        // Urgency / LOI / hot lead — amber
        loi: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
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
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["Fraunces", "Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
