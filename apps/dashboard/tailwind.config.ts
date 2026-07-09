import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D4FF',
          50: '#E6F9FF',
          100: '#B3EFFF',
          200: '#80E5FF',
          300: '#4DDBFF',
          400: '#1AD1FF',
          500: '#00D4FF',
          600: '#00A8CC',
          700: '#007C99',
          800: '#005066',
          900: '#002433',
        },
        accent: {
          DEFAULT: '#7C3AED',
          50: '#F0E6FF',
          100: '#D4B3FF',
          200: '#B880FF',
          300: '#9C4DFF',
          400: '#8C3AED',
          500: '#7C3AED',
          600: '#6329C4',
          700: '#4A1E9B',
          800: '#311372',
          900: '#180849',
        },
        dark: {
          DEFAULT: '#0B0F19',
          50: '#1A1F2E',
          100: '#151A28',
          200: '#111522',
          300: '#0D111C',
          400: '#0B0F19',
          500: '#080B12',
          600: '#05070C',
          700: '#020305',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          light: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.1)',
        },
        'surface-hover': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config