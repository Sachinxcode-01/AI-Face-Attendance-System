'use client';

import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-gray-500">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs text-gray-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
