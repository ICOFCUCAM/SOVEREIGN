import type { Config } from "tailwindcss";

// Dispatch has its OWN institutional identity — deliberately distinct from the
// cinematic Sovereign marketing site. Dense, legible, classification-forward:
// a government/operations console aesthetic, not a landing page.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0b1220",
          800: "#111a2e",
          700: "#1b2742",
          600: "#27375c",
        },
        paper: "#f6f7fb",
        seal: { DEFAULT: "#1f4b8e", deep: "#163a6e", light: "#3a6fc4" },
        // Dispatch institutional gold — the marketing/brand accent.
        gold: {
          50: "#fbf6e9",
          200: "#ecd9a3",
          300: "#e0c476",
          400: "#d4af52",
          500: "#c9a24b",
          600: "#a9852f",
          700: "#856722",
        },
        // Operations console design tokens (dark institutional navy, not black).
        // Text tones are contrast-checked: text3 ≥ 5.7:1 on every console surface;
        // `faint` ≥ 4.5:1 on bg/panel only and is reserved for non-essential labels.
        sd: {
          bg: "#0b1018",
          panel: "#111a26",
          raised: "#162131",
          hover: "#1b2a3d",
          sunken: "#0d1520",
          line: "#263548",
          soft: "#1c2838",
          text: "#edf2f8",
          text2: "#b4c0cf",
          text3: "#8d9bb0",
          faint: "#7f8ea3",
          accent: "#8dbbff",
          accentbg: "#d9e7f9",
          accentink: "#15243a",
          gold: "#c9ad75",
          ok: "#75c9a1",
          warn: "#e6bd72",
          bad: "#e28b8b",
        },
        // classification banding
        cls: {
          unclassified: "#2f7d4f",
          official: "#1f6f8b",
          sensitive: "#b8860b",
          secret: "#a23b2e",
          topsecret: "#7a1f6b",
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
