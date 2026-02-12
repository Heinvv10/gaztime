/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: '#2BBFB3',
        yellow: '#F7C948',
        dark: {
          bg: '#0f1419',
          surface: '#1a1f26',
          card: '#252d36',
          border: '#3a444e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
