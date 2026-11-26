import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function StudentSectionLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:pl-64 space-y-6">
      <div className="h-28 rounded-[22px] border border-white/[0.06] bg-white/[0.02] animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
