/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        danger:  '#ef4444',
        warning: '#f59e0b',
        safe:    '#10b981',
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
}
