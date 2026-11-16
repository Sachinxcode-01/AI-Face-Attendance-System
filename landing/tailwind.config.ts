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
        spotify: "#1ed760",
        amber: "#f3c64f",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "10px",
        md: "10px",
        lg: "16px",
        xl: "22px",
        "2xl": "22px",
        card: "22px",
        pill: "999px",
        full: "999px",
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
      },
      animation: {
        scan: "scan 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        float: "Hero_float 7.5s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        pipFloat: "DesktopSection_pipFloat 6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
