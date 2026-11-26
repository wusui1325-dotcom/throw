// Cloudflare Worker + KV Global Leaderboard for THROW (throw.wusper.com/api/leaderboard)
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/leaderboard') {
      return json({ error: 'Not Found' }, 404);
    }

    if (request.method === 'GET') {
      const raw = await env.THROW_LB.get('top_scores');
      const list = raw ? JSON.parse(raw) : [];
      return json({ ok: true, scores: list.slice(0, 30) });
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const name = String(body.name || '無名守衛')
        .replace(/[<>&"'`]/g, '')
        .trim()
        .slice(0, 16) || '無名守衛';

      const timeSec = Math.max(1, Math.min(86400, Math.floor(Number(body.timeSec) || 0)));
      const intensity = Math.max(1, Math.min(999, Math.floor(Number(body.intensity) || 1)));
      const kills = Math.max(0, Math.min(999999, Math.floor(Number(body.kills) || 0)));
      const maxCombo = Math.max(0, Math.min(9999, Math.floor(Number(body.maxCombo) || 0)));
      const towerTier = Math.max(0, Math.min(8, Math.floor(Number(body.towerTier) || 0)));

      const raw = await env.THROW_LB.get('top_scores');
      const list = raw ? JSON.parse(raw) : [];

      const entry = {
        id: crypto.randomUUID().slice(0, 8),
        name,
        timeSec,
        intensity,
        kills,
        maxCombo,
        towerTier,
        ts: Date.now(),
      };

      list.push(entry);
      list.sort((a, b) => b.timeSec - a.timeSec || b.kills - a.kills || a.ts - b.ts);
      const trimmed = list.slice(0, 100);
      await env.THROW_LB.put('top_scores', JSON.stringify(trimmed));

      const rank = trimmed.findIndex((item) => item.id === entry.id) + 1;
      return json({ ok: true, rank, scores: trimmed.slice(0, 30) });
    }

    return json({ error: 'Method Not Allowed' }, 405);
  },
};
