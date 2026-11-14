// Lazy Stripe client. Returns null (with a readable reason) when not configured
// so dev environments without a key still run.
import Stripe from 'stripe';
import { PLANS, PASSES } from '@/lib/plans';

let client = null;
let loaded = false;

export function getStripe() {
  if (loaded) return client;
  loaded = true;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    client = new Stripe(key, { apiVersion: '2024-04-10' });
    return client;
  } catch (e) {
    console.error('[stripe] could not initialise:', e?.message);
    return null;
  }
}

// Each plan/pass needs a Stripe price ID. Env names follow a strict pattern.
const PLAN_PRICE_ENV = {
  starter:  'STRIPE_PRICE_STARTER',
  crafter:  'STRIPE_PRICE_CRAFTER',
  master:   'STRIPE_PRICE_MASTER',
};
const PASS_PRICE_ENV = {
  'pass-normal':   'STRIPE_PRICE_PASS_NORMAL',
  'pass-medium':   'STRIPE_PRICE_PASS_MEDIUM',
  'pass-advanced': 'STRIPE_PRICE_PASS_ADVANCED',
};

export function priceForPlan(planId) {
  const envKey = PLAN_PRICE_ENV[planId];
  return envKey ? process.env[envKey] : null;
}
export function priceForPass(passId) {
  const envKey = PASS_PRICE_ENV[passId];
  return envKey ? process.env[envKey] : null;
}

export function knownPlan(planId) {
  return PLANS.some(p => p.id === planId && p.id !== 'free');
}
export function knownPass(passId) {
  return PASSES.some(p => p.id === passId);
}

// Webhook signing secret
export function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}
