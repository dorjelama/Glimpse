/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f3f4f6',
        panel: '#1e1e2e',
        'panel-light': '#2a2a3d',
        accent: '#7c3aed',
        'accent-hover': '#6d28d9',
        terra: '#B85C37',
        ink: '#1E130C',
        cream: '#F6EBDD',
        gold: '#CFAC64',
        blush: '#F9CDB5',
      },
    },
  },
  plugins: [],
};
