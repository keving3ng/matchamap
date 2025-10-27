/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matcha: {
          50: '#e8f5eb',  // Very light
          100: '#d1ebd7', // Light
          200: '#ade3ba', // Light mid
          300: '#82ca94', // Mid light
          400: '#66ba7b', // Light
          500: '#51aa63', // Primary
          600: '#418853', // Dark
          700: '#356e44', // Darker
          800: '#295435', // Very dark
          900: '#1b3a23', // Almost black green
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
        },
        // Dark mode color scheme
        dark: {
          bg: {
            primary: '#0a0e0b',    // Very dark green-black
            secondary: '#1a2420',  // Dark matcha background
            tertiary: '#2a3830',   // Lighter dark green
            elevated: '#1f2d24',   // Elevated surfaces
          },
          text: {
            primary: '#f0f4f1',    // Light cream for primary text
            secondary: '#c5d3c9',  // Muted light green for secondary text
            tertiary: '#9aa89e',   // More muted for tertiary text
          },
          matcha: {
            50: '#1b3a23',   // Dark matcha (flipped)
            100: '#295435',  // 
            200: '#356e44',  //
            300: '#418853',  //
            400: '#51aa63',  // Primary (same)
            500: '#66ba7b',  // 
            600: '#82ca94',  //
            700: '#ade3ba',  //
            800: '#d1ebd7',  //
            900: '#e8f5eb',  // Light matcha (flipped)
          },
          border: {
            primary: '#374531',    // Dark green border
            secondary: '#4a5748',  // Lighter dark border
            accent: '#5a6b58',     // Accent border
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pacifico: ['Pacifico', 'cursive'],
        caveat: ['Caveat', 'cursive'],
        satisfy: ['Satisfy', 'cursive'],
      },
      screens: {
        'xs': '375px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down-out': 'slideDownOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
        slideDownOut: {
          '0%': {
            transform: 'translateY(0) scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100%) scale(0.95)',
            opacity: '0',
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