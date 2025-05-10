/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Bree Serif', 'serif'],
        bree: ['Bree Serif', 'serif'],
      },
      colors: {
        primary: '#111036',
        stroke: '#E2E8F0',
        sentry: '#2d1e69',
        'sentry-purple': '#2d1e69',
        'sentry-dark': '#1d1132',
        'sentry-accent': '#e1567c',
        meta: {
          1: '#DC2626',
          4: '#1F2937'
        },
        darkbackground: '#24303F',
        darksecondry: '#1A222C',
        darkboder:'#24303F',
        ligthbackground: '#ECE6CE',
        strokedark: '#2E3A47',
        'sentry': {
          purple: '#2B1D38',
          accent: '#362C45',
        },
        warning: '#FFB84D',
        gray: {
          650: '#3B4758', // Custom gray color for dark hover states
          750: '#2A3441', // Custom gray color for dark backgrounds
          850: '#1E2836', // Even darker gray for deep backgrounds
        },
      },
      backgroundImage: {
        'gradient-discord': 'linear-gradient(to right, #E1567C, #9F3996)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
