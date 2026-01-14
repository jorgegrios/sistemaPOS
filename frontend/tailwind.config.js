/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444'
      },
      screens: {
        'tablet': '768px',
        'tablet-lg': '1024px',
        // Orientaciones
        'landscape': {'raw': '(orientation: landscape)'},
        'portrait': {'raw': '(orientation: portrait)'},
        // Tablets específicos
        'tablet-landscape': {'raw': '(min-width: 768px) and (orientation: landscape)'},
        'tablet-portrait': {'raw': '(min-width: 768px) and (orientation: portrait)'},
      }
    }
  },
  plugins: []
};
