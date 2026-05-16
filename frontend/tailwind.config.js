/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cork: {
          50:  '#fdf8f0',
          100: '#f7e9d3',
          200: '#efd3a7',
          300: '#e4b87a',
          400: '#d49a50',
          500: '#c17f38',
          600: '#a6652e',
          700: '#874f27',
          800: '#6e3f22',
          900: '#5a331d',
        },
        note: {
          yellow:  '#fef08a',
          blue:    '#bfdbfe',
          green:   '#bbf7d0',
          pink:    '#fbcfe8',
          purple:  '#ddd6fe',
          orange:  '#fed7aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      boxShadow: {
        note: '2px 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        'note-hover': '4px 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
        pin: '0 2px 8px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'cork-texture': "url('/textures/cork.svg')",
      },
    },
  },
  plugins: [],
};
