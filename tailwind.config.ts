import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#080808",
          800: "#0c0c0c",
          700: "#0e0e0e",
          600: "#111111",
          500: "#161616",
          400: "#1a1a1a",
          300: "#222",
          200: "#383838",
          100: "#666",
        },
        accent: {
          upper: "#FF6B35",
          lower: "#00D4AA",
          push: "#FFD700",
          pull: "#A78BFA",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Anton'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
