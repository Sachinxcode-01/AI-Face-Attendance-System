'use client';

import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

export function SkeletonCard() {
  return (
      <div className="rounded-[22px] border border-white/[0.08] bg-[#101016] p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-8 w-1/2" />
        <Skeleton className="mt-3 h-3 w-2/3" />
      </div>
      );
}
