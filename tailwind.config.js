/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#070235',
        'primary-container': '#1e1b4b',
        'on-primary': '#ffffff',
        'on-primary-container': '#8683ba',
        'primary-fixed': '#e3dfff',
        'primary-fixed-dim': '#c4c1fb',
        'on-primary-fixed': '#181445',
        'on-primary-fixed-variant': '#444173',
        secondary: '#4648d4',
        'secondary-container': '#6063ee',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#fffbff',
        'secondary-fixed': '#e1e0ff',
        'secondary-fixed-dim': '#c0c1ff',
        'on-secondary-fixed': '#07006c',
        'on-secondary-fixed-variant': '#2f2ebe',
        tertiary: '#070c14',
        'tertiary-container': '#1d222b',
        'on-tertiary': '#ffffff',
        'tertiary-fixed': '#dee2ef',
        surface: '#f9f9fe',
        'surface-bright': '#f9f9fe',
        'surface-dim': '#d9dade',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f8',
        'surface-container': '#ededf2',
        'surface-container-high': '#e8e8ed',
        'surface-container-highest': '#e2e2e7',
        'surface-variant': '#e2e2e7',
        'surface-tint': '#5b598c',
        background: '#f9f9fe',
        'on-surface': '#1a1c1f',
        'on-surface-variant': '#47464f',
        'on-background': '#1a1c1f',
        outline: '#787680',
        'outline-variant': '#c8c5d0',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        card: '1.25rem',
        lg: '2rem',
        xl: '3rem'
      },
      boxShadow: {
        card: '0px 8px 30px -4px rgba(30, 27, 75, 0.04)',
        'card-elevated':
          '0px 20px 40px -8px rgba(99, 102, 241, 0.12), 0px 4px 12px -2px rgba(30, 27, 75, 0.03)',
        pill: '0px 12px 28px -4px rgba(30, 27, 75, 0.15)'
      }
    }
  },
  plugins: []
};
