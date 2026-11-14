import { getAdminSupabase } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/server/session';
import { captureServerError } from '@/lib/server/sentry';
import { EXPLORE_PLUGINS } from '@/lib/examplePlugins';
import { applyIPGuard } from '@/lib/server/routeGuard';

// Wilson Score Interval sorting helper (prevents listing/cold-start bias)
function getWilsonScore(upvotes = 0, downvotes = 0) {
  const n = upvotes + downvotes;
  if (n === 0) return 0;
  const z = 1.96; // 95% confidence interval
  const p = upvotes / n;
  const left = p + (z * z) / (2 * n);
  const right = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;
  return (left - right) / denominator;
}

export async function GET(req) {
  try {
    const guard = await applyIPGuard(req, 'plugins:get', { max: 60, windowMs: 60_000 });
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const query = searchParams.get('q') || '';
    const sortBy = searchParams.get('sortBy') || 'popular';

    const db = getAdminSupabase();
    let plugins = [];

    if (!db) {
      // Fallback: use examplePlugins
      plugins = [...EXPLORE_PLUGINS];
    } else {
      // 1. Fetch live plugins from Supabase
      const { data, error } = await db
        .from('plugins')
        .select(`
          *,
          ratings(value)
        `)
        .eq('is_public', true);

      if (error) {
        captureServerError(error, { where: 'plugins:get:db' });
        plugins = [...EXPLORE_PLUGINS];
      } else if (data) {
        plugins = data.map(item => {
          let upvotes = 0;
          let downvotes = 0;
          if (item.ratings) {
            item.ratings.forEach(r => {
              if (r.value === 1) upvotes++;
              else if (r.value === -1) downvotes++;
            });
          }
          return {
            id: String(item.id),
            name: item.name,
            description: item.description,
            author: item.author || 'CIY Maker',
            downloads: Number(item.downloads || 0),
            version: item.version || '1.21.4',
            complexity: item.complexity || 'Medium',
            tags: item.tags || [],
            files: item.files || {},
            upvotes,
            downvotes,
            score: getWilsonScore(upvotes, downvotes),
            createdAt: item.created_at
          };
        });
      }
    }

    // 2. Client-side Search & Tag filtering logic
    let filtered = plugins.filter(plugin => {
      const q = query.toLowerCase();
      const matchesSearch =
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.tags.some(t => t.toLowerCase().includes(q));
      
      const matchesCategory =
        category === 'all' ||
        plugin.tags.some(tag => tag.toLowerCase() === category.toLowerCase());

      return matchesSearch && matchesCategory;
    });

    // 3. Apply ranking methods
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'downloads') {
      filtered.sort((a, b) => b.downloads - a.downloads);
    } else {
      // Sort by Wilson Score rating
      filtered.sort((a, b) => b.score - a.score || b.downloads - a.downloads);
    }

    return Response.json({ success: true, plugins: filtered });

  } catch (err) {
    captureServerError(err, { where: 'plugins:get' });
    return Response.json({ success: false, error: 'Failed to retrieve plugin gallery.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { name, description, tags, files, token, complexity, version } = body;
    if (!name || !files || !token) {
      return Response.json({ success: false, error: 'Missing required creation parameters.' }, { status: 400 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return Response.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    // FIX-05: 500KB file size check guard
    const filesStr = JSON.stringify(files || {});
    if (filesStr.length > 500_000) {
      return Response.json({ success: false, error: 'Plugin files exceed size limit (Max 500KB).' }, { status: 413 });
    }

    const db = getAdminSupabase();
    if (!db) {
      return Response.json({
        success: true,
        fallback: true,
        id: 'mock_' + Math.random().toString(36).substring(7),
        msg: 'Plugin registered successfully locally.'
      });
    }

    // Insert new generated plugin
    const { data, error } = await db.from('plugins').insert({
      name,
      description: description || 'A custom Minecraft plugin created with Craft It Yourself.',
      author: payload.name || (payload.uid ? `crafter_${payload.uid.slice(2, 8)}` : 'CIY Maker'),
      user_id: payload.uid,
      complexity: complexity || 'Medium',
      version: version || '1.21.4',
      tags: tags || ['Utility'],
      files: files || {},
      is_public: body.is_public !== undefined ? Boolean(body.is_public) : true,
      downloads: 0
    }).select('id').single();

    if (error) {
      captureServerError(error, { where: 'plugins:post:db' });
      return Response.json({ success: false, error: 'Database failed to save generated plugin.' }, { status: 500 });
    }

    return Response.json({
      success: true,
      id: String(data.id),
      msg: 'Your plugin is now saved to the Explore library!'
    });

  } catch (err) {
    captureServerError(err, { where: 'plugins:post' });
    return Response.json({ success: false, error: 'Internal server error saving plugin.' }, { status: 500 });
  }
}
