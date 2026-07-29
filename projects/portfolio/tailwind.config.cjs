/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#030712',
          light: '#0a0f1e',
          lighter: '#111827',
        },
        cyan: {
          DEFAULT: '#00d4ff',
          dim: '#0099cc',
        },
        matrix: {
          DEFAULT: '#00ff41',
          dim: '#00cc33',
        },
        amber: {
          DEFAULT: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
