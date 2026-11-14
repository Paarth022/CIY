// Server-only Supabase client (uses service role key — NEVER expose to the browser).
// The `server-only` import fails the build if this file is ever imported from
// a module that ships to the client.
import 'server-only';

let admin = null;
let triedInit = false;

export function getAdminSupabase() {
  if (triedInit) return admin;
  triedInit = true;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return admin;
  } catch (e) {
    console.error('[supabase] admin init failed:', e?.message);
    return null;
  }
}

export function isSupabaseServerEnabled() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
