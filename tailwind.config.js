/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf7',
          100: '#faf6f0',
          200: '#f5ede1',
          300: '#ead4bc',
          400: '#d4a574',
          500: '#c49456',
          600: '#a8784a',
          700: '#8a5d3d',
          800: '#6b4623',
          900: '#4a2f18',
        },
      },
      backgroundImage: {
        'gradient-deep': 'linear-gradient(135deg, #0f0f1e 0%, #1a1a3e 50%, #0d1b3e 100%)',
      },
    },
  },
  plugins: [],
}
