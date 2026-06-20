import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartFace AI — Enterprise Smart Attendance & Biometric Security Suite",
  description: "Next-gen deep learning biometric check-ins with sub-second facial matching, active intruder detection, time-synced dynamic QR rotation, and live Google Sheets sync.",
  keywords: ["AI Attendance", "Biometric Security", "ArcFace", "Dynamic QR", "Classroom Automation", "FastAPI WebSocket", "Google Sheets Sync"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-space text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
