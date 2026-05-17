/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Default premium dark mode
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#030712', // Pure deep onyx
        },
        brand: {
          indigo: '#4f46e5', // Deep glowing violet
          teal: '#0d9488', // Premium accent teal
          ruby: '#e11d48', // Warning/Archived state
          amber: '#d97706', // Suspended state
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(79, 70, 229, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
