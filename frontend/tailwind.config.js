/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Deep sleek modern Google UI darks
        surface: {
          50:  '#FAFAFA',
          100: '#2A2B2E',
          200: '#1F2022',
          300: '#151618',
          400: '#0F0F11',
          500: '#0A0A0A',
        },
        border: {
          DEFAULT: '#262626',
          strong:  '#333333',
        },
        // Modern bright lime green (Google Gemini/Tech aesthetic)
        brand: {
          50:  '#F4FFE0',
          400: '#C2FF33',
          500: '#A8FF53', 
          600: '#8CE62E',
        },
        accent: {
          400: '#00D1FF', // Cyan / Teal contrast against lime
          500: '#00B8E6',
        },
        // Status colors 
        low:    '#00FF85',   // More neon green
        medium: '#FFC800',   // Vivid yellow-orange
        high:   '#FF3366',   // Vivid pink-red
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'float':      'float 3s ease-in-out infinite',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 8px hsla(85, 100%, 66%, 0.4), 0 0 20px hsla(85, 100%, 66%, 0.15)' },
          '100%': { boxShadow: '0 0 16px hsla(85, 100%, 66%, 0.65), 0 0 40px hsla(85, 100%, 66%, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset',
        'brand':      '0 4px 20px hsla(85, 100%, 66%, 0.2)',
        'glow-brand': '0 0 20px hsla(85, 100%, 66%, 0.4)',
        'glow-accent':'0 0 16px hsla(191, 100%, 50%, 0.4)',
        'glow-red':   '0 0 16px hsla(345, 100%, 60%, 0.45)',
      },
    },
  },
  plugins: [],
}
