import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A0F34',
          hover: '#511747',
          tint: '#F0E7EE',
        },
        accent: {
          DEFAULT: '#EAAA00',
          tint: '#FFF3CC',
        },
        secondary: {
          DEFAULT: '#EAAA00',
          tint: '#FFF3CC',
        },
        bg: '#E5E4E2',
        surface: '#F7F6F5',
        ink: {
          DEFAULT: '#3A0F34',
          muted: '#6B6269',
        },
        line: '#D1CECB',
        success: '#2F6F5E',
        warning: '#B7791F',
        danger: '#B3261E',
      },
      fontFamily: {
        serif: ['Source Serif 4', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Be Vietnam Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(31,26,36,0.08)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
} satisfies Config
