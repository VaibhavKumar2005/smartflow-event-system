/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Layered gray surfaces (NOT pure black)
        surface: {
          50:  'hsl(220, 30%, 97%)',
          100: 'hsl(220, 25%, 14%)',
          200: 'hsl(220, 25%, 11%)',
          300: 'hsl(220, 25%, 9%)',
          400: 'hsl(220, 25%, 7%)',
          500: 'hsl(220, 26%, 5%)',
        },
        border: {
          DEFAULT: 'hsl(220, 20%, 18%)',
          strong:  'hsl(220, 20%, 24%)',
        },
        // Brand
        brand: {
          50:  'hsl(226, 100%, 97%)',
          400: 'hsl(226, 85%, 65%)',
          500: 'hsl(226, 85%, 58%)',
          600: 'hsl(226, 85%, 50%)',
        },
        accent: {
          400: 'hsl(263, 70%, 68%)',
          500: 'hsl(263, 65%, 60%)',
        },
        // Status
        low:    'hsl(142, 65%, 48%)',
        medium: 'hsl(38,  90%, 52%)',
        high:   'hsl(0,   70%, 54%)',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 8px hsla(263,70%,68%,0.4), 0 0 20px hsla(263,70%,68%,0.15)' },
          '100%': { boxShadow: '0 0 16px hsla(263,70%,68%,0.65), 0 0 40px hsla(263,70%,68%,0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'card':  '0 4px 20px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset',
        'card-hover': '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset',
        'brand': '0 4px 20px hsla(226,85%,58%,0.3)',
        'glow-purple': '0 0 20px hsla(263,70%,68%,0.5)',
        'glow-green':  '0 0 16px hsla(142,65%,48%,0.45)',
        'glow-red':    '0 0 16px hsla(0,70%,54%,0.45)',
      },
    },
  },
  plugins: [],
}
