import { NextRequest, NextResponse } from 'next/server';
import { APP_RELEASE } from '@/config/app-release';

export async function GET(request: NextRequest) {
  try {
    if (!APP_RELEASE.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: 'The Android release is temporarily unavailable. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    const redirectUrl = new URL(APP_RELEASE.apkDownloadUrl, baseUrl);

    const response = NextResponse.redirect(redirectUrl, { status: 307 });
    response.headers.set('Content-Type', 'application/vnd.android.package-archive');
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
