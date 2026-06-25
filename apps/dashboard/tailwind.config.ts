import type { Config } from 'tailwindcss'
  const config: Config = {
    content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
      extend: {
        colors: {
          bg: { DEFAULT: '#020817', surface: '#0F1629', card: '#141C2E', border: '#1E2D45' },
          brand: { DEFAULT: '#0099FF', light: '#00D4FF', dark: '#0077CC' },
          text: { primary: '#F1F5F9', secondary: '#94A3B8', muted: '#64748B' },
          status: { connected: '#10B981', disconnected: '#EF4444', warning: '#F59E0B', info: '#3B82F6' },
        },
        backgroundImage: {
          'gradient-brand': 'linear-gradient(135deg, #0099FF, #00D4FF)',
          'gradient-dark': 'linear-gradient(180deg, #020817 0%, #071B3A 100%)',
        },
        fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      },
    },
    plugins: [],
  }
  export default config
  