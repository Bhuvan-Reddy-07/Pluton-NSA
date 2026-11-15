/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pluton: {
          bg: '#060913',
          card: '#0f172a',
          surface: '#131d36',
          border: '#1e293b',
          solar: '#f59e0b',
          earth: '#06b6d4',
          gateway: '#a855f7',
          go: '#10b981',
          nogo: '#ef4444',
          warning: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"Roboto Mono"', 'Roboto', 'monospace'],
      },
    },
  },
  plugins: [],
};

