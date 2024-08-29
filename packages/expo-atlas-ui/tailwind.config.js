const expoTheme = require('@expo/styleguide/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...expoTheme,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  plugins: [require('tailwindcss-animate'), require('tailwind-gradient-mask-image')],
};
