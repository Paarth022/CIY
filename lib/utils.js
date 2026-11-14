import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Only allow in-app relative paths. Blocks open-redirect attacks
// like ?next=https://evil.com, ?next=//evil.com, or ?next=/\evil.com.
export function sanitizeNext(next, fallback = '/create') {
  if (typeof next !== 'string' || next.length === 0 || next.length > 512) return fallback;
  if (next[0] !== '/') return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\x00-\x1F\s\\]/.test(next)) return fallback;
  return next;
}
