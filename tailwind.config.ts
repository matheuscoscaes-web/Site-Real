import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8ee",
          100: "#faeece",
          200: "#f4d98e",
          300: "#edb94a",
          400: "#e59e25",
          500: "#c97f10",
          600: "#a8650b",
          700: "#955707",
          800: "#7a4508",
          900: "#653a0a",
          950: "#3a1e05",
        },
        cream: {
          50:  "#fdfaf5",
          100: "#f9f3e8",
          200: "#f2e4cc",
          300: "#e8ceaa",
          400: "#ddb47e",
          500: "#c99255",
          600: "#b07a38",
          700: "#8f612a",
          800: "#754e25",
          900: "#5f3f1f",
        },
        gold: "#955707",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #be1248 0%, #f43f76 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
