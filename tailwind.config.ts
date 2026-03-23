import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'Georgia', 'Times New Roman', 'serif'],
        arabic: [
          'Noto Naskh Arabic',
          'Traditional Arabic',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-8px) translateX(-50%)' },
          to: { opacity: '1', transform: 'translateY(0) translateX(-50%)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(-12px)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
