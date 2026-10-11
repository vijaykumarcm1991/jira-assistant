/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jira: {
          blue: '#0052CC',
          darkBlue: '#172B4D',
          lightBlue: '#DEEBFF',
          accent: '#0065FF',
          hover: '#0747A6'
        }
      }
    },
  },
  plugins: [],
}
