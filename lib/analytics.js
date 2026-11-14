// Client-side analytics wrapper around PostHog.
// No-ops if NEXT_PUBLIC_POSTHOG_KEY is missing or user has opted out.
'use client';

const STORAGE_OPT_OUT = 'ciy-analytics-opt-out';
let posthog = null;
let inited  = false;

function hasOptedOut() {
  if (typeof window === 'undefined') return true;
  try { return localStorage.getItem(STORAGE_OPT_OUT) === '1'; } catch { return false; }
}

export function setOptOut(optedOut) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_OPT_OUT, optedOut ? '1' : '0');
    if (optedOut && posthog) posthog.opt_out_capturing();
    if (!optedOut && posthog) posthog.opt_in_capturing();
  } catch {}
}

export async function initAnalytics() {
  if (inited) return posthog;
  inited = true;
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (hasOptedOut()) return null;
  try {
    const mod = await import('posthog-js');
    posthog = mod.default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: false,
      disable_session_recording: true,
    });
    return posthog;
  } catch {
    return null;
  }
}

export function track(event, props) {
  try { posthog?.capture?.(event, props); } catch {}
}

export function identify(userId, props) {
  try { posthog?.identify?.(userId, props); } catch {}
}

export function resetIdentity() {
  try { posthog?.reset?.(); } catch {}
}
