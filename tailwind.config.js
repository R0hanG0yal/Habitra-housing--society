/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // ── Canvas & Surfaces ────────────────────────────────
        // Warm porcelain canvas, crisp white cards, soft warm tints.
        canvas: '#FAF7F2',
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F3EDE3', // warm tint — chips, icon wells, muted fills
          3: '#E9E2D5', // deeper tint — hovers, pressed states
        },
        line: {
          DEFAULT: '#E7DFD1', // hairline borders
          strong: '#D8CDBC',
        },
        // ── Ink (warm espresso text scale) ───────────────────
        ink: {
          50: '#FAF7F2',
          100: '#F3EDE3',
          200: '#E9E2D5',
          300: '#D8CDBC',
          400: '#A2937F', // faint / placeholder
          500: '#7D6F5E', // muted text
          600: '#5F5142', // body text
          700: '#463A2E', // strong body
          800: '#33281F', // default text
          900: '#241A12', // headings
          950: '#191009', // dark chrome (sidebar), deepest text
        },
        // ── Brand (Deep Burgundy) ────────────────────────────
        brand: {
          50: '#F9F1F0',
          100: '#F2E0E0',
          200: '#E3C3C6',
          300: '#CE9AA1',
          500: '#8C3D47',
          600: '#722F37',
          700: '#5C252C',
          800: '#461C22',
          900: '#321318',
        },
        // ── Status ───────────────────────────────────────────
        success: {
          50: '#EAF7EE',
          200: '#BFE6CC',
          300: '#86DCA9',
          500: '#2E9B68',
          600: '#268457',
          700: '#1E6B47',
        },
        pending: { 50: '#FDF3E0', 500: '#D99000', 600: '#A96D0B' },
        warning: { 50: '#FDF0E7', 500: '#E07A3F', 600: '#B85C25' },
        info: { 50: '#EBF2FA', 500: '#3B6B99', 600: '#33618F' },
        gold: { 500: '#C08B27', 600: '#A87621' },
        danger: {
          50: '#FEF3F2',
          100: '#FEE4E2',
          200: '#FECDCA',
          500: '#D92D20',
          600: '#B42318',
          700: '#912018',
        },
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16,12,8,0.04)',
        card:
          '0 1px 2px rgba(16,12,8,0.04), 0 12px 32px -16px rgba(16,12,8,0.10)',
        'card-hover':
          '0 2px 6px rgba(16,12,8,0.05), 0 20px 44px -20px rgba(16,12,8,0.16)',
        pop: '0 24px 64px -16px rgba(16,12,8,0.22), 0 8px 20px -8px rgba(16,12,8,0.08)',
      },
    },
  },
  plugins: [],
};
