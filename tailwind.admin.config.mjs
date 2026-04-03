/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./admin/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0a',
        'dark-secondary': '#111111',
        gold: '#D4AF37',
        'gold-hover': '#B5952F',
        'off-white': '#f5f5f5',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Cinzel', 'serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
};
