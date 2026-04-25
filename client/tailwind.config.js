/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:       '#0a0e1a',
          surface:  '#111827',
          card:     '#1a2235',
          border:   '#1f2d45',
          accent:   '#3b82f6',
          accentHover: '#2563eb',
          danger:   '#ef4444',
          dangerDark: '#b91c1c',
          warning:  '#f59e0b',
          success:  '#10b981',
          text:     '#e2e8f0',
          muted:    '#64748b',
          subtle:   '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-red': 'glowRed 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowRed: {
          from: { boxShadow: '0 0 10px rgba(239,68,68,0.4)' },
          to:   { boxShadow: '0 0 30px rgba(239,68,68,0.9), 0 0 60px rgba(239,68,68,0.4)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
