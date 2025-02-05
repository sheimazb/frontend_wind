/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        stroke: '#E2E8F0',
        meta: {
          1: '#DC2626',
          4: '#1F2937'
        },
        darkbackground: '#24303F',
        darksecondry: '#1A222C',
        darkboder:'#24303F',
        ligthbackground: '#ECE6CE',
        strokedark: '#2E3A47'
      }
    },
  },
  plugins: [],
}

