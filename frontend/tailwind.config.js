// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fiori: {
          blue: '#171717', // Drevo Black
          'blue-dark': '#000000', // Drevo True Black
          green: '#30914C',
          red: '#BB0000',
          orange: '#E76500',
          yellow: '#C87B00',
          gray: '#32363A',
          'gray-light': '#F5F6F7',
          'gray-mid': '#89919A',
          border: '#D9D9D9',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        fiori: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)',
        'fiori-md': '0 0 0 1px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
