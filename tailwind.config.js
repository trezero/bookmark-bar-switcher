/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./src/popup/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        "background-dark": "#0A0C10",
        "card-dark": "rgba(22, 27, 34, 0.8)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
      },
    },
  },
  plugins: [],
}
