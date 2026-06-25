/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626',
          hover: '#EF4444',
          dark: '#991B1B',
        },
        secondary: {
          DEFAULT: '#4B5563',
          hover: '#6B7280',
          dark: '#374151',
        },
        accent: '#FF0000',
        success: '#059669',
        warning: '#D97706',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'Sora', 'sans-serif'],
      },
      borderRadius: {
        'sharp': '4px',
        'card': '8px',
        'modal': '12px',
      },
    },
  },
  plugins: [],
}