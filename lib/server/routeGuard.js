import { limit, clientIp, looksLikeBot } from './rateLimit';

export async function applyIPGuard(req, scope, { max = 3, windowMs = 60_000 } = {}) {
  if (looksLikeBot(req)) {
    return Response.json({ success: false, error: 'Blocked.' }, { status: 403 });
  }
  const ip = clientIp(req);
  const ipHit = await limit(scope, ip, { windowMs, max });
  if (!ipHit.ok) {
    const minStr = windowMs === 60_000 ? 'minute' : `${windowMs / 1000}s`;
    return Response.json(
      { success: false, error: `Please wait before requesting again. (Max ${max}/${minStr})` },
      { status: 429 }
    );
  }
  return null; // proceed
}
