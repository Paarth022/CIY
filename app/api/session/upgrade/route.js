import {
  verifyToken, signToken,
  applyPlan, applyPass, toClientUsage,
} from '@/lib/server/session';
import { PLANS, PASSES } from '@/lib/plans';

const VALID_PLAN_IDS = new Set(PLANS.map(p => p.id));
const VALID_PASS_IDS = new Set(PASSES.map(p => p.id));

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') {
    return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { token, planId, passId } = body;
  if (typeof token !== 'string') {
    return Response.json({ success: false, error: 'Missing session token.' }, { status: 400 });
  }

  let payload;
  try { payload = verifyToken(token); }
  catch {
    return Response.json(
      { success: false, error: 'Your session expired — please sign in again.', code: 'session_expired' },
      { status: 401 }
    );
  }

  try {
    let next;
    if (typeof planId === 'string') {
      if (!VALID_PLAN_IDS.has(planId)) {
        return Response.json({ success: false, error: 'Unknown plan.' }, { status: 400 });
      }
      next = applyPlan(payload, planId);
    } else if (typeof passId === 'string') {
      if (!VALID_PASS_IDS.has(passId)) {
        return Response.json({ success: false, error: 'Unknown pack.' }, { status: 400 });
      }
      next = applyPass(payload, passId);
    } else {
      return Response.json({ success: false, error: 'Nothing to upgrade.' }, { status: 400 });
    }

    return Response.json({
      success: true,
      token:   signToken(next),
      usage:   toClientUsage(next),
    });
  } catch (e) {
    console.error('session/upgrade error:', e);
    return Response.json({ success: false, error: 'Upgrade failed.' }, { status: 500 });
  }
}
