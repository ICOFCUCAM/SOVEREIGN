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
          rose: '#fb7185',
          mute: '#5b7488',
        },
      },
      fontFamily: { mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
    },
  },
  plugins: [],
};

export default config;
