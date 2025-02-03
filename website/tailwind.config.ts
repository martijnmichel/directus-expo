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
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(2deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "subtle-spin": "subtle-spin 20s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
