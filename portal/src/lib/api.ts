import { getToken } from './auth';

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper around the Node/Express gateway API (port 8000).
 * Attaches the Bearer token, parses the backend's `{ detail }` error shape,
 * and surfaces generic messages to clients (per CLAUDE.md security rules).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Service unavailable. Please try again shortly.', 0);
  }

  if (!res.ok) {
    let detail = 'Request failed. Please try again.';
    try {
      const body = await res.json();
      if (body && typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* keep generic message — never leak raw server errors */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/login-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    profile: () => apiFetch('/auth/profile'),
  },
  attendance: {
    dashboard: () => apiFetch('/attendance/dashboard'),
    heatmap: () => apiFetch('/attendance/heatmap'),
  },
  sessions: {
    active: () => apiFetch('/sessions/active'),
  },
};
