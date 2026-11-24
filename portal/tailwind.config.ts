import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
        bg0: "var(--bg-0)",
        bg1: "var(--bg-1)",
        canvas: "var(--bg-0)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-hi)",
        },
        elev: "var(--elev)",

        /* Text Hierarchy */
        hi: "var(--text-hi)",
        mid: "var(--text-mid)",
        low: "var(--text-low)",
        faint: "var(--text-faint)",
        ink: {
          DEFAULT: "var(--text-hi)",
          muted: "var(--text-mid)",
          faint: "var(--text-low)",
          dim: "var(--text-faint)",
        },

        /* Accents & Brand */
        accent: {
          DEFAULT: "var(--accent)",
          glow: "rgb(143, 139, 255)",
          cyan: "var(--accent-2)",
        },
        accent2: "var(--accent-2)",
        spotify: "#1ED760",
        amber: "#F3C64F",

        /* shadcn semantic tokens */
        background: "var(--bg-0)",
        foreground: "var(--text-hi)",
        popover: {
          DEFAULT: "var(--panel)",
          foreground: "var(--text-hi)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "#0a0a0e",
        },
        secondary: {
          DEFAULT: "var(--panel)",
          foreground: "var(--text-hi)",
        },
        muted: {
          DEFAULT: "var(--panel)",
          foreground: "var(--text-low)",
        },
        destructive: {
          DEFAULT: "#b91c1c",
          foreground: "#f5f5f8",
        },
        border: "var(--hairline)",
        input: "rgba(255, 255, 255, 0.12)",
        ring: "var(--accent)",

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
  plugins: [tailwindcssAnimate],
};

export default config;
