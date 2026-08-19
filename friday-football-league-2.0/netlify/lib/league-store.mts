import { getStore } from '@netlify/blobs';

export const LEAGUE_KEY = 'main_season_2026';
export const AUTH_KEY = 'auth_config';

export const DEFAULT_PLAYER_NAMES = [
  'HASAN', 'HUSSEY', 'MUSHIL', 'NAVEY', 'MORDO', 'NIZAM', 'FRED', 'SAPPE',
  'ABLO', 'JANA', 'SHIMAD', 'RASHU', 'IMDHAAH', 'MURU', 'MUNAWAR', 'GAZA',
  'AZIM', 'AMEEN', 'ADHU', 'NADEY', 'YUMIN', 'SALIH', 'ADAMAA', 'JABE',
  'NIYA', 'MODU LAW', 'XAIDEY', 'RAMY', 'ATTA', 'GHANIMSO', 'SHAFITTE',
  'ZIGAREY', 'BRIGADIER', 'WADDE', 'RICE', 'MUJEY', 'BARUTTEY'
];

export const LEAGUE_START_DATE = '2026-08-14';
export const TOTAL_MATCHES = 15;

export const DEFAULT_AUTH_CONFIG = {
  adminUsername: 'admin',
  adminPassword: 'admin2026',
  viewerUsername: 'viewer',
  viewerPassword: 'ffl2026'
};

export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

export function getLeagueStore() {
  // Strong consistency so an edit made by the admin is immediately visible to
  // every other device that reloads or force-syncs.
  return getStore({ name: 'ffl-league', consistency: 'strong' });
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialLeagueData() {
  const players = DEFAULT_PLAYER_NAMES.map((name, idx) => ({
    id: `p_${idx + 1}`,
    name,
    avatar: '',
    createdAt: 1700000000000 + idx
  }));

  const [startYear, startMonth, startDay] = LEAGUE_START_DATE.split('-').map(Number);
  const matches = [];
  for (let i = 1; i <= TOTAL_MATCHES; i++) {
    const matchDate = new Date(startYear, startMonth - 1, startDay + (i - 1) * 7);
    matches.push({
      id: i,
      title: `Match ${i}`,
      date: formatDate(matchDate),
      completed: false
    });
  }

  return {
    players,
    matches,
    matchResults: {},
    deletedPlayerIds: [],
    deletedPlayerNames: [],
    lastUpdated: 0
  };
}

/**
 * Strips out any player that has been tombstoned so deletions stay deleted
 * on every device, mirroring the behaviour of the local dev Express server.
 */
export function applyTombstones(data: any) {
  if (!data || !Array.isArray(data.players)) return data;

  const deletedIds = new Set(data.deletedPlayerIds || []);
  const deletedNames = new Set(
    (data.deletedPlayerNames || []).map((n: string) => String(n).trim().toLowerCase())
  );

  return {
    ...data,
    deletedPlayerIds: data.deletedPlayerIds || [],
    deletedPlayerNames: data.deletedPlayerNames || [],
    players: data.players.filter(
      (p: any) => !deletedIds.has(p.id) && !deletedNames.has(String(p.name || '').trim().toLowerCase())
    )
  };
}
