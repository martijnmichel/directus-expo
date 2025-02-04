import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "subtle-spin": {
          "0%": { transform: "rotate(0deg) scaleX(1)" },
          "50%": { transform: "rotate(2deg) scaleX(4)" },
          "100%": { transform: "rotate(0deg) scaleX(1)" },
        },
      },
      animation: {
        "subtle-spin": "subtle-spin 30s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
