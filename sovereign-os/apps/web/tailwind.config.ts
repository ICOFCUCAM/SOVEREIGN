import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy sov palette retained for backwards compatibility.
        sov: {
          bg: '#05080c', panel: '#0a1018', edge: '#16222e',
          cyan: '#22d3ee', teal: '#14b8a6', gold: '#d4af37', mute: '#5b7488',
        },
        // Emergency AI institutional palette — gold/cream on near-black.
        emrg: {
          bg: '#08080d',
          panel: '#0e0e14',
          surface: '#11121a',
          edge: '#1d1d28',
          edgeStrong: '#2a2a37',
          gold: '#d4a86a',
          cream: '#efd9b3',
          dim: '#8a7350',
          ink: '#dad3c4',
          mute: '#7d7a72',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Garamond', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseline: { '0%,100%': { opacity: '0.25' }, '50%': { opacity: '1' } },
        orbit: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        rise: 'rise 0.9s ease-out both',
        pulseline: 'pulseline 2.6s ease-in-out infinite',
        orbit: 'orbit 90s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
