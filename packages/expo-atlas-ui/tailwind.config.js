const expoTheme = require('@expo/styleguide/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...expoTheme,
  darkMode: ['class', 'dark-theme'],
  content: ['./{app,components,providers,ui,utils}**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  plugins: [require('tailwindcss-animate'), require('tailwind-gradient-mask-image')],
};
