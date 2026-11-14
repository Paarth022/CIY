// Unified rate-limit helper.
// Prefers Upstash Redis (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) so
// limits survive cold starts. Falls back to an in-memory sliding window when
// Upstash is not configured — safe for single-process local dev, NOT for multi-
// instance production.
//
// Usage:
//   const hit = await limit('contact', ip, { windowMs: 3600_000, max: 6 });
//   if (!hit.ok) return Response.json({ error: 'too many' }, { status: 429 });

const LOCAL_BUCKETS = new Map();

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
) {
  console.error(
    '[CIY WARN] UPSTASH_REDIS_REST_URL / TOKEN not set in production. ' +
    'Rate limiting is IN-MEMORY and BYPASSED on multi-instance deployments. ' +
    'Set Upstash credentials immediately.'
  );
}

function now() { return Date.now(); }

function cleanupLocal() {
  if (LOCAL_BUCKETS.size < 50_000) return;
  const t = now();
  for (const [k, entries] of LOCAL_BUCKETS) {
    const fresh = entries.filter(e => e > t - 24 * 60 * 60 * 1000);
    if (!fresh.length) LOCAL_BUCKETS.delete(k);
    else LOCAL_BUCKETS.set(k, fresh);
  }
}

async function upstashIncr(scope, ip, windowMs) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `rl:${scope}:${ip}`;
  const ttlSecs = Math.ceil(windowMs / 1000);

  // Pipeline: INCR + EXPIRE (NX so we don't reset TTL on every call).
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(ttlSecs), 'NX'],
      ]),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data) || !data[0]) return null;
    const count = Number(data[0].result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

function localSliding(scope, ip, windowMs) {
  cleanupLocal();
  const key = `${scope}:${ip}`;
  const cutoff = now() - windowMs;
  const stamps = (LOCAL_BUCKETS.get(key) || []).filter(t => t > cutoff);
  stamps.push(now());
  LOCAL_BUCKETS.set(key, stamps);
  return stamps.length;
}

/**
 * @param {string} scope   short identifier for the rate-limit family (e.g. 'contact', 'generate')
 * @param {string} ip      identifier for the caller (client IP or uid or "ip:uid")
 * @param {{windowMs:number, max:number}} opts
 */
export async function limit(scope, ip, { windowMs, max }) {
  if (!scope || !ip) return { ok: true, count: 0, max, backend: 'skip' };
  const upstash = await upstashIncr(scope, ip, windowMs);
  if (upstash != null) {
    return { ok: upstash <= max, count: upstash, max, backend: 'upstash' };
  }
  const count = localSliding(scope, ip, windowMs);
  return { ok: count <= max, count, max, backend: 'memory' };
}

/** Extract a best-effort client IP from Next.js request headers. */
export function clientIp(req) {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim().slice(0, 64);
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim().slice(0, 64);
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return 'anonymous';
}

/** Cheap denial for obvious bot traffic — does NOT replace a WAF. */
export function looksLikeBot(req) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || ua.length < 10)      return true;
  if (/curl|wget|python-requests|httpie|axios\/\d|scrapy/i.test(ua)) return true;
  return false;
}
