/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Soft dark (Height/Notion/Linear-style) ────────────────
        bg:   '#0b1220',   // page background — slightly warmer than before
        card: '#0f172a',   // card surface
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
        'text-main': '#e5e7eb',
        'text-sub':  '#9ca3af',
        muted:       '#6b7280',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
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
        // Subtle — no glow, just a whisper of depth
        card: '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
