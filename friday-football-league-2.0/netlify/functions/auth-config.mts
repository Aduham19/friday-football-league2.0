import type { Config, Context } from '@netlify/functions';
import { AUTH_KEY, DEFAULT_AUTH_CONFIG, NO_CACHE_HEADERS, getLeagueStore } from '../lib/league-store.mts';

export default async (req: Request, _context: Context) => {
  const store = getLeagueStore();

  if (req.method === 'GET') {
    const stored = (await store.get(AUTH_KEY, { type: 'json' })) as any;
    if (stored && stored.adminPassword) {
      return Response.json(stored, { headers: NO_CACHE_HEADERS });
    }
    await store.setJSON(AUTH_KEY, DEFAULT_AUTH_CONFIG);
    return Response.json(DEFAULT_AUTH_CONFIG, { headers: NO_CACHE_HEADERS });
  }

  if (req.method === 'POST') {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (!payload || !payload.adminPassword) {
      return Response.json({ error: 'Invalid auth config payload' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    await store.setJSON(AUTH_KEY, {
      adminUsername: payload.adminUsername || DEFAULT_AUTH_CONFIG.adminUsername,
      adminPassword: payload.adminPassword,
      viewerUsername: payload.viewerUsername || DEFAULT_AUTH_CONFIG.viewerUsername,
      viewerPassword: payload.viewerPassword || DEFAULT_AUTH_CONFIG.viewerPassword
    });

    return Response.json({ success: true }, { headers: NO_CACHE_HEADERS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: NO_CACHE_HEADERS });
};

export const config: Config = {
  path: '/api/auth-config'
};
