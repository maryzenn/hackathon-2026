/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './WavebackScreen.tsx', './**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        espresso: '#1C1410',
        plate: '#271D15',
        cream: '#F5EAD0',
        amber: '#E9A23B',
        burnt: '#D9652B',
        brick: '#C33D2E',
        berry: '#A93358',
      },
      fontFamily: {
        display: ['YoungSerif_400Regular'],
        sans: ['NunitoSans_400Regular'],
        sansbold: ['NunitoSans_700Bold'],
      },
    },
  },
  plugins: [],
};
