/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E85D04',
          'orange-dark': '#C44A00',
          'orange-light': '#FF7A2E',
          black: '#0A0A0A',
          'black-soft': '#1A1A1A',
          'black-muted': '#2A2A2A',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { brand: '0 4px 20px rgba(232, 93, 4, 0.25)' },
    },
  },
  plugins: [],
};