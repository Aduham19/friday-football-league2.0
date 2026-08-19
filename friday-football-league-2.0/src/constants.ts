import { Match } from './types';

export const DEFAULT_PLAYER_NAMES = [
  "HASAN", "HUSSEY", "MUSHIL", "NAVEY", "MORDO", "NIZAM", "FRED", "SAPPE", 
  "ABLO", "JANA", "SHIMAD", "RASHU", "IMDHAAH", "MURU", "MUNAWAR", "GAZA", 
  "AZIM", "AMEEN", "ADHU", "NADEY", "YUMIN", "SALIH", "ADAMAA", "JABE", 
  "NIYA", "MODU LAW", "XAIDEY", "RAMY", "ATTA", "GHANIMSO", "SHAFITTE", 
  "ZIGAREY", "BRIGADIER", "WADDE", "RICE", "MUJEY", "BARUTTEY"
];

export const LEAGUE_START_DATE = '2026-08-14';
export const TOTAL_MATCHES = 15;
export const LOCAL_STORAGE_KEY = 'friday_football_league_2_master_data_v1';

// Official League Jersey Colors & Defaults
export const DEFAULT_TEAM_A_NAME = 'Red Team';
export const DEFAULT_TEAM_B_NAME = 'Green Team';
export const TEAM_A_JERSEY_COLOR = 'Red';
export const TEAM_B_JERSEY_COLOR = 'Green';
export const TEAM_A_JERSEY_EMOJI = '🔴';
export const TEAM_B_JERSEY_EMOJI = '🟢';

export const TEAM_NAME_PRESETS = [
  { a: 'Red Team', b: 'Green Team', label: '🔴 Reds vs 🟢 Greens' },
  { a: 'Red Bibs', b: 'Green Bibs', label: 'Red Bibs vs Green Bibs' },
  { a: 'Team Gaza', b: 'Team Rashu', label: 'Gaza vs Rashu' },
  { a: 'Bibs', b: 'Non-Bibs', label: 'Bibs vs Non-Bibs' },
  { a: 'Lions', b: 'Tigers', label: 'Lions vs Tigers' },
  { a: 'Team A', b: 'Team B', label: 'Team A vs B' },
];

export function formatLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getNextFridayAfterDate(dateStr: string): string {
  if (!dateStr) return LEAGUE_START_DATE;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + 7);
  return formatLocalDateString(date);
}

export function generateDefaultMatches(count: number = TOTAL_MATCHES): Match[] {
  const matches: Match[] = [];
  const [startYear, startMonth, startDay] = LEAGUE_START_DATE.split('-').map(Number);
  
  for (let i = 1; i <= count; i++) {
    const matchDate = new Date(startYear, startMonth - 1, startDay + (i - 1) * 7);
    const dateStr = formatLocalDateString(matchDate);
    matches.push({
      id: i,
      title: `Match ${i}`,
      date: dateStr,
      completed: false,
      matchSheet: {
        teamAName: DEFAULT_TEAM_A_NAME,
        teamBName: DEFAULT_TEAM_B_NAME,
      }
    });
  }
  return matches;
}

export function formatPlayerName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}
