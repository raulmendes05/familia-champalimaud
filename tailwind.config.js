/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta da família: dourado + roxo sobre fundo escuro
        champi: {
          gold: '#d4af37',
          'gold-soft': '#e8c969',
          'gold-dim': '#9a7d28',
          purple: '#7c4dff',
          'purple-deep': '#4a2b8c',
          'purple-soft': '#a98bff',
          ink: '#140d1c',
          'ink-2': '#1a1023',
          'ink-3': '#241634',
          panel: '#1e1430',
          line: '#3a2a55',
          text: '#ece6f5',
          'text-dim': '#a99cc4',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(124, 77, 255, 0.45)',
        'glow-gold': '0 0 24px -4px rgba(212, 175, 55, 0.5)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
