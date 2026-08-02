/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foxpro: {
          header: '#1e3a8a',
          accent: '#f59e0b',
          border: '#3b82f6',
          bg: '#0f172a',
          focus: '#facc15',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
