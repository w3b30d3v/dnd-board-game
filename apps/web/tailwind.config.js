/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Gold/Amber (Magic, Action, Important)
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Secondary - Deep Purple (Mystery, Magic)
        secondary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          DEFAULT: '#8B5CF6',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Background - Dark slate/charcoal
        bg: {
          primary: '#0F0D13',
          secondary: '#1A1720',
          tertiary: '#252231',
          hover: '#2D2A3A',
          active: '#383451',
          dark: '#0F0D13',
          medium: '#1A1720',
          light: '#252231',
        },
        // Surface - For cards and containers
        surface: {
          dark: '#1E1B26',
          medium: '#2A2735',
          light: '#363342',
        },
        // Text
        text: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
          inverse: '#18181B',
          input: '#18181B', // Dark text for input fields
        },
        // Input field colors
        input: {
          bg: '#FFFFFF',
          text: '#18181B',
          placeholder: '#71717A',
          border: '#D4D4D8',
          focus: '#F59E0B',
        },
        // Borders
        border: {
          subtle: '#27272A',
          DEFAULT: '#3F3F46',
          strong: '#52525B',
          gold: '#B45309',
        },
        // Status Colors
        success: {
          DEFAULT: '#22C55E',
          bg: '#14532D',
        },
        warning: {
          DEFAULT: '#EAB308',
          bg: '#713F12',
        },
        error: {
          DEFAULT: '#EF4444',
          bg: '#7F1D1D',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: '#1E3A5F',
        },
        // Damage Type Colors
        damage: {
          fire: '#F97316',
          cold: '#06B6D4',
          lightning: '#FACC15',
          acid: '#84CC16',
          poison: '#A3E635',
          necrotic: '#6B21A8',
          radiant: '#FEF08A',
          force: '#EC4899',
          psychic: '#D946EF',
          thunder: '#8B5CF6',
          bludgeoning: '#78716C',
          piercing: '#A8A29E',
          slashing: '#D6D3D1',
        },
        // Class Colors
        class: {
          barbarian: '#E11D48',
          bard: '#D946EF',
          cleric: '#F4F4F5',
          druid: '#22C55E',
          fighter: '#92400E',
          monk: '#06B6D4',
          paladin: '#FDE68A',
          ranger: '#16A34A',
          rogue: '#3F3F46',
          sorcerer: '#DC2626',
          warlock: '#7C3AED',
          wizard: '#2563EB',
        },
        // Health Bar
        health: {
          full: '#22C55E',
          high: '#84CC16',
          medium: '#EAB308',
          low: '#F97316',
          critical: '#EF4444',
          bg: '#1C1917',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Times New Roman', 'serif'],
        cinzel: ['Cinzel', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #0F0D13 0%, #1A1720 100%)',
        'gradient-card': 'linear-gradient(135deg, #1E1B26 0%, #252231 100%)',
        'gradient-gold': 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #FCD34D 100%)',
        'gradient-magic': 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)',
        'gradient-button-primary': 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
        'gradient-button-secondary': 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)',
        'gradient-fade-up': 'linear-gradient(0deg, rgba(15,13,19,1) 0%, rgba(15,13,19,0) 100%)',
        'gradient-fade-down': 'linear-gradient(180deg, rgba(15,13,19,1) 0%, rgba(15,13,19,0) 100%)',
        'gradient-vignette': 'radial-gradient(ellipse at center, transparent 0%, rgba(15,13,19,0.8) 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-gold-lg': '0 0 40px rgba(245, 158, 11, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-purple-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(245, 158, 11, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'dramatic': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};
