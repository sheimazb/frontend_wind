/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
      },
      backgroundImage: {
        'gradient-discord': 'linear-gradient(to right, #E1567C, #9F3996)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

