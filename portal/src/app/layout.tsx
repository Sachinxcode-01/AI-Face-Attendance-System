import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFace Role Portal Suite | Unified Biometric Campus",
  description: "Enterprise management portal for Students, Faculty, Administrators, and Parents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070A14] text-[#C8CCDF] antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
