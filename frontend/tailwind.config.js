/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Outfit', 'sans-serif'],
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Premium Slate/Amber palette used throughout the app
        brand: {
          amber: '#ffb663',
          blue: '#599cff',
          emerald: '#45b37b',
          crimson: '#cc4e6d',
        },
      },
      backgroundImage: {
        'glass-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 24px 80px rgba(0,0,0,0.35)',
        'glass-sm': '0 8px 32px rgba(0,0,0,0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
