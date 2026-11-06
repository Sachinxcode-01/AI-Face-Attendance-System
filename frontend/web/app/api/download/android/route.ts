import { NextResponse } from 'next/server';
import { APP_RELEASE } from '@/config/app-release';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
// shortcut: this in-memory limit resets on restart; use shared storage when scaling across Next.js instances.
const requestsByIp = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = request.headers.get('x-real-ip') || forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    let bucket = requestsByIp.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      requestsByIp.set(ip, bucket);
    }
    bucket.count += 1;
    if (bucket.count > MAX_REQUESTS) {
      const response = NextResponse.json({ success: false, message: 'Too many requests. Please try again shortly.' }, { status: 429 });
      response.headers.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return response;
    }

    if (requestsByIp.size > 5000) {
      for (const [key, value] of requestsByIp) {
        if (value.resetAt <= now) requestsByIp.delete(key);
      }
    }

    if (!APP_RELEASE.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: 'The Android release is temporarily unavailable. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    // Redirect directly to the APK download URL (GitHub Releases CDN)
    const response = NextResponse.redirect(APP_RELEASE.apkDownloadUrl, { status: 307 });
    response.headers.set('Content-Disposition', `attachment; filename="${APP_RELEASE.apkFileName}"`);
    response.headers.set('Cache-Control', 'public, max-age=3600');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while preparing the APK download.',
      },
      { status: 500 }
    );
  }
}
