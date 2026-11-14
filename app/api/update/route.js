import { AI_PROVIDERS, ALLOWED_VERSIONS } from '@/lib/providers';
import { getUpdatePrompt, formatZipContext } from '@/lib/masterPrompts';
import { sanitizeZipFiles } from '@/lib/server/zipSanitizer';
import { callAI, pickKeyFor } from '@/lib/server/aiClient';
import { limit } from '@/lib/server/rateLimit';
import { applyIPGuard } from '@/lib/server/routeGuard';
import { captureServerError } from '@/lib/server/sentry';
import {
  verifyToken, signToken, spendCredit, availableCredits,
  toClientUsage,
} from '@/lib/server/session';
import { parseGeneratedCode } from '@/lib/server/parseGeneratedCode';

const MAX_CODE_LEN     = 30_000;
const ALLOWED_VERSIONS_SET = new Set(ALLOWED_VERSIONS);

export async function POST(req) {
  try {
    const guard = await applyIPGuard(req, 'update:ip', { max: 3, windowMs: 60_000 });
    if (guard) return guard;

    let body;
    try { body = await req.json(); } catch {
      return Response.json({ success: false, error: 'Invalid JSON.' }, { status: 400 });
    }

    const { code, fromVersion, toVersion, provider, token, files: zipFiles } = body || {};

    if (!code || typeof code !== 'string' || code.trim().length < 10) {
      return Response.json({ success: false, error: 'Please paste your plugin code to update.' }, { status: 400 });
    }
    if (code.length > MAX_CODE_LEN) {
      return Response.json({ success: false, error: 'Code too long (max 30,000 chars).' }, { status: 400 });
    }
    if (!ALLOWED_VERSIONS_SET.has(fromVersion) || !ALLOWED_VERSIONS_SET.has(toVersion)) {
      return Response.json({ success: false, error: 'Invalid version specified.' }, { status: 400 });
    }
    if (fromVersion === toVersion) {
      return Response.json({ success: false, error: 'From and To versions must be different.' }, { status: 400 });
    }
    if (!provider || !token) {
      return Response.json({ success: false, error: 'Missing provider or token.' }, { status: 400 });
    }

    let payload;
    try { payload = verifyToken(token); } catch {
      return Response.json({ success: false, error: 'Session expired — please sign in again.', code: 'session_expired' }, { status: 401 });
    }

    const userMin  = await limit('update:uid:min',  payload.uid, { windowMs: 60_000,    max: 5  });
    if (!userMin.ok)  return Response.json({ success: false, error: 'Slow down — 5 updates per minute max.' }, { status: 429 });
    const userHour = await limit('update:uid:hour', payload.uid, { windowMs: 3_600_000, max: 60 });
    if (!userHour.ok) return Response.json({ success: false, error: 'Hourly limit reached.' }, { status: 429 });

    if (availableCredits(payload, 'normal') <= 0) {
      return Response.json({ success: false, error: 'No credits remaining. Upgrade your plan.', code: 'no_credits' }, { status: 402 });
    }

    const provConfig = AI_PROVIDERS.find(p => p.id === provider);
    if (!provConfig) return Response.json({ success: false, error: 'Invalid AI provider.' }, { status: 400 });

    const key = pickKeyFor(provider);
    if (!key) return Response.json({ success: false, error: 'This AI provider is unavailable right now.' }, { status: 503 });

    const cleanZip    = sanitizeZipFiles(zipFiles);
    const zipContext  = cleanZip ? formatZipContext(cleanZip) : '';
    const { cached: systemCached, dynamic: systemDynamic } =
      getUpdatePrompt(code.trim(), fromVersion, toVersion, zipContext);

    const aiResult = await callAI({
      provider,
      providerKey:  key,
      tier:         'normal',
      systemCached,
      systemDynamic,
      userMessage:  `Migrate the plugin from ${fromVersion} to ${toVersion} per the rules above. Return all updated files.`,
    });
    const generatedText = aiResult.text;

    const { files, pluginName } = parseGeneratedCode(generatedText || '', 'UpdatedPlugin');
    if (Object.keys(files).length === 0) {
      return Response.json({ success: false, error: 'AI could not parse the update output. Try again.' }, { status: 502 });
    }

    const nextPayload = spendCredit(payload, 'normal');
    const newToken = signToken(nextPayload);

    return Response.json({
      success: true,
      data: { files, pluginName, fromVersion, toVersion, originalCode: code.trim() },
      token: newToken,
      usage: toClientUsage(nextPayload),
      meta: {
        provider:  aiResult.provider,
        model:     aiResult.model,
        rounds:    aiResult.rounds,
        truncated: aiResult.truncated,
      },
    });

  } catch (err) {
    captureServerError(err, { where: 'update:post' });
    return Response.json({ success: false, error: 'Update failed. Please try again.' }, { status: 500 });
  }
}
