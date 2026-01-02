/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'tablet': '768px',
        'ipad': '820px',
        'ipad-pro': '1024px',
      },
    },
  },
  plugins: [],
};
