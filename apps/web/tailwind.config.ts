import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        // Instagram-style story gradient, starting from the brand orange
        ig: 'linear-gradient(45deg, #fdba74 0%, #f97316 22%, #ec4899 58%, #a855f7 82%, #6366f1 100%)',
      },
      colors: {
        // Landing page: warm black, flour cream, oven ember
        ink: '#0b0a09',
        cream: '#f3ede3',
        ember: '#ff6b1a',
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
        'spin-slow': 'spin 6s linear infinite',
        marquee: 'marquee 9s linear infinite',
        // One turn of the reel's 3D dish (auto-rotate at 20deg/s)
        'reel-progress': 'reel-progress 18s linear infinite',
        'swipe-hint': 'swipe-hint 1.4s ease-in-out infinite',
        'ken-burns': 'ken-burns 14s ease-in-out infinite alternate',
        'scroll-line': 'scroll-line 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite',
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'reel-progress': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'swipe-hint': {
          '0%, 100%': { transform: 'translateY(4px)', opacity: '0.6' },
          '50%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        'ken-burns': {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.08)' },
        },
        'scroll-line': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(200%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
