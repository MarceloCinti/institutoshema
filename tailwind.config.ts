import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: "#eef1f8", 100: "#d5dcee", 600: "#24357a", 700: "#1c2a66", 800: "#16215a", 900: "#0f1742" },
        gold: { 50: "#fbf6ea", 100: "#f4e8c6", 300: "#e2c47a", 400: "#d4ab52", 500: "#c39233", 600: "#a07425", 700: "#7c5a1d" },
        cream: "#fbf8f1",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
