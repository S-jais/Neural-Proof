/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C18',
          900: '#0A1020',
          850: '#0F172A',
          800: '#111827',
          750: '#161F38',
          700: '#1E293B',
          600: '#334155',
        },
        accent: {
          cyan: '#22D3EE',
          teal: '#14B8A6',
          sky: '#38BDF8',
        },
        verdict: {
          supported: '#10B981',
          contradicted: '#EF4444',
          partial: '#F59E0B',
          insufficient: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
