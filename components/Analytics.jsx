'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, track } from '@/lib/analytics';

// Query params that can carry credentials / one-time secrets.
// These are stripped from any URL before we ship it to analytics.
const SENSITIVE_KEYS = new Set([
  'session_id', 'stripe_session_id', 'token', 'access_token', 'refresh_token',
  'code', 'state', 'next', 'email', 'password', 'key', 'apikey', 'api_key',
  'secret', 'nonce', 'otp', 'auth',
]);

function scrubSearch(sp) {
  if (!sp) return '';
  const safe = new URLSearchParams();
  for (const [k, v] of sp.entries()) {
    safe.append(SENSITIVE_KEYS.has(k.toLowerCase()) ? k : k, SENSITIVE_KEYS.has(k.toLowerCase()) ? '[redacted]' : v);
  }
  return safe.toString();
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const qs = scrubSearch(searchParams);
    track('$pageview', { path: pathname + (qs ? `?${qs}` : '') });
  }, [pathname, searchParams]);

  return null;
}
