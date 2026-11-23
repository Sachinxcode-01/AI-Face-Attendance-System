import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/student', '/teacher', '/admin', '/parent'];
const PUBLIC_AUTH = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sf_token')?.value;
  const role = request.cookies.get('sf_role')?.value;

  // Protected role routes require a valid session token
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    // Role guard: /teacher/... must have sf_role=teacher, etc.
    const expected = PROTECTED.find((p) => pathname === p || pathname.startsWith(p + '/'));
    if (expected && role) {
      const isAllowed = expected === `/${role}` || (role === 'super_admin' && expected === '/admin');
      if (!isAllowed) {
        return NextResponse.redirect(new URL(role === 'super_admin' ? '/admin/super-admin' : `/${role}`, request.url));
      }
    }
  }

  // Signed-in users don't need the auth screens
  if (PUBLIC_AUTH.some((p) => pathname.startsWith(p)) && token) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'super_admin' ? '/admin/super-admin' : (role ? `/${role}` : '/student');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/parent/:path*', '/auth/:path*'],
};
