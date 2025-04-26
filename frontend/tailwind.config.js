export default {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        admin: {
          primary: {
            light: '#8355ff', // Lighter purple for light theme
            dark: '#6a37ff'   // Purple from the image
          },
          secondary: {
            light: '#4fcbff', // Lighter blue for light theme
            dark: '#41b7fb'   // Blue from the image
          },
          text: {
            light: '#333333', // Dark text for light theme
            dark: '#ffffff'   // White text from the image
          },
          background: {
            light: '#f5f7fa', // Light gray-blue background
            dark: '#0a0d1f'   // Dark blue-black from the image
          },
          surface: {
            light: '#ffffff', // White surface for light theme
            dark: '#151b33'   // Card/panel background from the image
          },
          border: {
            light: '#e0e4e8', // Light gray border for light theme
            dark: '#2a2f47'   // Border color from the image
          }
        },
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
        surface: {
          light: '#E8EAF6',
          dark: '#151C32',
        },
        text: {
          light: '#080F25',
          dark: '#D9E1FA',
        },
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};