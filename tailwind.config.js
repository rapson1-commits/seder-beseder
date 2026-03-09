/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#192542', light: '#243a68', soft: '#2e4a82' },
        orange: { DEFAULT: '#F07A55', dark: '#d45f38', light: '#FEF0EB' },
        green:  { DEFAULT: '#4E9B6A', light: '#E8F5EE' },
        gold:   { DEFAULT: '#C99A2E', light: '#FDF5E0' },
        red:    { DEFAULT: '#E0655F', light: '#FDECEA' },
        blue:   { DEFAULT: '#4A82D4', light: '#EBF2FF' },
        cream:  '#F8F8F4',
      },
      fontFamily: { sans: ['var(--font-heebo)', 'sans-serif'] },
      borderRadius: { xl: '1.25rem', '2xl': '1.5rem', '3xl': '2rem' },
      boxShadow: {
        card: '0 2px 10px rgba(25,37,66,.07)',
        md:   '0 4px 22px rgba(25,37,66,.11)',
        lg:   '0 8px 44px rgba(25,37,66,.17)',
      },
    },
  },
  plugins: [],
}
