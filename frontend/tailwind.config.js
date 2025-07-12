export default {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f2f2f2',
          dark: '#080f25'
        },
        surface: {
          light: '#ffffffcc',
          dark: '#151C32'
        },
        overlay: {
          light: 'rgba(255, 255, 255, 0.9)',
          dark: 'rgba(8, 15, 37, 0.9)'
        },
        
        // Gray scale (neutral colors)
        gray: {
          // Light theme
          light: {
            1: '#eeeeef',
            2: '#e9eaec',
            3: '#dfe0e3',
            4: '#d6d7db',
            5: '#cecfd5',
            6: '#c6c7cd',
            7: '#b9bbc3',
            8: '#a5a7b2',
            9: '#787a85',
            10: '#6e707a',
            11: '#51525b',
            12: '#1e1f24',
            
            a1: '#27275a05',
            a2: '#0c26590a',
            a3: '#0c183c15',
            a4: '#040c2e1e',
            a5: '#01083026',
            a6: '#04092a2f',
            a7: '#040d2e3d',
            a8: '#03092b52',
            a9: '#00041a81',
            a10: '#0206188c',
            a11: '#00020faa',
            a12: '#010208e0'
          },
          
          // Dark theme
          dark: {
            1: '#0b101e',
            2: '#131827',
            3: '#1a2137',
            4: '#1e2845',
            5: '#242f50',
            6: '#293760',
            7: '#334478',
            8: '#4a5d95',
            9: '#576ba4',
            10: '#6479b3',
            11: '#9fb2e6',
            12: '#e8eefd',
            
            a1: '#c84f0004',
            a2: '#f2cf500c',
            a3: '#d9e0f616',
            a4: '#9cb7fc26',
            a5: '#94affc33',
            a6: '#81a1fc46',
            a7: '#7899fd62',
            a8: '#88a6fe84',
            a9: '#90adff95',
            a10: '#94b1fea7',
            a11: '#b2c7ffe2',
            a12: '#eaf0fffd'
          }
        },
        
        // Blue scale (primary accent)
        blue: {
          // Light theme
          light: {
            1: '#efeff2',
            2: '#e8e9f3',
            3: '#dee1f3',
            4: '#d1d6fb',
            5: '#c3c9ff',
            6: '#b2b9ff',
            7: '#9da4fd',
            8: '#8184fa',
            9: '#8589ff',
            10: '#7a7df2',
            11: '#4741b0',
            12: '#281e77',
            
            a1: '#3333f204',
            a2: '#7380ff14',
            a3: '#001aff14',
            a4: '#c3caffb1',
            a5: '#c3c9ff',
            a6: '#b2b9ff',
            a7: '#8e96ffd8',
            a8: '#3b40ff9d',
            a9: '#8589ff',
            a10: '#0208f27f',
            a11: '#080098bb',
            a12: '#0d0166e0'
          },
          
          // Dark theme
          dark: {
            1: '#0d0f1e',
            2: '#131629',
            3: '#1c2050',
            4: '#24266f',
            5: '#2d3082',
            6: '#363b92',
            7: '#4147a7',
            8: '#4d54c5',
            9: '#5d62f9',
            10: '#555ed0',
            11: '#9eaeff',
            12: '#d8e0ff',
            
            a1: '#dd100006',
            a2: '#f2a47b0c',
            a3: '#6c64fc33',
            a4: '#5b53fe57',
            a5: '#5e5cff6d',
            a6: '#6467ff80',
            a7: '#676dfe99',
            a8: '#666dfebc',
            a9: '#6065fff8',
            a10: '#6974fec9',
            a11: '#9eaeff',
            a12: '#d8e0ff'
          }
        },
        
        // Interactive states
        interactive: {
          light: {
            primary: '#8184fa',
            secondary: '#b2b9ff',
            hover: '#9da4fd',
            active: '#8184fa',
            focus: '#8589ff',
            disabled: '#c6c7cd'
          },
          dark: {
            primary: '#5d62f9',
            secondary: '#9eaeff',
            hover: '#6467ff',
            active: '#676dfe',
            focus: '#6065ff',
            disabled: '#212C4D'
          }
        },
        
        // Text colors
        text: {
          light: {
            primary: '#1e1f24',
            secondary: '#787a85',
            subtle: '#a5a7b2',
            disabled: '#c6c7cd',
            inverted: '#FFFFFF'
          },
          dark: {
            primary: '#D9E1FA',
            secondary: '#AEB9E1',
            subtle: '#7E89AC',
            disabled: '#37446B',
            inverted: '#080F25'
          }
        },
        
        // Border colors
        border: {
          light: {
            default: '#d6d7db',
            subtle: '#e9eaec',
            strong: '#787a85',
            separator: '#dfe0e3'
          },
          dark: {
            default: '#2a2f47',
            subtle: '#37446B',
            strong: '#7E89AC',
            separator: '#151C32'
          }
        }
      },
    },
  },
  plugins: [],
};