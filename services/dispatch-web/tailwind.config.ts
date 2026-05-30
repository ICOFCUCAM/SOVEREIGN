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
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
