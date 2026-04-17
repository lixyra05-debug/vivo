/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#8BAD8B',
          50: '#F1F5F1',
          100: '#E2EBE2',
          200: '#C6D8C6',
          300: '#A9C4A9',
          400: '#8BAD8B',
          500: '#709770',
          600: '#587858',
          700: '#405A40',
          800: '#2B3E2B',
          900: '#172317',
        },
        cream: {
          DEFAULT: '#FAFAF7',
          50: '#FFFFFF',
          100: '#FAFAF7',
          200: '#F3F3EC',
          300: '#E7E7DA',
          400: '#D0D0BE',
        },
        earth: {
          DEFAULT: '#C4A882',
          50: '#F6F1E9',
          100: '#EDE2CF',
          200: '#DCC7A6',
          300: '#C4A882',
          400: '#A8895F',
          500: '#866B46',
          600: '#644F33',
          700: '#443622',
        },
        score: {
          green: '#4CAF50',
          yellow: '#FFC107',
          orange: '#FF9800',
          red: '#F44336',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['BricolageGrotesque', 'System'],
      },
      borderRadius: {
        vivo: '18px',
      },
    },
  },
  plugins: [],
};
