'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050507] px-6 text-center text-mid selection:bg-accent/30 selection:text-white">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="inline-flex items-center gap-2 chip-bytune mb-4 text-xs">
        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
        <span className="font-mono uppercase tracking-wider text-faint">Application Exception</span>
      </div>

      <h1 className="font-display text-3xl font-medium tracking-[-0.028em] text-hi sm:text-4xl">
        Something interrupted the session
      </h1>

      <p className="mt-3 max-w-md text-[14.5px] leading-[23.9px] text-mid">
        An unexpected error occurred while processing the telemetry or portal route. Try refreshing or return to the gateway.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-pill-accent text-[#050507] font-semibold flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="btn-pill-glass"
        >
          Return to Portal Gateway
        </Link>
      </div>
    </div>
  );
}
