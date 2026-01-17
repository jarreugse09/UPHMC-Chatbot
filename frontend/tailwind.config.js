/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        perps: {
          red: "#C1272D",
          darkred: "#8B1A1F",
          yellow: "#FDB913",
          cream: "#F5F5F0",
          dark: "#1a1a18",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
