/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: '#F8F9FA',
        primary: { DEFAULT: '#FF3366', hover: '#E60039', yellow: '#FFEA00' },
        secondary: { blue: '#2563EB', purple: '#8A2BE2', green: '#00E676' },
        accent: { mint: '#1DE9B6', orange: '#FF6D00', paper: '#FFFFFF' },
        ink: { DEFAULT: '#000000', light: '#333333' },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        brutal: '4px 4px 0px 0px #000000',
        'brutal-md': '6px 6px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
      },
      borderWidth: { 3: '3px', 4: '4px' },
      borderRadius: { brutal: '12px', 'brutal-lg': '18px' },
    },
  },
  plugins: [],
}
