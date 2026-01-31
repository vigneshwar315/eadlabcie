/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",   // deep slate
        accent: "#0369a1",    // teal-ish
        card: "#f8fafc"
      }
    },
  },
  plugins: [],
};
