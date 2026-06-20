'use strict';
'use client';

import React, { useEffect, useState } from 'react';

interface CanvasContainerProps {
  children: React.ReactNode;
  className?: string;
  showLoader?: boolean;
}

export default function CanvasContainer({
  children,
  className = '',
  showLoader = true,
}: CanvasContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-space/10 overflow-hidden ${className}`}
      >
        {showLoader && (
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Spinning glowing loader ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/5"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-slow"></div>
            </div>
            <span className="text-xs tracking-[0.2em] uppercase text-slate-400 font-mono">
              Loading R3F Environment
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {children}
    </div>
  );
}
