import { DEFAULT_PLAYER_NAMES, LOCAL_STORAGE_KEY, generateDefaultMatches, formatLocalDateString } from '../constants';
import { LeagueData, Match, Player, PlayerMatchRecord } from '../types';
import { getFirebaseLeagueData, saveFirebaseLeagueData } from '../firebase';

const SNAPSHOTS_KEY = 'ffl_backup_snapshots_v1';
const FALLBACK_KEYS = [
  LOCAL_STORAGE_KEY,
  'friday_football_league_2_master_data_v1',
  'friday_football_league_2_data_persistent_v22',
  'friday_football_league_2_data_persistent_v21',
  'friday_football_league_2_data_persistent_v20',
  'friday_football_league_2_data_persistent_v19',
  'friday_football_league_2_data_persistent_v18',
  'friday_football_league_2_data',
  'ffl_2026_data',
  'ffl_league_data'
];

export function fixDatesToFriday(matches: Match[]): Match[] {
  return matches.map(m => {
    if (!m.date) return m;
    const [y, month, d] = m.date.split('-').map(Number);
    const dateObj = new Date(y, month - 1, d);
    if (dateObj.getDay() === 4) {
      dateObj.setDate(dateObj.getDate() + 1);
      return {
        ...m,
        date: formatLocalDateString(dateObj)
      };
    }
    return m;
  });
}

export function getDefaultLeagueData(): LeagueData {
  const initialPlayers = DEFAULT_PLAYER_NAMES.map((name, idx) => ({
    id: `p_${idx + 1}`,
    name: name,
    avatar: '',
    createdAt: 1700000000000 + idx
  }));

  return {
    players: initialPlayers,
    matches: generateDefaultMatches(),
    matchResults: {},
    deletedPlayerIds: [],
    deletedPlayerNames: [],
    lastUpdated: 0 // Initial base timestamp so cloud/server data always supersedes fresh client defaults
  };
}

// Clears obsolete temporary cache keys so legacy test data never resurrects
export function clearLegacyStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const obsoleteKeys = [
    'friday_football_league_2_data_persistent_v22',
    'friday_football_league_2_data_persistent_v21',
    'friday_football_league_2_data_persistent_v20',
    'friday_football_league_2_data_persistent_v19',
    'friday_football_league_2_data_persistent_v18',
    'friday_football_league_2_data_persistent_v17',
    'friday_football_league_2_data_persistent_v16',
    'friday_football_league_2_data_persistent_v15',
    'friday_football_league_2_data_persistent_v14',
    'friday_football_league_2_data_persistent_v10',
    'friday_football_league_2_data',
    'ffl_2026_data',
    'ffl_league_data'
  ];

  for (const k of obsoleteKeys) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
}

// Scans available localStorage for backup/recovery in manual Data Backup modal
export function scanAndRecoverAnyLocalData(): LeagueData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Also check snapshots
  try {
    const rawSnaps = localStorage.getItem(SNAPSHOTS_KEY);
    if (rawSnaps) {
      const snaps = JSON.parse(rawSnaps);
      if (Array.isArray(snaps) && snaps.length > 0 && snaps[0]?.data?.players?.length > 0) {
        return snaps[0].data;
      }
    }
  } catch (e) {}

  return null;
}

// Load league data from local storage
export function loadLeagueData(): LeagueData {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          if (!parsed.lastUpdated) parsed.lastUpdated = Date.now();
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load league data from primary key', e);
    }

    // One-time fallback migration from older keys if primary key doesn't exist yet
    for (const key of FALLBACK_KEYS) {
      if (key === LOCAL_STORAGE_KEY) continue;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
            if (!parsed.lastUpdated) parsed.lastUpdated = Date.now();
            saveLeagueDataLocally(parsed);
            clearLegacyStorageKeys();
            return parsed;
          }
        }
      } catch (e) {}
    }
  }

  const initialData = getDefaultLeagueData();
  saveLeagueDataLocally(initialData);
  return initialData;
}

// Robust merge engine: respects latest updated state so deleted players remain deleted,
// while preserving newly recorded match results and player customizations
export function mergeLeagueData(local: LeagueData | null, server: LeagueData | null): LeagueData {
  if (!local && !server) {
    return getDefaultLeagueData();
  }
  if (!local && server) {
    return server;
  }
  if (local && !server) {
    return local;
  }

  const l = local!;
  const s = server!;

  // Combine deletion tombstones from both datasets so deletions are permanently honored across all devices
  const combinedDeletedIds = Array.from(
    new Set([...(l.deletedPlayerIds || []), ...(s.deletedPlayerIds || [])])
  );
  const combinedDeletedNames = Array.from(
    new Set(
      [...(l.deletedPlayerNames || []), ...(s.deletedPlayerNames || [])].map((n) =>
        n.trim().toLowerCase()
      )
    )
  );

  const deletedIdSet = new Set(combinedDeletedIds);
  const deletedNameSet = new Set(combinedDeletedNames);

  const localMatchCount = Object.keys(l.matchResults || {}).length;
  const serverMatchCount = Object.keys(s.matchResults || {}).length;

  // Determine which dataset is the newer/richer authority
  let localIsNewer = (l.lastUpdated || 0) > (s.lastUpdated || 0);

  // If local is an unedited default with 0 matches while server has recorded matches, server is strictly authority
  if (localMatchCount === 0 && serverMatchCount > 0) {
    localIsNewer = false;
  } else if (serverMatchCount === 0 && localMatchCount > 0 && (l.lastUpdated || 0) > 0) {
    localIsNewer = true;
  }

  const primary = localIsNewer ? l : s;
  const secondary = localIsNewer ? s : l;

  // Take the player list from primary, or fallback to secondary, and strictly filter out any tombstoned players
  const rawPlayers: Player[] = (primary.players && primary.players.length > 0)
    ? primary.players
    : (secondary.players && secondary.players.length > 0 ? secondary.players : getDefaultLeagueData().players);

  const finalPlayers = rawPlayers.filter(
    (p) => !deletedIdSet.has(p.id) && !deletedNameSet.has(p.name.trim().toLowerCase())
  );

  const activePlayerIds = new Set(finalPlayers.map(p => p.id));
  const activePlayerNames = new Set(finalPlayers.map(p => p.name.trim().toLowerCase()));

  // Merge matchResults:
  // Primary (newer) results take complete precedence for matches it has recorded.
  // If secondary has recorded a match that primary did not touch, preserve it,
  // but strictly filter out any player results for deleted players.
  const mergedResults: Record<number, Record<string, PlayerMatchRecord>> = {};
  const allMatchKeys = new Set<string>([
    ...Object.keys(primary.matchResults || {}),
    ...Object.keys(secondary.matchResults || {})
  ]);

  allMatchKeys.forEach(key => {
    const mId = Number(key);
    const primRec = (primary.matchResults || {})[mId] || (primary.matchResults || {})[key as any];
    const secRec = (secondary.matchResults || {})[mId] || (secondary.matchResults || {})[key as any];

    const chosenRec = primRec || secRec;
    if (chosenRec && typeof chosenRec === 'object') {
      const cleanMatchRec: Record<string, PlayerMatchRecord> = {};
      Object.entries(chosenRec).forEach(([pKey, pRec]) => {
        const pKeyLower = pKey.trim().toLowerCase();
        // Only keep records for active players currently in the roster and not tombstoned
        if (
          !deletedIdSet.has(pKey) &&
          !deletedNameSet.has(pKeyLower) &&
          (activePlayerIds.has(pKey) || activePlayerNames.has(pKeyLower))
        ) {
          cleanMatchRec[pKey] = pRec;
        }
      });
      if (Object.keys(cleanMatchRec).length > 0) {
        mergedResults[mId] = cleanMatchRec;
      }
    }
  });

  // Base matches list from primary
  const baseMatches = (primary.matches && primary.matches.length > 0)
    ? primary.matches
    : (secondary.matches && secondary.matches.length > 0 ? secondary.matches : generateDefaultMatches());
  const fixedMatches = fixDatesToFriday(baseMatches);

  const finalizedMatches = fixedMatches.map(m => {
    const secMatch = (secondary.matches || []).find(sm => sm.id === m.id);
    const resolvedMatchSheet = m.matchSheet || secMatch?.matchSheet;
    const mRes = mergedResults[m.id];
    const hasAct = !!mRes && Object.values(mRes).some(r => r && (r.attendance || r.goals > 0 || r.ownGoals > 0 || r.penalty > 0 || r.win || r.onTime));
    return {
      ...m,
      matchSheet: resolvedMatchSheet,
      completed: hasAct || Boolean(m.completed)
    };
  });

  const lastUpdated = Math.max(l.lastUpdated || 0, s.lastUpdated || 0, Date.now());

  return {
    players: finalPlayers,
    matches: finalizedMatches,
    matchResults: mergedResults,
    deletedPlayerIds: combinedDeletedIds,
    deletedPlayerNames: combinedDeletedNames,
    lastUpdated
  };
}

export async function fetchServerLeagueData(currentLocalData?: LeagueData): Promise<LeagueData | null> {
  // First, check Firebase Cloud Firestore for real-time live league state
  try {
    const firestoreData = await getFirebaseLeagueData();
    if (firestoreData && Array.isArray(firestoreData.players) && firestoreData.players.length > 0) {
      const localData = currentLocalData || loadLeagueData();
      const merged = mergeLeagueData(localData, firestoreData);
      saveLeagueDataLocally(merged);
      return merged;
    }
  } catch (fbErr) {
    console.warn('Firebase sync read fallback to Express server:', fbErr);
  }

  // Fallback to Express backend server
  try {
    const res = await fetch('/api/league', {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
      const serverData: LeagueData = await res.json();
      if (serverData && Array.isArray(serverData.players) && serverData.players.length > 0) {
        const localData = currentLocalData || loadLeagueData();
        const merged = mergeLeagueData(localData, serverData);
        saveLeagueDataLocally(merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('Could not fetch league data from server, using local cache', e);
  }

  // Fallback to local cache
  const localFallback = currentLocalData || loadLeagueData();
  return localFallback;
}

export function saveLeagueDataLocally(data: LeagueData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!data.lastUpdated) {
      data.lastUpdated = Date.now();
    }
    const serialized = JSON.stringify(data);
    
    // Save to master active key
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    
    // Save periodic snapshot (keeps last 15 snapshots)
    const rawSnaps = localStorage.getItem(SNAPSHOTS_KEY);
    let snapshots: { timestamp: number; date: string; matchCount: number; data: LeagueData }[] = [];
    if (rawSnaps) {
      try {
        snapshots = JSON.parse(rawSnaps);
      } catch (err) {}
    }
    const matchCount = Object.keys(data.matchResults || {}).length;
    
    const lastSnap = snapshots[0];
    const isDuplicate = lastSnap &&
      (Date.now() - lastSnap.timestamp < 3000) &&
      lastSnap.matchCount === matchCount &&
      lastSnap.data?.players?.length === data.players.length;

    if (!isDuplicate) {
      snapshots.unshift({
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        matchCount,
        data: JSON.parse(serialized)
      });
      if (snapshots.length > 15) snapshots = snapshots.slice(0, 15);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    }
  } catch (e) {
    console.error('Failed to save league data to localStorage', e);
  }
}

export async function syncLeagueDataToServer(data: LeagueData): Promise<boolean> {
  if (!data.lastUpdated) {
    data.lastUpdated = Date.now();
  }
  // Ensure local storage is updated synchronously
  saveLeagueDataLocally(data);

  // Sync to Firebase Cloud Database for live team member synchronization
  saveFirebaseLeagueData(data).catch((err) => {
    console.warn('Firebase Cloud Database sync warning:', err);
  });

  try {
    const res = await fetch('/api/league', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync league data to server', err);
    return false;
  }
}

export function saveLeagueData(data: LeagueData): void {
  saveLeagueDataLocally(data);
}

export function getLocalSnapshots(): { timestamp: number; date: string; matchCount: number; data: LeagueData }[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const rawSnaps = localStorage.getItem(SNAPSHOTS_KEY);
    if (rawSnaps) {
      const parsed = JSON.parse(rawSnaps);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && s.data && Array.isArray(s.data.players));
      }
    }
  } catch (e) {}
  return [];
}


