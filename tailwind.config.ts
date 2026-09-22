import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b0d10', subtle: '#111418', raised: '#171a1f' },
        border: { DEFAULT: '#23272e', strong: '#333842' },
        fg: { DEFAULT: '#e6e8eb', muted: '#9aa1ab', subtle: '#6b7280' },
        accent: { DEFAULT: '#4f8cff', hover: '#6aa0ff' },
        ok: '#3fb950',
        warn: '#d29922',
        err: '#f85149',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
