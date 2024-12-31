/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        divider: '#2A2A2A',
        'text-primary': '#E0E0E0',
        'text-secondary': '#B0B0B0',
        'text-highlight': '#5FC9FF',
        'accent-green': {
          DEFAULT: '#33CC99',
          hover: '#28A87B'
        },
        'accent-blue': {
          DEFAULT: '#3399FF',
          hover: '#267ACC'
        },
        error: '#FF5555'
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #33CC99, #3399FF)'
      }
    },
  },
  plugins: [],
};
