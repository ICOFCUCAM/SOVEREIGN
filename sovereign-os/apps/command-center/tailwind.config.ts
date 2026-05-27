import type { Config } from 'tailwindcss';

// Sovereign command-center theme — dark, cinematic, teal/cyan command palette.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sov: {
          bg: '#05080c',
          panel: '#0a1018',
          edge: '#16222e',
          cyan: '#22d3ee',
          teal: '#14b8a6',
          amber: '#f59e0b',
          rose: '#fb7185',
          mute: '#5b7488',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        hud: '0 0 0 1px rgba(34,211,238,0.15), 0 0 30px -10px rgba(34,211,238,0.35)',
      },
      keyframes: {
        pulseline: { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
      },
      animation: { pulseline: 'pulseline 2.4s ease-in-out infinite' },
    },
  },
  plugins: [],
};

export default config;
