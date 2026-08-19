import type { Config, Context } from '@netlify/functions';
import {
  LEAGUE_KEY,
  NO_CACHE_HEADERS,
  applyTombstones,
  getInitialLeagueData,
  getLeagueStore
} from '../lib/league-store.mts';

export default async (req: Request, _context: Context) => {
  const store = getLeagueStore();
  const url = new URL(req.url);
  const isReset = url.pathname.includes('reset-league');

  if (isReset) {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: NO_CACHE_HEADERS });
    }
    const initial = getInitialLeagueData();
    initial.lastUpdated = Date.now();
    await store.setJSON(LEAGUE_KEY, initial);
    return Response.json({ success: true, data: initial }, { headers: NO_CACHE_HEADERS });
  }

  if (req.method === 'GET') {
    const stored = (await store.get(LEAGUE_KEY, { type: 'json' })) as any;
    if (stored && Array.isArray(stored.players) && stored.players.length > 0) {
      if (!stored.lastUpdated) stored.lastUpdated = Date.now();
      return Response.json(applyTombstones(stored), { headers: NO_CACHE_HEADERS });
    }

    const initial = getInitialLeagueData();
    await store.setJSON(LEAGUE_KEY, initial);
    return Response.json(initial, { headers: NO_CACHE_HEADERS });
  }

  if (req.method === 'POST') {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (!payload || !Array.isArray(payload.players)) {
      return Response.json({ error: 'Invalid league data payload' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (!payload.lastUpdated) payload.lastUpdated = Date.now();
    await store.setJSON(LEAGUE_KEY, applyTombstones(payload));

    return Response.json({ success: true, timestamp: payload.lastUpdated }, { headers: NO_CACHE_HEADERS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: NO_CACHE_HEADERS });
};

export const config: Config = {
  path: ['/api/league', '/api/reset-league']
};
