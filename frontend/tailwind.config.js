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
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
      },
      keyframes: {
        slideUp: {
          '0%': {
            transform: 'translateY(100%) scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0) scale(1)',
            opacity: '1',
          },
        },
        slideDown: {
          '0%': {
            transform: 'translateY(-20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideInLeft: {
          '0%': {
            transform: 'translateX(-100%) scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
        },
        slideInRight: {
          '0%': {
            transform: 'translateX(100%) scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        fadeOut: {
          '0%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
          },
        },
        scaleIn: {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
      },
    },
  },
  plugins: [],
}