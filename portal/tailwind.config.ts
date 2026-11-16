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
        /* ByTune Measured Surface Tokens */
        bg0: "#050507",
        bg1: "#0A0A0E",
        canvas: "#050507",
        surface: "#101016",
        panel: "#16161D",
        card: "#101016",
        elev: "#1E1E27",

        /* Text Hierarchy */
        hi: "#F5F5F8",
        mid: "#B6B6C2",
        low: "#8A8A97",
        faint: "#60606C",
        ink: {
          DEFAULT: "#F5F5F8",
          muted: "#B6B6C2",
          faint: "#8A8A97",
          dim: "#60606C",
        },

        /* Accents & Brand */
        accent: {
          DEFAULT: "#8F8BFF",
          glow: "rgb(143, 139, 255)",
          cyan: "#6FD8FF",
        },
        accent2: "#6FD8FF",
        spotify: "#1ED760",
        amber: "#F3C64F",

        /* Indigo Aliases (Mapped directly to ByTune violet scale) */
        indigo: {
          50: "#F2F1FF",
          100: "#E0DFFF",
          200: "#C2C0FF",
          300: "#A5A2FF",
          400: "#8F8BFF",
          500: "#8F8BFF",
          600: "#7A75F0",
          700: "#625DD0",
          800: "#4D48B5",
          900: "#16162A",
          950: "#0D0D18",
        },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "10px",
        md: "10px",
        lg: "16px",
        xl: "22px",
        "2xl": "22px",
        "22": "22px",
        card: "22px",
        pill: "999px",
        full: "999px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "var(--font-poppins)", "Chivo", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Cascadia Code", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-card-elevated)",
        inset: "var(--shadow-inset-highlight)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-40%)", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateY(330%)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        pipFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(1.2deg)" },
        },
      },
      animation: {
        scan: "scan 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        float: "float 7.5s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        pipFloat: "pipFloat 6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
      transitionTimingFunction: {
        bytune: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
},
  plugins: [],
};

export default config;
