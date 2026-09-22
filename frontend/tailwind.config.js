/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-theme'],
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-void': '#080c14',
        'card-slate': '#0f1624',
        'card-hover': '#162034',
        'surface-navy': '#141c2e',
        'input-dark': '#0b111d',
        'brand-cyan': '#00f2fe',
        'brand-blue': '#4facfe',
        'brand-purple': '#8b5cf6',
        'bullish': '#10b981',
        'bearish': '#f43f5e',
        'neutral-gold': '#f59e0b',
        'ai-sky': '#38bdf8'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(0, 242, 254, 0.25)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.25)',
        'glow-sky': '0 0 25px rgba(56, 189, 248, 0.25)'
      }
    },
  },
  plugins: [],
}
