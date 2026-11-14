import { freshPayload, signToken, toClientUsage } from '@/lib/server/session';

// Per-IP rate limit on session init so someone can't spin up unlimited free
// sessions to drain our server-side provider credits.
const WINDOW_MS = 60 * 60 * 1000;  // 1h
const MAX       = 10;
const buckets   = new Map();

function clientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
  if (real) return real.trim().slice(0, 64);
  return 'anonymous';
}

function allow(ip) {
  const now    = Date.now();
  const cutoff = now - WINDOW_MS;

  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter(t => t > cutoff);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }

  const stamps = (buckets.get(ip) || []).filter(t => t > cutoff);
  stamps.push(now);
  buckets.set(ip, stamps);
  return stamps.length <= MAX;
}

export async function POST(req) {
  try {
    if (!allow(clientIp(req))) {
      return Response.json(
        { success: false, error: 'Too many new sessions from this address. Try again later.' },
        { status: 429 }
      );
    }
    const payload = freshPayload();
    const token   = signToken(payload);
    return Response.json({ success: true, token, usage: toClientUsage(payload) });
  } catch (e) {
    console.error('session/init error:', e);
    return Response.json({ success: false, error: 'Unable to initialise session.' }, { status: 500 });
  }
}
