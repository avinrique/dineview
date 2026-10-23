import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        // Instagram-style story gradient, starting from the brand orange
        ig: 'linear-gradient(45deg, #fdba74 0%, #f97316 22%, #ec4899 58%, #a855f7 82%, #6366f1 100%)',
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'toast-in': 'toast-in 180ms ease-out',
        'slide-up': 'slide-up 220ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
        'ar-sweep': 'ar-sweep 1.6s ease-in-out infinite',
        'heart-burst': 'heart-burst 900ms ease-out forwards',
        'heart-pop': 'heart-pop 300ms ease-out',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'ar-sweep': {
          '0%, 100%': { transform: 'translateX(-5px) rotate(-8deg)' },
          '50%': { transform: 'translateX(5px) rotate(8deg)' },
        },
        'heart-burst': {
          '0%': { opacity: '0', transform: 'scale(0.2)' },
          '15%': { opacity: '1', transform: 'scale(1.15)' },
          '30%': { transform: 'scale(0.95)' },
          '45%, 75%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1) translateY(-12px)' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
