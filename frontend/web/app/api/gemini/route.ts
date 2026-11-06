import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const RATE_WINDOW_MS = 60_000;
const aiRequests = new Map<string, { count: number; resetAt: number }>();

// shortcut: per-instance limits reset on restart; use a shared store before horizontal scaling.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return NextResponse.json({ error: 'Sign in to use the AI assistant.' }, { status: 401 });

    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    let profileResponse: Response;
    try {
      profileResponse = await fetch(`${apiUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return NextResponse.json({ error: 'Unable to verify your session.' }, { status: 503 });
    }
    if (!profileResponse.ok) return NextResponse.json({ error: 'Sign in again to use the AI assistant.' }, { status: 401 });

    const profile = await profileResponse.json();
    const user = profile?.data?.user || profile?.user || profile;
    const role = user?.role;
    const userId = user?.id || user?.email;
    if (!userId || !['student', 'parent', 'teacher', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid account profile.' }, { status: 401 });
    }

    const now = Date.now();
    for (const [key, entry] of aiRequests) {
      if (entry.resetAt <= now) aiRequests.delete(key);
    }
    const rate = aiRequests.get(String(userId));
    if (rate && rate.count >= 10) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - now) / 1000));
      return NextResponse.json(
        { error: `AI rate limit reached. Try again in ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }
    aiRequests.set(String(userId), rate ? { ...rate, count: rate.count + 1 } : { count: 1, resetAt: now + RATE_WINDOW_MS });

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 12_000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const context = input.context && typeof input.context === 'object' && !Array.isArray(input.context)
      ? input.context as Record<string, unknown>
      : {};
    const history = input.history ?? [];
    if (!prompt || prompt.length > 4000 || JSON.stringify(context).length > 4000) {
      return NextResponse.json({ error: 'Prompt or context is invalid or too long.' }, { status: 400 });
    }
    if (!Array.isArray(history) || history.length > 6 || history.some((item) =>
      !item || typeof item !== 'object' || Array.isArray(item) ||
      !['user', 'assistant', 'model'].includes((item as Record<string, unknown>).role as string) ||
      typeof (item as Record<string, unknown>).text !== 'string' ||
      ((item as Record<string, unknown>).text as string).length > 2000
    )) {
      return NextResponse.json({ error: 'Conversation history is invalid.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI assistant is not configured.' }, { status: 503 });

    const systemInstruction = role === 'student'
      ? 'You are SmartFace’s student attendance and academic assistant. Give clear, practical answers and use only the student context provided.'
      : role === 'teacher'
        ? 'You are SmartFace’s faculty attendance assistant. Give practical classroom and attendance guidance using only the context provided.'
        : role === 'admin' || role === 'super_admin'
          ? 'You are SmartFace’s institutional attendance and security assistant. Give concise, evidence-based guidance using only the context provided.'
          : 'You are SmartFace’s attendance assistant. Give clear, accurate answers using only the context provided.';
    const contextText = Object.keys(context).length
      ? `\n\n[Application context]:\n${JSON.stringify(context)}`
      : '';

    const contents = [
      ...history.map((item) => {
        const turn = item as { role: 'user' | 'assistant' | 'model'; text: string };
        return { role: turn.role === 'user' ? 'user' : 'model', parts: [{ text: turn.text }] };
      }),
      { role: 'user', parts: [{ text: `${prompt}${contextText}` }] },
    ];

    for (const model of GEMINI_MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!response.ok) continue;
      const result = await response.json();
      const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof reply === 'string' && reply.trim()) {
        return NextResponse.json({ success: true, model, reply, timestamp: new Date().toISOString() });
      }
    }

    return NextResponse.json({ error: 'AI assistant is temporarily unavailable.' }, { status: 502 });
  } catch (error) {
    console.error('[Gemini route]', error);
    return NextResponse.json({ error: 'AI assistant is temporarily unavailable.' }, { status: 500 });
  }
}
