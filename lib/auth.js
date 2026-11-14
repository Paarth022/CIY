// ══════════════════════════════════════════════════════════
// AUTH + ENTITLEMENTS
// Credentials live in localStorage (one account per device, MVP).
// Credits are NOT stored locally as authoritative state — the real balance
// lives inside an HMAC-signed session token issued by the server. The
// localStorage "ciy-usage" record is a cached view so the UI can render.
// ══════════════════════════════════════════════════════════
'use client';
import { useEffect, useState, useCallback } from 'react';
import { getBrowserSupabase, isSupabaseEnabled } from '@/lib/supabase/client';

const USER_KEY    = 'ciy-user';
const USAGE_KEY   = 'ciy-usage';
const TOKEN_KEY   = 'ciy-token';
const HISTORY_KEY = 'ciy-history';

// Max lengths — prevent absurd localStorage payloads from crashing JSON.parse.
const MAX_NAME_LEN     = 64;
const MAX_EMAIL_LEN    = 254;
const MAX_PASSWORD_LEN = 128;
const EMAIL_RE         = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ciy:auth-change'));
}

// ── password helpers (WebCrypto SHA-256 + random salt + constant-time compare) ──
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── user record (credentials stripped on read) ──
export function getUser() {
  if (typeof window === 'undefined') return null;
  if (isSupabaseEnabled()) {
    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        const urlStr = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (urlStr) {
          const projectRef = new URL(urlStr).hostname.split('.')[0];
          const sessionKey = `sb-${projectRef}-auth-token`;
          const rawSession = JSON.parse(localStorage.getItem(sessionKey) || 'null');
          if (rawSession?.user) {
            const u = rawSession.user;
            return {
              id: u.id,
              name: u.user_metadata?.display_name || u.email.split('@')[0],
              email: u.email,
              createdAt: u.created_at,
            };
          }
        }
      }
    } catch {}
  }
  try {
    const raw = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return null;
    const { passwordHash, passwordSalt, ...safe } = raw;
    return safe;
  } catch { return null; }
}
function getUserRecord() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

// ── server session token (authoritative credit balance) ──
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  if (typeof t === 'string' && t) localStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── usage (cached view for UI) ──
export function getUsage() {
  if (typeof window === 'undefined') return null;
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_KEY) || 'null');
    if (!usage) return null;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return { ...usage, history: Array.isArray(history) ? history : [] };
  } catch { return null; }
}
function saveUsage(u) {
  if (!u) return;
  const { history, ...rest } = u;
  localStorage.setItem(USAGE_KEY, JSON.stringify(rest));
  if (Array.isArray(history)) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }
}

// Apply the server's authoritative state ({ token, usage }) to local storage.
// Keeps the client history (server doesn't persist it) so the account page
// keeps showing what the user has crafted.
export function applyServerState({ token, usage }) {
  if (token) setToken(token);
  if (usage) {
    const existingHistory = (getUsage()?.history) || [];
    saveUsage({ ...usage, history: existingHistory });
  }
  emitChange();
}

export function addHistoryEntry(tier, pluginName) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const next = [{ tier, at: new Date().toISOString(), pluginName: pluginName || 'Untitled' }, ...(Array.isArray(history) ? history : [])].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    emitChange();
  } catch {
    // If history storage breaks, it's cosmetic — keep going.
  }
}

// Full-snapshot history — stores the generated files so the user can fork/refine later.
// Separate key, capped at 10 to stay well under localStorage's ~5MB ceiling.
const FULL_HISTORY_KEY = 'ciy-history-full';
const FULL_HISTORY_CAP = 10;
const FULL_HISTORY_BYTE_CAP = 2_000_000; // 2MB hard cap across all snapshots

function safeReadFull() {
  try {
    const v = JSON.parse(localStorage.getItem(FULL_HISTORY_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function addFullHistoryEntry({ feature, tier, pluginName, prompt, files, meta }) {
  try {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      feature: feature || 'create',
      tier:    tier    || 'normal',
      pluginName: pluginName || 'Untitled',
      prompt:  typeof prompt === 'string' ? prompt.slice(0, 2000) : '',
      files:   files && typeof files === 'object' ? files : {},
      meta:    meta || null,
      at:      new Date().toISOString(),
    };
    let list = [entry, ...safeReadFull()].slice(0, FULL_HISTORY_CAP);

    // Trim from the tail until we fit in the byte budget.
    while (list.length > 1 && JSON.stringify(list).length > FULL_HISTORY_BYTE_CAP) {
      list = list.slice(0, list.length - 1);
    }
    localStorage.setItem(FULL_HISTORY_KEY, JSON.stringify(list));
    emitChange();
    return entry.id;
  } catch {
    return null;
  }
}

export function listFullHistory()  { return safeReadFull(); }
export function getFullHistory(id) { return safeReadFull().find(e => e.id === id) || null; }
export function removeFullHistory(id) {
  try {
    const list = safeReadFull().filter(e => e.id !== id);
    localStorage.setItem(FULL_HISTORY_KEY, JSON.stringify(list));
    emitChange();
  } catch {}
}

// ── credit display helpers (read cached usage only) ──
export function getAvailableCredits(tier, usageOverride) {
  const u = usageOverride || getUsage();
  if (!u) return 0;
  const planCap  = u.credits?.[tier] ?? 0;
  const usedPlan = u.used?.[tier] ?? 0;
  const planLeft = planCap === -1 ? Infinity : Math.max(0, planCap - usedPlan);
  const passLeft = (u.passes || []).reduce((sum, p) => sum + (p.remaining?.[tier] || 0), 0);
  return planLeft === Infinity ? Infinity : planLeft + passLeft;
}
export function canCraft(tier) {
  return getAvailableCredits(tier) > 0;
}

// ── server round-trips ──
async function initSession() {
  const res = await fetch('/api/session/init', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Could not start a session. Try again in a minute.');
  }
  return data; // { token, usage }
}

async function upgrade({ token, planId, passId }) {
  const res = await fetch('/api/session/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, planId, passId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Upgrade failed.');
  }
  return data; // { token, usage }
}

// ── sign up / log in ──
export async function sendOtp({ email }) {
  if (typeof email !== 'string') throw new Error('Email required.');
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) throw new Error('Please enter a valid email.');

  if (isSupabaseEnabled()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });
      if (error) throw error;
      return true;
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Local browser-storage accounts are disabled in production. Please configure Supabase database credentials.');
    }
    return true; // Simulate success in local storage mode
  }
}

export async function verifyOtp({ email, token, name, type = 'email' }) {
  if (!token) throw new Error('Verification code required.');
  const cleanEmail = email.trim().toLowerCase();
  const cleanName  = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LEN) : '';

  if (isSupabaseEnabled()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type,
      });
      if (error) throw error;

      if (cleanName && data.user) {
        await supabase.auth.updateUser({ data: { display_name: cleanName } });
      }

      if (!getToken()) {
        const session = await initSession();
        applyServerState(session);
      } else {
        emitChange();
      }

      return {
        id: data.user.id,
        name: data.user.user_metadata?.display_name || cleanName || cleanEmail.split('@')[0],
        email: data.user.email,
        createdAt: data.user.created_at,
      };
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Local browser-storage accounts are disabled in production.');
    }
    const session = await initSession();
    const existing = getUserRecord();
    let user;
    if (existing && existing.email === cleanEmail) {
      user = existing;
    } else {
      user = {
        id: 'u_' + randomSalt().slice(0, 10),
        name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    }
    applyServerState(session);
    return user;
  }
}

export async function signUp({ name, email, password }) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Email and password required.');
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName  = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LEN) : '';

  if (!cleanEmail || !password)                    throw new Error('Email and password required.');
  if (cleanEmail.length > MAX_EMAIL_LEN)           throw new Error('Email is too long.');
  if (!EMAIL_RE.test(cleanEmail))                  throw new Error('Please enter a valid email.');
  if (password.length < 6)                         throw new Error('Password must be at least 6 characters.');
  if (password.length > MAX_PASSWORD_LEN)          throw new Error('Password is too long.');

  if (isSupabaseEnabled()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName || cleanEmail.split('@')[0],
          }
        }
      });
      if (error) throw error;
      
      // If email confirmation is required, session will be null.
      if (!data.session) {
        return { requiresOtp: true };
      }
      
      const session = await initSession();
      applyServerState(session);
      
      return {
        id: data.user.id,
        name: cleanName || cleanEmail.split('@')[0],
        email: data.user.email,
        createdAt: data.user.created_at,
      };
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Local browser-storage accounts are disabled in production. Please configure Supabase database credentials to sign up.');
    }
    // Simulate requiresOtp in dev mode so the UI can proceed to step 2
    return { requiresOtp: true };
  }

  const existing = getUserRecord();
  if (existing && existing.email === cleanEmail) {
    throw new Error('You already have an account on this device. Try logging in.');
  }

  const salt         = randomSalt();
  const passwordHash = await hashPassword(password, salt);

  // Ask the server for a signed session token — this is what actually gates credits.
  const session = await initSession();

  const user = {
    id: 'u_' + randomSalt().slice(0, 10),
    name: cleanName || cleanEmail.split('@')[0],
    email: cleanEmail,
    createdAt: new Date().toISOString(),
    passwordSalt: salt,
    passwordHash,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Fresh account — start with empty history.
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  applyServerState(session);

  const { passwordHash: _p, passwordSalt: _s, ...safe } = user;
  return safe;
}

export async function logIn({ email, password }) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Email and password required.');
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password)           throw new Error('Email and password required.');
  if (password.length > MAX_PASSWORD_LEN) throw new Error('Invalid password.');

  if (isSupabaseEnabled()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;

      if (!getToken()) {
        const session = await initSession();
        applyServerState(session);
      } else {
        emitChange();
      }

      return {
        id: data.user.id,
        name: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
        email: data.user.email,
        createdAt: data.user.created_at,
      };
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Local browser-storage accounts are disabled in production. Please configure Supabase database credentials to log in.');
    }
  }

  const existing = getUserRecord();
  const GENERIC  = 'Invalid email or password.';
  if (!existing || existing.email !== cleanEmail) throw new Error(GENERIC);

  if (!existing.passwordHash || !existing.passwordSalt) {
    throw new Error('This account was created before passwords were enforced. Please sign up again.');
  }

  const attempt = await hashPassword(password, existing.passwordSalt);
  if (!constantTimeEqual(attempt, existing.passwordHash)) throw new Error(GENERIC);

  // If the device has no valid session token (cleared storage, new device etc.)
  // request a fresh one. The /api/session/init endpoint is per-IP rate-limited.
  if (!getToken()) {
    const session = await initSession();
    applyServerState(session);
  } else {
    emitChange();
  }

  const { passwordHash, passwordSalt, ...safe } = existing;
  return safe;
}

export async function logOut() {
  if (typeof window === 'undefined') return;

  if (isSupabaseEnabled()) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  }

  // Clear every ciy-* key so shared devices don't leak prior history.
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ciy-')) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    [USER_KEY, USAGE_KEY, TOKEN_KEY, HISTORY_KEY, FULL_HISTORY_KEY].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  }
  emitChange();
}

// ── purchases — actually server round-trips now ──
export async function applyPlan(planId) {
  const token = getToken();
  if (!token) throw new Error('Sign in first.');
  const result = await upgrade({ token, planId });
  applyServerState(result);
  return result.usage;
}

export async function applyPass(pass) {
  const token = getToken();
  if (!token) throw new Error('Sign in first.');
  const passId = typeof pass === 'string' ? pass : pass?.id;
  if (!passId) throw new Error('Invalid pack.');
  const result = await upgrade({ token, passId });
  applyServerState(result);
  return result.usage;
}

// ── React hook ──
export function useAuth() {
  const [user, setUser]   = useState(null);
  const [usage, setUsage] = useState(null);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setUser(getUser());
    setUsage(getUsage());
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    const onChange = () => sync();
    window.addEventListener('ciy:auth-change', onChange);
    window.addEventListener('storage', onChange);

    let subscription = null;
    if (isSupabaseEnabled()) {
      const supabase = getBrowserSupabase();
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange(() => {
          sync();
        });
        subscription = data?.subscription;
      }
    }

    return () => {
      window.removeEventListener('ciy:auth-change', onChange);
      window.removeEventListener('storage', onChange);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch {}
      }
    };
  }, [sync]);

  return { user, usage, ready, refresh: sync };
}
