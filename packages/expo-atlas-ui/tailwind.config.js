const expoTheme = require('@expo/styleguide/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...expoTheme,
  darkMode: ['class', 'dark-theme'],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
    './ui/**/*.{js,jsx,ts,tsx}',
    './utils/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  plugins: [require('tailwindcss-animate'), require('tailwind-gradient-mask-image')],
};
