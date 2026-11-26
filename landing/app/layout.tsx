import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@/components/analytics";
import { Preloader } from "@/components/preloader";
import { SpaceBackground } from "@/components/space-background";
import { COMPANY_CONTACT, SITE_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "SmartFace — Touchless Biometric Attendance & Campus Portal",
    template: "%s | SmartFace",
  },
  description:
  "Open-source campus attendance platform combining InsightFace ArcFace (512-D) face verification, 20-second rotating HMAC-SHA256 QR codes, role-based portals, and encrypted mobile offline queuing.",
  applicationName: "SmartFace",
  authors: [{ name: COMPANY_CONTACT.developer, url: COMPANY_CONTACT.github }],
  keywords: [
    "biometric attendance",
    "touchless attendance",
    "face recognition attendance",
    "anti-proxy QR",
    "campus security",
    "InsightFace ArcFace",
    "student attendance system",
    "campus attendance portal",
  ],
  creator: COMPANY_CONTACT.developer,
  publisher: COMPANY_CONTACT.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "SmartFace — Touchless Biometric Attendance & Campus Portal",
    description:
    "InsightFace ArcFace 512-D face verification, 20-second rotating HMAC-SHA256 QR tokens, five role-based portals, and encrypted mobile offline queuing.",
    siteName: "SmartFace",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartFace — Touchless Biometric Attendance",
    description:
    "InsightFace ArcFace 512-D face verification, 20s rotating QR tokens, and unified portals for students, teachers, admins, parents, and super admins.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg0 font-sans text-hi antialiased selection:bg-accent/30 selection:text-white">
        <Preloader />
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
