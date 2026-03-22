import type { Config } from "tailwindcss";

/** v4: content is auto-detected; typography is loaded via `@plugin` in globals.css */
export default {
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
} satisfies Config;
