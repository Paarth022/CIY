// Sentry wrapper that no-ops when SENTRY_DSN isn't set.
// Keeps callers simple: `captureServerError(err, { where })`.
let client = null;
let initTried = false;

function ensure() {
  if (initTried) return client;
  initTried = true;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;
  try {
    // Lazy require so the dependency is optional in dev.
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release:     process.env.SENTRY_RELEASE || undefined,
      tracesSampleRate: 0.05,
      ignoreErrors: [
        'AbortError',
        'ECONNRESET',
      ],
    });
    client = Sentry;
    return client;
  } catch {
    return null;
  }
}

export function captureServerError(err, context = {}) {
  try {
    const c = ensure();
    if (!c) {
      // Fall back to structured console so we still see it.
      const where = context.where || 'unknown';
      console.error(`[err:${where}]`, err?.message || err, err?.stack || '');
      return;
    }
    c.withScope(scope => {
      for (const [k, v] of Object.entries(context)) {
        if (v !== undefined) scope.setTag(k, String(v).slice(0, 200));
      }
      c.captureException(err);
    });
  } catch {
    // Never let telemetry break the request path.
  }
}

export function captureMessage(msg, level = 'info', context = {}) {
  try {
    const c = ensure();
    if (!c) {
      console.log(`[msg:${level}]`, msg, context);
      return;
    }
    c.withScope(scope => {
      for (const [k, v] of Object.entries(context)) {
        if (v !== undefined) scope.setTag(k, String(v).slice(0, 200));
      }
      c.captureMessage(msg, level);
    });
  } catch {}
}
