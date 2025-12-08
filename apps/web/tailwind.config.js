/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // D&D Theme Colors
        primary: {
          DEFAULT: '#D4AF37', // Gold
          dark: '#B8860B',
          light: '#FFD700',
        },
        secondary: {
          DEFAULT: '#8B0000', // Dark Red
          dark: '#660000',
          light: '#B22222',
        },
        accent: {
          DEFAULT: '#4A90A4', // Steel Blue
          dark: '#2F6B7D',
          light: '#6BB5CB',
        },
        bg: {
          dark: '#1A1A2E',
          medium: '#16213E',
          light: '#0F3460',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          muted: '#707070',
        },
        border: '#3A3A5A',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#17A2B8',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      animation: {
        'dice-roll': 'dice-roll 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'dice-roll': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
