import { getAdminSupabase } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/server/session';
import { captureServerError } from '@/lib/server/sentry';

export async function POST(req, { params }) {
  const pluginId = params?.id;
  if (!pluginId) {
    return Response.json({ success: false, error: 'Missing plugin ID.' }, { status: 400 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { vote, token } = body;
    if (vote !== 'up' && vote !== 'down') {
      return Response.json({ success: false, error: 'Vote must be either "up" or "down".' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ success: false, error: 'Authentication required to vote.' }, { status: 401 });
    }

    // 1. Verify signed session token to authenticate voter
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return Response.json({ success: false, error: 'Invalid session — please sign in again.' }, { status: 401 });
    }

    const userId = payload.uid;
    const voteValue = vote === 'up' ? 1 : -1;

    const db = getAdminSupabase();
    if (!db) {
      // Local development fallback: pretend to save vote successfully
      return Response.json({
        success: true,
        fallback: true,
        pluginId,
        vote,
        msg: 'Vote simulated successfully (Supabase not configured).'
      });
    }

    // 2. Upsert the vote in PostgreSQL
    const { error } = await db.from('ratings').upsert({
      plugin_id: pluginId,
      user_id: userId,
      value: voteValue,
      updated_at: new Date().toISOString()
    }, { onConflict: 'plugin_id,user_id' });

    if (error) {
      captureServerError(error, { where: 'vote:upsert', pluginId, userId });
      return Response.json({ success: false, error: 'Failed to record vote. Please try again.' }, { status: 500 });
    }

    // 3. Fetch current score aggregates
    const { data: scoreData, error: scoreError } = await db
      .from('ratings')
      .select('value')
      .eq('plugin_id', pluginId);

    let upvotes = 0;
    let downvotes = 0;

    if (!scoreError && scoreData) {
      scoreData.forEach(row => {
        if (row.value === 1) upvotes++;
        else if (row.value === -1) downvotes++;
      });
    }

    return Response.json({
      success: true,
      pluginId,
      vote,
      upvotes,
      downvotes,
      totalVotes: upvotes + downvotes
    });

  } catch (err) {
    captureServerError(err, { where: 'vote:post', pluginId });
    return Response.json({ success: false, error: 'Internal server error during voting.' }, { status: 500 });
  }
}
