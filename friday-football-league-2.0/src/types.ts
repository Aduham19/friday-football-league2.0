export interface Player {
  id: string;
  name: string;
  avatar?: string;
  createdAt?: number;
}

export type MatchWinner = 'teamA' | 'teamB' | 'draw' | 'none';

export interface MatchSheet {
  teamAName: string;
  teamBName: string;
  teamAScore?: number;
  teamBScore?: number;
  winner?: MatchWinner;
  playerTeams?: Record<string, 'teamA' | 'teamB'>;
  notes?: string;
}

export interface Match {
  id: number;
  title: string;
  date: string;
  completed: boolean;
  matchSheet?: MatchSheet;
}

export interface PlayerMatchRecord {
  attendance: boolean;
  win: boolean;
  onTime: boolean;
  goals: number;
  ownGoals: number;
  penalty: number;
  team?: 'teamA' | 'teamB';
}

export type MatchResults = Record<number, Record<string, PlayerMatchRecord>>;

export interface LeagueData {
  players: Player[];
  matches: Match[];
  matchResults: MatchResults;
  deletedPlayerIds?: string[];
  deletedPlayerNames?: string[];
  lastUpdated?: number;
}

export interface MatchScoreDetail {
  matchId: number;
  matchTitle: string;
  score: number;
  isExcludedFromBest13?: boolean;
  details: PlayerMatchRecord;
}

export interface PlayerStats {
  matchesPlayed: number;
  matchWins: number;
  onTimeCount: number;
  attendanceCount: number;
  totalGoals: number;
  totalOwnGoals: number;
  totalPenalties: number;
  rawPoints: number;
  best13Points: number;
  matchScores: MatchScoreDetail[];
}

export interface PlayerStanding extends PlayerStats {
  player: Player;
  rank?: number;
}

export type UserRole = 'admin' | 'viewer';

export interface AuthSession {
  username: string;
  role: UserRole;
  displayName: string;
  loggedInAt: number;
}

export interface AuthConfig {
  adminUsername: string;
  adminPassword: string;
  viewerUsername: string;
  viewerPassword: string;
}

export type TabType = 'standings' | 'matches' | 'players' | 'rules';
