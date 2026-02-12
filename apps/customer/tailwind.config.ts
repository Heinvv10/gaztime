import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2BBFB3',
          50: '#E5F9F7',
          100: '#CCF3EF',
          200: '#99E7DF',
          300: '#66DBCF',
          400: '#33CFBF',
          500: '#2BBFB3',
          600: '#229990',
          700: '#1A736C',
          800: '#114D48',
          900: '#092624',
        },
        accent: {
          DEFAULT: '#F7C948',
          50: '#FEF9E7',
          100: '#FDF3CF',
          200: '#FBE79F',
          300: '#F9DB6F',
          400: '#F7CF3F',
          500: '#F7C948',
          600: '#C6A13A',
          700: '#94792B',
          800: '#63501D',
          900: '#31280E',
        },
        navy: {
          DEFAULT: '#1a1a2e',
          50: '#E8E8EC',
          100: '#D1D1D9',
          200: '#A3A3B3',
          300: '#75758D',
          400: '#474767',
          500: '#1a1a2e',
          600: '#151525',
          700: '#10101C',
          800: '#0A0A12',
          900: '#050509',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(43, 191, 179, 0.3)',
        'glow-lg': '0 0 40px rgba(43, 191, 179, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;
