import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@/components/analytics";
import { SpaceBackground } from "@/components/space-background";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-face-attendance-beta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SmartFace — Touchless Biometric Attendance & Campus Security",
    template: "%s | SmartFace",
  },
  description:
    "Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security alerts. Verify an entire campus in under 300ms with 99.8% precision.",
  applicationName: "SmartFace",
  authors: [{ name: "SmartFace Systems Inc." }],
  keywords: [
    "biometric attendance",
    "touchless attendance",
    "face recognition attendance",
    "anti-proxy QR",
    "campus security",
    "ArcFace v2.4",
    "student attendance system",
    "university access control",
  ],
  creator: "SmartFace Systems Inc.",
  publisher: "SmartFace Systems Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "SmartFace — Touchless Biometric Attendance & Campus Security",
    description:
      "Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security alerts. Verify an entire campus in under 300ms.",
    siteName: "SmartFace",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartFace — Touchless Biometric Attendance",
    description:
      "Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security alerts. Verify an entire campus in under 300ms.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: [
      "9yrBACI3uO5CcVjH3mCRCBeQvX5xfiIz8h4c3hligHk",
      "sNfD8sdaNFgQ5XBHKz7xegiC4upBLTIfLk-zFZ4OVQY",
    ],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg0 font-sans text-hi antialiased selection:bg-accent/30 selection:text-white">
        <SpaceBackground />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
