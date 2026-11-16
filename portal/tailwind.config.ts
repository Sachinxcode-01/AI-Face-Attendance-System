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
        canvas: "#050507",
        surface: "#101016",
        panel: "#16161D",
        card: "#0E1428",
        elev: "#1E1E27",
        accent: {
          DEFAULT: "#8F8BFF",
          glow: "rgb(143, 139, 255)",
          cyan: "#6FD8FF",
        },
        ink: {
          DEFAULT: "#F5F5F8",
          muted: "#B6B6C2",
          faint: "#8A8A97",
          dim: "#60606C",
        },
      },
      borderRadius: {
        '22': '22px',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-poppins)", "sans-serif"],
      },
      transitionTimingFunction: {
        'bytune': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
},
  plugins: [],
};

export default config;
