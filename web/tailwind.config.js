/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Ubuntu","system-ui","Segoe UI","Roboto","Helvetica","Arial","sans-serif"],
        // opcional: utilidad dedicada
        ubuntu: ["Ubuntu","sans-serif"],
      },
    },
  },
  plugins: [],
}