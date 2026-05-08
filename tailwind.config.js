/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        ui: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
