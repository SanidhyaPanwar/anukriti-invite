/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          lavender: {
            50: '#f5f3fa',
            100: '#eae4f4',
            200: '#d7caea',
            300: '#bfa7dc',
            400: '#a37ecb',
            500: '#8c5ab9',
            600: '#7543a0',
            700: '#623588',
            800: '#522f70',
            900: '#45285c',
          },
          gold: {
            DEFAULT: '#D4AF37',
            light: '#F3E5AB'
          }
        },
        fontFamily: {
          script: ['"Great Vibes"', 'cursive'], 
          sans: ['"Montserrat"', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }