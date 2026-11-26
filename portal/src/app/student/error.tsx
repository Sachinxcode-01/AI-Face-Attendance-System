'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function StudentSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardLayout>
      <Card className="mx-auto max-w-lg border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <h2 className="font-display text-lg font-bold text-hi">Unable to load Student Portal view</h2>
        <p className="mt-1.5 text-xs text-mid">
          {error?.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        <Button variant="secondary" onClick={reset} className="mt-4 h-9 px-4 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </Card>
    </DashboardLayout>
  );
}
