import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#070A14",
        card: "#0E1428",
        ink: {
          DEFAULT: "#F1F3F9",
          muted: "#A8AFC7",
          faint: "#7C82A0",
        },
      },
        fontFamily: {
          sans: ["var(--font-inter)", "sans-serif"],
          display: ["var(--font-poppins)", "sans-serif"],
        },
      },
    },
    plugins: [],
  };

  export default config;
