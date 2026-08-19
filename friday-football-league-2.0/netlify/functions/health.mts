import type { Config, Context } from '@netlify/functions';
import { NO_CACHE_HEADERS } from '../lib/league-store.mts';

export default async (_req: Request, _context: Context) => {
  return Response.json({ status: 'ok', timestamp: Date.now() }, { headers: NO_CACHE_HEADERS });
};

export const config: Config = {
  path: '/api/health'
};
