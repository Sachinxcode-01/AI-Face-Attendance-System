'use client';

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    // Never retry client errors, auth failures, conflicts, or rate limits
    if (error.status >= 400 && error.status < 500) return false;
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
});
