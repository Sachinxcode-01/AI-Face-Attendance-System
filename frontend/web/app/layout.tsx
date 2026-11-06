import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFace AI — Enterprise Smart Attendance & Biometric Security Suite",
  description:
    "Next-gen deep learning biometric check-ins with sub-second facial matching, active intruder detection, time-synced dynamic QR rotation, and live Google Sheets sync.",
  keywords: [
    "AI Attendance",
    "Biometric Security",
    "ArcFace",
    "Dynamic QR",
    "Classroom Automation",
    "FastAPI WebSocket",
    "Google Sheets Sync",
  ],
  authors: [{ name: "SmartFace AI Team" }],
};

export const viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      {/*
        Inject --font-geist-sans and --font-geist-mono as system font stacks.
        This avoids any network fetch to Google Fonts and requires no local
        font files, while keeping every var(--font-geist-*) reference working.
      */}
      <head>
        <style>{`
          :root {
            --font-geist-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
              "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            --font-geist-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
          }
        `}</style>
      </head>
      <body className="antialiased bg-space text-primary-text">{children}</body>
    </html>
  );
}
