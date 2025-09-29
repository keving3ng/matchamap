/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          50: '#f4f8f0',
          100: '#e6f2dc',
          200: '#d1e7c4',
          300: '#aed581', // Light Matcha
          400: '#9ccc65',
          500: '#7cb342', // Primary Matcha
          600: '#689f38',
          700: '#558b2f', // Dark Matcha
          800: '#33691e',
          900: '#1b5e20',
        },
        cream: {
          50: '#fefdfb',
          100: '#faf7f2', // Cream Background
          200: '#f5f0e8',
          300: '#ede4d3',
          400: '#e0d0b7',
          500: '#d4bc98',
        },
        charcoal: {
          50: '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#2e2e2e', // Charcoal Text
        },
        accent: {
          pink: '#f8bbd9', // Accent Pink
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}