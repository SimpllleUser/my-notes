/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        primary: { DEFAULT: 'var(--color-primary)', hover: 'var(--color-primary-hover)', yellow: 'var(--color-primary-yellow)' },
        secondary: { blue: 'var(--color-secondary-blue)', purple: 'var(--color-secondary-purple)', green: 'var(--color-secondary-green)' },
        accent: { mint: 'var(--color-accent-mint)', orange: 'var(--color-accent-orange)', paper: 'var(--color-accent-paper)' },
        ink: { DEFAULT: 'var(--color-ink)', light: 'var(--color-ink-light)' },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px var(--color-ink)',
        brutal: '4px 4px 0px 0px var(--color-ink)',
        'brutal-md': '6px 6px 0px 0px var(--color-ink)',
        'brutal-lg': '8px 8px 0px 0px var(--color-ink)',
      },
      borderWidth: { 3: '3px', 4: '4px' },
      borderRadius: { brutal: '12px', 'brutal-lg': '18px' },
    },
  },
  plugins: [],
}
