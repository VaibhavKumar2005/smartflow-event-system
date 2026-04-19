/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Three distinct surface layers (key to making cards pop) ──
        bg:      '#060d18',   // page bg — very deep navy, almost black
        surface: '#0d1829',   // panel/card surface — clearly lighter
        elevated:'#131f35',   // inputs, inner elements — another step up

        // Brand
        primary: {
          DEFAULT: '#6366f1',
          light:   '#818cf8',
          dark:    '#4f46e5',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light:   '#a78bfa',
        },
        // Semantic
        success: '#22c55e',
        warning: '#f59e0b',
        danger:  '#ef4444',
        // Text
        'text-main': '#e2e8f0',
        'text-sub':  '#94a3b8',
        muted:       '#64748b',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
      animation: {
        'fade-in':  'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
        glow: '0 0 20px rgba(99,102,241,0.15)',
      },
    },
  },
  plugins: [],
}
