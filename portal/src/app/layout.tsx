import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceBackground } from "@/components/layout/SpaceBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SmartFace Role Portal Suite | Unified Biometric Campus",
    template: "%s | SmartFace Portal",
  },
  description:
    "Role-based attendance management for students, faculty, administrators, and parents — ArcFace biometrics, rotating anti-proxy QR codes, and live campus security telemetry.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${poppins.variable}`}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-bg0 font-sans text-hi antialiased selection:bg-accent/30 selection:text-white overflow-x-hidden">
          <SpaceBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <AuthProvider>
              {children}
            </AuthProvider>
          </div>
        </body>
    </html >
  );
}
