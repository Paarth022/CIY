// Browser-side Supabase client. Returns null when keys aren't set so the UI
// can fall back to localStorage-backed auth.
'use client';
let browser = null;
let triedInit = false;

export function getBrowserSupabase() {
  if (triedInit) return browser;
  triedInit = true;
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    browser = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return browser;
  } catch {
    return null;
  }
}

export function isSupabaseEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
