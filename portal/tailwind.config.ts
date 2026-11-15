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
        "card-elevated": "#141D38",
        border: "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(99, 102, 241, 0.3)",
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          light: "#6366F1",
          dark: "#3730A3",
        },
        success: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.25)",
        },
        danger: {
          DEFAULT: "#EF4444",
          glow: "rgba(239, 68, 68, 0.25)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.25)",
        },
        text: {
          heading: "#F1F3F9",
          body: "#C8CCDF",
          muted: "#7C82A0",
          accent: "#9AA4EC",
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
