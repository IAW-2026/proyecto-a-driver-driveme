/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#CFFF04',
          hover: '#B5E600',
        },
        alert: '#FF007F',
        info: '#8B5CF6',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}