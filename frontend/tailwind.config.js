export default {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#6C72FF',
          dark: '#6C72FF',
        },
        secondary: {
          light: '#57C3ff',
          dark: '#57C3ff',
          100: '#101935',
          200: '#34354F',
          300: '#57C3ff',
          400: '#9A91FB',
          500: '#FDB52A'
        },
        neutral: {
          light: '#FFFFFF',
          dark: '#FFFFFF',
          100: '#080F25',
          200: '#212C4D',
          300: '#AEB9E1',
          400: '#D1DBF9',
          500: '#37446B',
          600: '#7E89AC',
          700: '#D9E1FA',
        },
        background: {
          light: '#FFFFFF',
          dark: '#080F25',
        },
        text: {
          light: '#080F25',
          dark: '#D9E1FA',
        }
      },
    },
  },
  plugins: [],
};