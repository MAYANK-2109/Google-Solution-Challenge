/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg:          'var(--brand-bg)',
          surface:     'var(--brand-surface)',
          card:        'var(--brand-card)',
          border:      'var(--brand-border)',
          accent:      'var(--brand-accent)',
          accentHover: 'var(--brand-accent-hover)',
          danger:      'var(--brand-danger)',
          dangerDark:  'var(--brand-danger-dark)',
          warning:     '#f59e0b',
          success:     '#10b981',
          text:        'var(--brand-text)',
          muted:       'var(--brand-muted)',
          subtle:      'var(--brand-subtle)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':    'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'fade-in-up':   'fadeInUp 0.6s ease-out both',
        'slide-up':     'slideUp 0.3s ease-out',
        'glow-red':     'glowRed 1.5s ease-in-out infinite alternate',
        'glow-blue':    'glowBlue 2s ease-in-out infinite alternate',
        'float':        'float 4s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },                              to: { opacity: 1 } },
        fadeInUp: { from: { opacity: 0, transform: 'translateY(32px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowRed:  {
          from: { boxShadow: '0 0 10px rgba(239,68,68,0.4)' },
          to:   { boxShadow: '0 0 30px rgba(239,68,68,0.9), 0 0 60px rgba(239,68,68,0.4)' },
        },
        glowBlue: {
          from: { boxShadow: '0 0 10px rgba(59,130,246,0.3)' },
          to:   { boxShadow: '0 0 40px rgba(59,130,246,0.7), 0 0 80px rgba(59,130,246,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
