import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/student', '/teacher', '/admin', '/parent'];
const PUBLIC_AUTH = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/mfa',
  '/auth/oauth/callback',
  '/auth/accept-invitation',
  '/auth/auth-error',
];
const ALLOWED_ROLES = new Set(['student', 'teacher', 'admin', 'parent', 'super_admin']);

  function base64UrlToUint8Array(b64url: string): Uint8Array {
    const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
    const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  async function parseAndVerifyJwt(token: string): Promise<{ role?: string; exp?: number; mfa_pending?: boolean } | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, sigB64] = parts;
      const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
      const payload = JSON.parse(payloadJson) as { role?: string; exp?: number; mfa_pending?: boolean };

      if (payload.mfa_pending) return null;
      if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
        return null;
      }

      const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.SECRET_KEY;
      if (secret) {
        const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(headerB64))) as { alg?: string };
        if (header.alg !== 'HS256') return null;
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );
        const sigBytes = base64UrlToUint8Array(sigB64);
        const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
        const valid = await crypto.subtle.verify(
          'HMAC',
          key,
          sigBytes.buffer as ArrayBuffer,
          dataBytes.buffer as ArrayBuffer
        );
        if (!valid) return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  function getSafeRoleHome(role: string | undefined): string {
    if (role === 'super_admin') return '/admin/super-admin';
    if (role && ALLOWED_ROLES.has(role)) return `/${role}`;
    return '/auth/login';
  }

  export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('sf_token')?.value;
    const claims = token ? await parseAndVerifyJwt(token) : null;
    const rawRole = claims?.role?.toLowerCase();
    const role = rawRole && ALLOWED_ROLES.has(rawRole) ? rawRole : undefined;

    if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
        if (!claims || !role) {
          const url = request.nextUrl.clone();
          url.pathname = '/auth/login';
          url.searchParams.set('from', pathname);
          const res = NextResponse.redirect(url);
          if (token) {
            res.cookies.delete('sf_token');
            res.cookies.delete('sf_role');
          }
          return res;
        }

        const expected = PROTECTED.find((p) => pathname === p || pathname.startsWith(p + '/'));
          if (expected) {
            const isAllowed = expected === `/${role}` || (role === 'super_admin' && expected === '/admin');
            if (!isAllowed) {
              return NextResponse.redirect(new URL(getSafeRoleHome(role), request.url));
            }
          }
        }

          if (PUBLIC_AUTH.some((p) => pathname.startsWith(p)) && claims && role) {
            // Allow oauth callback, mfa, and invitation pages even if transitioning
            if (!pathname.startsWith('/auth/oauth/callback') && !pathname.startsWith('/auth/accept-invitation')) {
              const url = request.nextUrl.clone();
              url.pathname = getSafeRoleHome(role);
              return NextResponse.redirect(url);
            }
          }

          return NextResponse.next();
        }

        export const config = {
          matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/parent/:path*', '/auth/:path*'],
        };
