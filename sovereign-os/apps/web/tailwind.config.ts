import type { Config } from 'tailwindcss';

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
          gold: '#d4af37',
          mute: '#5b7488',
        },
      },
      fontFamily: { mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseline: { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
      },
      animation: { rise: 'rise 0.7s ease-out both', pulseline: 'pulseline 2.6s ease-in-out infinite' },
    },
  },
  plugins: [],
};

export default config;
