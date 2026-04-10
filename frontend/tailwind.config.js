/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-black': '#0A0A0A',
        'ink': '#1A1A1A',
        'gray-700': '#555555',
        'gray-300': '#CCCCCC',
        'paper': '#F7F5F0',
        'highlight': '#F5F0DC',
        'success': '#1A5C1A',
        'danger': '#8B0000',
        'warning': '#8B5E00',
      },
      fontFamily: {
        serif: ['IBM Plex Serif', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '1px',
        md: '2px',
      },
    },
  },
  plugins: [],
}
