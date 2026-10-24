import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#5B3A8C', hover: '#4A2E75', tint: '#EFE9F7' },
        accent: { DEFAULT: '#C8963E', tint: '#F8EEDB' },
        secondary: { DEFAULT: '#2F6F5E', tint: '#E3F1EC' },
        bg: '#FAF6EE', surface: '#FFFFFF',
        ink: { DEFAULT: '#1F1A24', muted: '#6B6475' }, line: '#E7E0D3',
        success: '#2F6F5E', warning: '#B7791F', danger: '#B3261E',
      },
      fontFamily: {
        serif: ['Source Serif 4', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Be Vietnam Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '16px', control: '12px' },
      boxShadow: { card: '0 2px 8px rgba(31,26,36,0.08)' },
      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
} satisfies Config
