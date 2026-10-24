/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        sheet: 'var(--sheet)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        rule: 'var(--rule)',
        blue: {
          DEFAULT: 'var(--blue)',
          wash: 'var(--blue-wash)',
        },
        ok: {
          DEFAULT: 'var(--ok)',
          wash: 'var(--ok-wash)',
        },
        mid: {
          DEFAULT: 'var(--mid)',
          wash: 'var(--mid-wash)',
        },
        bad: {
          DEFAULT: 'var(--bad)',
          wash: 'var(--bad-wash)',
        },
        verdict: {
          supported: 'var(--ok)',
          contradicted: 'var(--bad)',
          partial: 'var(--mid)',
          insufficient: 'var(--ink-2)',
        }
      },
      fontFamily: {
        ui: ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
        doc: ['Newsreader', 'Georgia', 'serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
