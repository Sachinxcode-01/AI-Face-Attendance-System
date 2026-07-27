import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, HelpCircle } from 'lucide-react';
import { ApkDownloadHero } from '@/components/download/ApkDownloadHero';
import { ApkInstallationGuide } from '@/components/download/ApkInstallationGuide';
import { ApkChecksumCard } from '@/components/download/ApkChecksumCard';
import { ApkDownloadQr } from '@/components/download/ApkDownloadQr';
import { ApkScreenshotCarousel } from '@/components/download/ApkScreenshotCarousel';
import { ApkReleaseNotes } from '@/components/download/ApkReleaseNotes';
import { ApkRequirementsCard } from '@/components/download/ApkRequirementsCard';

export const metadata: Metadata = {
  title: 'Download Smart Attendance AI APK | Official Android App',
  description: 'Download the official Smart Attendance AI Android APK (v1.1.0) for secure face recognition attendance, timetables, QR scanning, parent portal, and admin security logs.',
  keywords: ['Smart Attendance AI APK', 'Download Android Attendance App', 'Face Recognition APK', 'SmartFace AI Android'],
  alternates: {
    canonical: 'https://smartface.pro/download',
  },
  openGraph: {
    title: 'Download Smart Attendance AI APK | Official Android Release',
    description: 'Get the official Smart Attendance AI Android app with InsightFace biometrics, QR attendance, and live timetable analytics.',
    url: 'https://smartface.pro/download',
    siteName: 'Smart Attendance AI',
    type: 'website',
    images: [
      {
        url: 'https://smartface.pro/smartface_banner.png',
        width: 1200,
        height: 630,
        alt: 'Smart Attendance AI Official Android App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Smart Attendance AI APK | Official Android App',
    description: 'Official Android APK download for Smart Attendance AI v1.1.0.',
    images: ['https://smartface.pro/smartface_banner.png'],
  },
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients & Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-900/20 via-cyan-900/10 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-12">
        {/* Navigation Breadcrumb Back Link */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home Page
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Official Release
          </span>
        </div>

        {/* 1. Main Hero Download Section */}
        <ApkDownloadHero />

        {/* 2. Download QR & Checksum Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <ApkDownloadQr />
          </div>
          <div className="lg:col-span-8">
            <ApkChecksumCard />
          </div>
        </div>

        {/* 3. Screenshot Interface Showcase */}
        <ApkScreenshotCarousel />

        {/* 4. Release Notes & System Requirements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <ApkReleaseNotes />
          </div>
          <div className="lg:col-span-5">
            <ApkRequirementsCard />
          </div>
        </div>

        {/* 5. Step-by-Step Installation Walkthrough */}
        <ApkInstallationGuide />

        {/* 6. Frequently Asked Questions (FAQ) & Support */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400">Common queries regarding APK installation and safety</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">Is downloading the APK file safe?</h3>
              <p className="leading-relaxed text-slate-400">
                Yes. Every release build is digitally signed and audited. You can verify the cryptographic SHA-256 signature hash above against your downloaded file.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">Why is this app not on Google Play Store?</h3>
              <p className="leading-relaxed text-slate-400">
                The APK is distributed directly via institutional server channels for immediate external examination and local campus evaluation.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">Do I need to root my Android phone?</h3>
              <p className="leading-relaxed text-slate-400">
                No. Smart Attendance AI runs natively on standard Android 7.0+ devices without rooting or modifying system security settings.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h3 className="font-semibold text-slate-100 text-sm">How do I update to future releases?</h3>
              <p className="leading-relaxed text-slate-400">
                Future release updates can be downloaded from this official page. Installing the new APK over the existing app will update your installation seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
