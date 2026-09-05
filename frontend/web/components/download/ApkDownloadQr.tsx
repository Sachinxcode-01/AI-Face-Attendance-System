'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, ExternalLink } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

export const ApkDownloadQr: React.FC = () => {
  const [downloadPageUrl, setDownloadPageUrl] = useState(APP_RELEASE.officialPageUrl);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDownloadPageUrl(`${window.location.origin}/download`);
    }
  }, []);

  // Encoded URL for public QR API rendering
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadPageUrl)}&color=0f172a&bgcolor=ffffff&margin=2`;

  return (
    <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center backdrop-blur-xl shadow-xl">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
        <QrCode className="h-5 w-5" />
      </div>

      <h3 className="text-lg font-bold text-white mb-1">Scan for Mobile Download</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-xs">
        Scan with your Android phone camera to open the official download page directly on mobile.
      </p>

      {/* High-Contrast QR Code Card */}
      <div className="relative p-3 rounded-2xl bg-white border border-slate-200 shadow-lg mb-4 group transition-transform hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageUrl}
          alt="Smart Attendance AI Download Page QR Code"
          className="w-44 h-44 object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      {/* Target URL Display */}
      <div className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 mb-3">
        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Target Web Location</span>
        <a
          href={downloadPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center justify-center gap-1 truncate"
        >
          {downloadPageUrl} <ExternalLink className="h-3 w-3 inline" />
        </a>
      </div>

      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <Smartphone className="h-3 w-3" /> Compatible with Android 7.0 & Higher
      </p>
    </div>
  );
};
