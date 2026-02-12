/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#2BBFB3',
          50: '#E8F9F7',
          100: '#C6F1ED',
          200: '#8EE3DA',
          300: '#55D5C7',
          400: '#2BBFB3',
          500: '#22998F',
          600: '#1A736B',
          700: '#124D47',
          800: '#0A2624',
          900: '#020A09',
        },
        yellow: {
          DEFAULT: '#F7C948',
          50: '#FEF9E7',
          100: '#FEF3CF',
          200: '#FCE79F',
          300: '#FBDB6F',
          400: '#F9CF3F',
          500: '#F7C948',
          600: '#D6A825',
          700: '#9E7C1B',
          800: '#665011',
          900: '#2E2408',
        },
      },
    },
  },
  plugins: [],
}
