import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Warm cream background tones
        cream: {
          50:  '#fefcff',
          100: '#faf5ff',
          200: '#f5eeff',
        },
        // Soft pink accent
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
        },
        // Soft mint accent
        mint: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
        },
        gray: {
          50:  '#faf9fb',
          100: '#f3f2f5',
          200: '#e8e6ed',
          300: '#d2cfe0',
          400: '#9e9aad',
          500: '#6e6880',
          600: '#4e4963',
          700: '#38334a',
          800: '#221e33',
          900: '#120f1e',
        },
      },
      borderRadius: {
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(139,92,246,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 6px 20px rgba(139,92,246,0.13), 0 2px 6px rgba(0,0,0,0.06)',
        'soft': '0 4px 24px rgba(139,92,246,0.10)',
        'glow': '0 0 0 3px rgba(139,92,246,0.20)',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%':      { transform: 'rotate(4deg)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        wiggle:       'wiggle 0.6s ease-in-out',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'fade-up':    'fade-up 0.3s ease',
      },
    },
  },
  plugins: [],
};

export default config;
