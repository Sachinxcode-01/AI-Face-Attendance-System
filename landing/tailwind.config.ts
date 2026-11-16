import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ByTune-measured surfaces */
        bg0: "var(--bg-0)",
        bg1: "var(--bg-1)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        elev: "var(--elev)",
        /* Text ramp */
        hi: "var(--text-hi)",
        mid: "var(--text-mid)",
        low: "var(--text-low)",
        faint: "var(--text-faint)",
        /* Accents */
        accent: "var(--accent)",
        accent2: "var(--accent-2)",
        /* Legacy brand aliases (kept for existing components) */
        canvas: "#070A14",
        brand: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
        },
        success: "#10B981",
        ink: {
          DEFAULT: "#F1F3F9",
          muted: "#A8AFC7",
          faint: "#7C82A0",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        card: "8px",
        pill: "6px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-40%)", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateY(330%)", opacity: "0" },
        },
      },
      animation: {
        scan: "scan 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
