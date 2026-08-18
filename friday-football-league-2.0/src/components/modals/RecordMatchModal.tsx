import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, ClipboardList, CheckSquare, Square, Search, CheckCheck, RotateCcw, 
  Save, ShieldAlert, Users, Sparkles, Calendar, CheckCircle2, AlertCircle, 
  FileText, Trophy, Clock, Trash2, ArrowRight, UserCheck, Plus, Check,
  Pin, Filter, UserMinus, Zap, Star, Swords, Shield, ChevronRight
} from 'lucide-react';
import { formatPlayerName, getDayOfWeekName, DEFAULT_TEAM_A_NAME, DEFAULT_TEAM_B_NAME, TEAM_NAME_PRESETS, TEAM_A_JERSEY_EMOJI, TEAM_B_JERSEY_EMOJI } from '../../constants';
import { LeagueData, Match, Player, PlayerMatchRecord, MatchSheet, MatchWinner } from '../../types';

interface RecordMatchModalProps {
  isOpen: boolean;
  selectedMatchId: number;
  leagueData: LeagueData;
  onClose: () => void;
  onSaveMatchResults: (
    matchId: number, 
    matchRecords: Record<string, PlayerMatchRecord>, 
    updatedDate?: string,
    matchSheet?: MatchSheet
  ) => void;
  onResetMatchResults?: (matchId: number) => void;
}

type FilterViewMode = 'all' | 'present' | 'absent' | 'win' | 'ontime' | 'teamA' | 'teamB';

export const RecordMatchModal: React.FC<RecordMatchModalProps> = ({
  isOpen,
  selectedMatchId,
  leagueData,
  onClose,
  onSaveMatchResults,
  onResetMatchResults,
}) => {
  const [matchId, setMatchId] = useState<number>(selectedMatchId || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<Record<string, PlayerMatchRecord>>({});
  const [matchDate, setMatchDate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterViewMode>('all');
  const [showPasteRoster, setShowPasteRoster] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<{ matched: string[]; notFound: string[]; mode?: string } | null>(null);
  const [pinSelectedToTop, setPinSelectedToTop] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  
  // Match Sheet State - Defaults to Red Team & Blue Team with Red/Blue jerseys
  const [teamAName, setTeamAName] = useState(DEFAULT_TEAM_A_NAME);
  const [teamBName, setTeamBName] = useState(DEFAULT_TEAM_B_NAME);
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');
  const [matchWinner, setMatchWinner] = useState<MatchWinner>('none');
  const [matchNotes, setMatchNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'match_sheet' | 'player_list'>('match_sheet');

  const [customCategories, setCustomCategories] = useState<{
    attendance: boolean;
    win: boolean;
    onTime: boolean;
  }>({
    attendance: true,
    win: false,
    onTime: true,
  });
  
  const [lastAppliedFeedback, setLastAppliedFeedback] = useState<{
    message: string;
    playerNames: string[];
    timestamp: number;
  } | null>(null);

  const [saveProgressToast, setSaveProgressToast] = useState(false);
  const hasUserEditedRef = useRef(false);
  const wasOpenRef = useRef(false);
  const currentMatchIdRef = useRef<number>(selectedMatchId || 1);

  // Helper to extract initial records for a given match from leagueData
  const getInitialRecordsForMatch = (targetMatchId: number, data: LeagueData): Record<string, PlayerMatchRecord> => {
    if (!data || !data.players) return {};
    const resultsObj = data.matchResults || {};
    
    const existing = resultsObj[targetMatchId] || 
                     (resultsObj as any)[String(targetMatchId)] || 
                     (resultsObj as any)[Number(targetMatchId)] ||
                     (resultsObj as any)[`match_${targetMatchId}`] || 
                     (resultsObj as any)[`Match ${targetMatchId}`] || 
                     {};

    const initial: Record<string, PlayerMatchRecord> = {};
    const existingKeys = Object.keys(existing);
    
    data.players.forEach(p => {
      const pIdLower = (p.id || '').trim().toLowerCase();
      const pNameLower = (p.name || '').trim().toLowerCase();
      
      let pRecord = existing[p.id] || (existing as any)[p.name];
      
      if (!pRecord && existingKeys.length > 0) {
        const foundKey = existingKeys.find(k => {
          const kLower = k.trim().toLowerCase();
          return kLower === pIdLower || kLower === pNameLower;
        });
        if (foundKey) {
          pRecord = existing[foundKey];
        }
      }

      if (pRecord) {
        initial[p.id] = {
          attendance: Boolean(pRecord.attendance),
          win: Boolean(pRecord.win),
          onTime: Boolean(pRecord.onTime),
          goals: Number(pRecord.goals) || 0,
          ownGoals: Number(pRecord.ownGoals) || 0,
          penalty: Number(pRecord.penalty) || 0,
          team: pRecord.team || undefined,
        };
      } else {
        initial[p.id] = {
          attendance: false,
          win: false,
          onTime: false,
          goals: 0,
          ownGoals: 0,
          penalty: 0,
          team: undefined,
        };
      }
    });
    return initial;
  };

  const loadMatchData = (targetMatchId: number, data: LeagueData) => {
    const foundMatch = data.matches.find(m => m.id === targetMatchId);
    setMatchDate(foundMatch?.date || '');
    
    // Load Match Sheet
    const ms = foundMatch?.matchSheet;
    setTeamAName(ms?.teamAName || DEFAULT_TEAM_A_NAME);
    setTeamBName(ms?.teamBName || DEFAULT_TEAM_B_NAME);
    setTeamAScore(ms?.teamAScore !== undefined ? String(ms.teamAScore) : '');
    setTeamBScore(ms?.teamBScore !== undefined ? String(ms.teamBScore) : '');
    setMatchWinner(ms?.winner || 'none');
    setMatchNotes(ms?.notes || '');

    const initial = getInitialRecordsForMatch(targetMatchId, data);
    setRecords(initial);
  };

  // Sync state when modal opens, selectedMatchId changes, or when leagueData is loaded
  useEffect(() => {
    if (isOpen) {
      const activeMatchId = selectedMatchId || 1;
      const isMatchSwitch = currentMatchIdRef.current !== activeMatchId;
      
      if (!wasOpenRef.current || isMatchSwitch) {
        wasOpenRef.current = true;
        currentMatchIdRef.current = activeMatchId;
        hasUserEditedRef.current = false;

        setMatchId(activeMatchId);
        setSearchQuery('');
        setSelectedPlayerIds(new Set());
        setFilterMode('all');
        setShowPasteRoster(false);
        setPasteText('');
        setPasteFeedback(null);
        setActiveTab('match_sheet');
        
        loadMatchData(activeMatchId, leagueData);
      } else if (!hasUserEditedRef.current) {
        loadMatchData(activeMatchId, leagueData);
      }
    } else {
      wasOpenRef.current = false;
      hasUserEditedRef.current = false;
      currentMatchIdRef.current = selectedMatchId || 1;
      setSearchQuery('');
      setSelectedPlayerIds(new Set());
      setFilterMode('all');
      setShowPasteRoster(false);
      setPasteText('');
      setPasteFeedback(null);
    }
  }, [isOpen, selectedMatchId, leagueData]);

  // When match selector dropdown changes explicitly by user
  const handleMatchSelectChange = (newMatchId: number) => {
    setMatchId(newMatchId);
    currentMatchIdRef.current = newMatchId;
    hasUserEditedRef.current = false;
    setSearchQuery('');
    setSelectedPlayerIds(new Set());
    setFilterMode('all');
    setShowPasteRoster(false);
    setPasteText('');
    setPasteFeedback(null);

    loadMatchData(newMatchId, leagueData);
  };

  const selectedDayName = useMemo(() => getDayOfWeekName(matchDate), [matchDate]);
  const isFriday = selectedDayName.toLowerCase() === 'friday';

  // Build current MatchSheet object
  const buildCurrentMatchSheet = (): MatchSheet => {
    return {
      teamAName: teamAName.trim() || DEFAULT_TEAM_A_NAME,
      teamBName: teamBName.trim() || DEFAULT_TEAM_B_NAME,
      teamAScore: teamAScore !== '' && !isNaN(Number(teamAScore)) ? Number(teamAScore) : undefined,
      teamBScore: teamBScore !== '' && !isNaN(Number(teamBScore)) ? Number(teamBScore) : undefined,
      winner: matchWinner,
      notes: matchNotes,
    };
  };

  const handleApplySave = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const sheet = buildCurrentMatchSheet();
    onSaveMatchResults(matchId, records, matchDate, sheet);
    hasUserEditedRef.current = false;
    setSelectedPlayerIds(new Set());
    setSearchQuery('');
    setSaveProgressToast(true);
    setTimeout(() => setSaveProgressToast(false), 3000);
  };

  // Smart multi-term search tokenizer
  const searchTerms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const rawChunks = searchQuery
      .split(/[,;\n\r\t/|]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const terms: string[] = [];
    rawChunks.forEach(chunk => {
      const cleaned = chunk.replace(/^[\d+.)\s*#\-•]+/, '').trim();
      if (!cleaned) return;

      const fullMatch = leagueData.players.some(p => p.name.toLowerCase().includes(cleaned));
      if (fullMatch) {
        terms.push(cleaned);
      } else {
        const words = cleaned.split(/\s+/).filter(w => w.length > 0);
        terms.push(...words);
      }
    });

    return Array.from(new Set(terms));
  }, [searchQuery, leagueData.players]);

  // Filtered & sorted players based on searchTerms, view filter mode, and pin option
  const filteredPlayers = useMemo(() => {
    const list = leagueData.players.filter(player => {
      const pName = player.name.toLowerCase();
      const rec = records[player.id];

      // 1. Search Query filter
      if (searchTerms.length > 0) {
        const matchesSearch = searchTerms.some(term => pName.includes(term));
        if (!matchesSearch) return false;
      }

      // 2. View Mode filter
      if (filterMode === 'present') return Boolean(rec?.attendance);
      if (filterMode === 'absent') return !rec?.attendance;
      if (filterMode === 'win') return Boolean(rec?.win);
      if (filterMode === 'ontime') return Boolean(rec?.onTime);
      if (filterMode === 'teamA') return rec?.team === 'teamA';
      if (filterMode === 'teamB') return rec?.team === 'teamB';

      return true;
    });

    // If pinSelectedToTop is active and not searching, show present players first
    if (pinSelectedToTop && searchTerms.length === 0 && filterMode === 'all') {
      return [...list].sort((a, b) => {
        const aPres = records[a.id]?.attendance ? 1 : 0;
        const bPres = records[b.id]?.attendance ? 1 : 0;
        if (aPres !== bPres) return bPres - aPres;
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [leagueData.players, searchTerms, filterMode, records, pinSelectedToTop]);

  // Active target players for category point assignment
  const activeBatchPlayers = useMemo(() => {
    if (selectedPlayerIds.size > 0) {
      return leagueData.players.filter(p => selectedPlayerIds.has(p.id));
    }
    if (searchTerms.length > 0) {
      return filteredPlayers;
    }
    return [];
  }, [selectedPlayerIds, leagueData.players, searchTerms, filteredPlayers]);

  // Team player rosters
  const teamAPlayers = useMemo(() => {
    return leagueData.players.filter(p => records[p.id]?.team === 'teamA');
  }, [leagueData.players, records]);

  const teamBPlayers = useMemo(() => {
    return leagueData.players.filter(p => records[p.id]?.team === 'teamB');
  }, [leagueData.players, records]);

  const unassignedPlayers = useMemo(() => {
    return leagueData.players.filter(p => records[p.id]?.attendance && !records[p.id]?.team);
  }, [leagueData.players, records]);

  const toggleSelectPlayerForBatch = (playerId: string) => {
    hasUserEditedRef.current = true;
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const targets = searchTerms.length > 0 ? filteredPlayers : leagueData.players;
    if (targets.length === 0) return;

    hasUserEditedRef.current = true;
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      const allSelected = targets.every(p => next.has(p.id));
      if (allSelected) {
        targets.forEach(p => next.delete(p.id));
      } else {
        targets.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleClearStagedSelection = () => {
    setSelectedPlayerIds(new Set());
    setSearchQuery('');
  };

  // Real-time calculated tallies
  const { presentCount, absentCount, winCount, onTimeCount, totalGoals, teamAGoals, teamBGoals } = useMemo(() => {
    let present = 0;
    let absent = 0;
    let win = 0;
    let ontime = 0;
    let goals = 0;
    let tAGoals = 0;
    let tBGoals = 0;

    leagueData.players.forEach(p => {
      const r = records[p.id];
      if (r?.attendance) present++;
      else absent++;

      if (r?.win) win++;
      if (r?.onTime) ontime++;
      if (r?.goals) {
        goals += r.goals;
        if (r.team === 'teamA') tAGoals += r.goals;
        if (r.team === 'teamB') tBGoals += r.goals;
      }
    });

    return {
      presentCount: present,
      absentCount: absent,
      winCount: win,
      onTimeCount: ontime,
      totalGoals: goals,
      teamAGoals: tAGoals,
      teamBGoals: tBGoals,
    };
  }, [leagueData.players, records]);

  if (!isOpen) return null;

  const handleFieldChange = <K extends keyof PlayerMatchRecord>(
    playerId: string,
    field: K,
    value: PlayerMatchRecord[K]
  ) => {
    hasUserEditedRef.current = true;
    setRecords(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {
          attendance: false,
          win: false,
          onTime: false,
          goals: 0,
          ownGoals: 0,
          penalty: 0,
        }),
        [field]: value,
      },
    }));
  };

  // Assign player to a team
  const handleAssignPlayerTeam = (playerId: string, team: 'teamA' | 'teamB' | undefined) => {
    hasUserEditedRef.current = true;
    setRecords(prev => {
      const existing = prev[playerId] || {
        attendance: false,
        win: false,
        onTime: false,
        goals: 0,
        ownGoals: 0,
        penalty: 0,
      };

      // If assigning to a team, ensure player is marked as attended
      const shouldAttend = team ? true : existing.attendance;
      
      // If winner is already selected, sync win bonus automatically
      let shouldWin = existing.win;
      if (matchWinner === 'teamA') {
        shouldWin = team === 'teamA';
      } else if (matchWinner === 'teamB') {
        shouldWin = team === 'teamB';
      } else if (matchWinner === 'draw') {
        shouldWin = false;
      }

      return {
        ...prev,
        [playerId]: {
          ...existing,
          attendance: shouldAttend,
          team: team,
          win: shouldWin,
        },
      };
    });
  };

  // Winner selection with automatic points synchronization
  const handleSelectWinner = (winner: MatchWinner) => {
    hasUserEditedRef.current = true;
    setMatchWinner(winner);

    // Synchronize individual player win bonuses based on winning team
    setRecords(prev => {
      const updated = { ...prev };
      leagueData.players.forEach(p => {
        const r = updated[p.id];
        if (!r) return;

        if (winner === 'teamA') {
          if (r.team === 'teamA' && r.attendance) {
            updated[p.id] = { ...r, win: true };
          } else if (r.team === 'teamB') {
            updated[p.id] = { ...r, win: false };
          }
        } else if (winner === 'teamB') {
          if (r.team === 'teamB' && r.attendance) {
            updated[p.id] = { ...r, win: true };
          } else if (r.team === 'teamA') {
            updated[p.id] = { ...r, win: false };
          }
        } else if (winner === 'draw' || winner === 'none') {
          // In a draw or unconfirmed, players keep or clear win status
          if (r.team === 'teamA' || r.team === 'teamB') {
            updated[p.id] = { ...r, win: false };
          }
        }
      });
      return updated;
    });

    const targetMatch = leagueData.matches.find(m => m.id === matchId);
    const mTitle = targetMatch ? targetMatch.title : `Match ${matchId}`;
    const wName = winner === 'teamA' ? teamAName : winner === 'teamB' ? teamBName : 'Draw';
    
    setLastAppliedFeedback({
      message: winner === 'none' 
        ? 'Winner reset' 
        : winner === 'draw' 
        ? `Match marked as Draw. Win bonuses cleared.` 
        : `🏆 ${wName} marked as Winner of ${mTitle}! Attending ${wName} players received +1.0 Win bonus automatically.`,
      playerNames: [],
      timestamp: Date.now(),
    });
  };

  // Assign all currently selected/searched players to Team A or Team B
  const handleAssignSelectedToTeam = (team: 'teamA' | 'teamB' | undefined) => {
    const targets = activeBatchPlayers.length > 0 ? activeBatchPlayers : (searchTerms.length > 0 ? filteredPlayers : []);
    if (targets.length === 0) return;

    hasUserEditedRef.current = true;
    targets.forEach(p => {
      handleAssignPlayerTeam(p.id, team);
    });

    const tName = team === 'teamA' ? teamAName : team === 'teamB' ? teamBName : 'Unassigned';
    setLastAppliedFeedback({
      message: `Assigned ${targets.length} player(s) to ${tName}! Selection cleared.`,
      playerNames: targets.map(p => formatPlayerName(p.name)),
      timestamp: Date.now(),
    });

    setSelectedPlayerIds(new Set());
    setSearchQuery('');
  };

  // Toggle individual win on a player
  const handleTogglePlayerWin = (playerId: string) => {
    hasUserEditedRef.current = true;
    setRecords(prev => {
      const existing = prev[playerId] || {
        attendance: false,
        win: false,
        onTime: false,
        goals: 0,
        ownGoals: 0,
        penalty: 0,
      };
      const nextWin = !existing.win;
      return {
        ...prev,
        [playerId]: {
          ...existing,
          attendance: nextWin ? true : existing.attendance,
          win: nextWin,
        },
      };
    });
  };

  // Toggle individual on-time on a player
  const handleTogglePlayerOnTime = (playerId: string) => {
    hasUserEditedRef.current = true;
    setRecords(prev => {
      const existing = prev[playerId] || {
        attendance: false,
        win: false,
        onTime: false,
        goals: 0,
        ownGoals: 0,
        penalty: 0,
      };
      const nextOnTime = !existing.onTime;
      return {
        ...prev,
        [playerId]: {
          ...existing,
          attendance: nextOnTime ? true : existing.attendance,
          onTime: nextOnTime,
        },
      };
    });
  };

  // BATCH ACTIONS: Direct 1-click actions on active staged / searched / selected players
  const handleBatchSelectedAction = (action: 'all_bonus' | 'win_all' | 'win_none' | 'ontime_all' | 'ontime_none' | 'win_and_ontime' | 'present_only' | 'clear_all') => {
    const targets = activeBatchPlayers.length > 0 ? activeBatchPlayers : (searchTerms.length > 0 ? filteredPlayers : []);
    if (targets.length === 0) return;

    hasUserEditedRef.current = true;
    setRecords(prev => {
      const updated = { ...prev };
      targets.forEach(p => {
        const existing = updated[p.id] || {
          attendance: true,
          win: false,
          onTime: false,
          goals: 0,
          ownGoals: 0,
          penalty: 0,
        };

        if (action === 'all_bonus') {
          updated[p.id] = { ...existing, attendance: true, win: true, onTime: true };
        } else if (action === 'present_only') {
          updated[p.id] = { ...existing, attendance: true, win: false, onTime: false };
        } else if (action === 'win_all') {
          updated[p.id] = { ...existing, attendance: true, win: true };
        } else if (action === 'win_none') {
          updated[p.id] = { ...existing, win: false };
        } else if (action === 'ontime_all') {
          updated[p.id] = { ...existing, attendance: true, onTime: true };
        } else if (action === 'ontime_none') {
          updated[p.id] = { ...existing, onTime: false };
        } else if (action === 'win_and_ontime') {
          updated[p.id] = { ...existing, attendance: true, win: true, onTime: true };
        } else if (action === 'clear_all') {
          updated[p.id] = { ...existing, attendance: false, win: false, onTime: false, team: undefined };
        }
      });
      return updated;
    });

    const targetNames = targets.map(p => formatPlayerName(p.name));
    const actionLabel = action === 'all_bonus' 
      ? 'ALL 3 (+2.5)' 
      : action === 'present_only' 
      ? 'Only Att (+0.5)' 
      : action === 'win_all' 
      ? 'Win (+1.0)' 
      : action === 'ontime_all' 
      ? 'On-Time (+1.0)' 
      : action === 'win_and_ontime' 
      ? 'Win & Time (+2.0)' 
      : 'Cleared';

    setLastAppliedFeedback({
      message: `Applied [${actionLabel}] to ${targets.length} player(s): ${targetNames.slice(0, 5).join(', ')}${targetNames.length > 5 ? ` +${targetNames.length - 5} more` : ''}. Selection cleared!`,
      playerNames: targetNames,
      timestamp: Date.now(),
    });

    setSelectedPlayerIds(new Set());
    setSearchQuery('');
  };

  const handleMarkAll = (status: boolean) => {
    hasUserEditedRef.current = true;
    setRecords(prev => {
      const updated: Record<string, PlayerMatchRecord> = { ...prev };
      leagueData.players.forEach(p => {
        updated[p.id] = {
          ...(updated[p.id] || {
            attendance: false,
            win: false,
            onTime: false,
            goals: 0,
            ownGoals: 0,
            penalty: 0,
          }),
          attendance: status,
          win: status ? Boolean(updated[p.id]?.win) : false,
          onTime: status ? Boolean(updated[p.id]?.onTime) : false,
        };
      });
      return updated;
    });
  };

  // Smart Two-Team / Roster Paste Parser
  const handleProcessPasteRoster = (mode: 'match_sheet' | 'present_only' | 'all_bonus' | 'win' | 'ontime') => {
    if (!pasteText.trim()) return;

    hasUserEditedRef.current = true;

    // Check if text has two-team structure (e.g., "Team Gaza ... Team Rashu ...")
    const lines = pasteText.split(/[\n\r]+/);
    let currentTeamContext: 'teamA' | 'teamB' | null = null;
    let detectedTeamAName = teamAName;
    let detectedTeamBName = teamBName;

    const matchedA: string[] = [];
    const matchedB: string[] = [];
    const matchedGeneral: string[] = [];
    const notFound: string[] = [];

    const updatedRecords = { ...records };

    lines.forEach(rawLine => {
      const line = rawLine.replace(/^[\d+.)\s*#\-•]+/, '').trim();
      if (!line) return;

      const lineLower = line.toLowerCase();

      // Check for Team A header (Red Team, Bibs, Gaza, Team 1, Team A)
      if (
        lineLower.includes('red') ||
        lineLower.includes('team red') ||
        lineLower.includes('reds') ||
        lineLower.includes('team gaza') || 
        lineLower.includes('team 1') || 
        lineLower.includes('team a') ||
        lineLower.includes('gaza') ||
        (lineLower.startsWith('team ') && !currentTeamContext)
      ) {
        if (!currentTeamContext) {
          currentTeamContext = 'teamA';
          detectedTeamAName = line;
          return;
        }
      }

      // Check for Team B header (Blue Team, Non-Bibs, Rashu, Team 2, Team B)
      if (
        lineLower.includes('blue') ||
        lineLower.includes('team blue') ||
        lineLower.includes('blues') ||
        lineLower.includes('team rashu') || 
        lineLower.includes('team 2') || 
        lineLower.includes('team b') ||
        lineLower.includes('rashu') ||
        (lineLower.startsWith('team ') && currentTeamContext === 'teamA')
      ) {
        currentTeamContext = 'teamB';
        detectedTeamBName = line;
        return;
      }

      // Split line by commas/spaces if multiple names on one line
      const tokens = line.split(/[,;\t/|]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

      tokens.forEach(token => {
        let matchedPlayer: Player | null = null;
        for (const player of leagueData.players) {
          const pLower = player.name.toLowerCase();
          if (pLower === token || pLower.includes(token) || token.includes(pLower)) {
            matchedPlayer = player;
            break;
          }
        }

        if (matchedPlayer) {
          const pId = matchedPlayer.id;
          const pName = formatPlayerName(matchedPlayer.name);
          const existing = updatedRecords[pId] || {
            attendance: false,
            win: false,
            onTime: false,
            goals: 0,
            ownGoals: 0,
            penalty: 0,
          };

          if (currentTeamContext === 'teamA') {
            updatedRecords[pId] = {
              ...existing,
              attendance: true,
              team: 'teamA',
              win: matchWinner === 'teamA',
            };
            matchedA.push(pName);
          } else if (currentTeamContext === 'teamB') {
            updatedRecords[pId] = {
              ...existing,
              attendance: true,
              team: 'teamB',
              win: matchWinner === 'teamB',
            };
            matchedB.push(pName);
          } else {
            // General match mode
            if (mode === 'all_bonus') {
              updatedRecords[pId] = { ...existing, attendance: true, win: true, onTime: true };
            } else if (mode === 'win') {
              updatedRecords[pId] = { ...existing, attendance: true, win: true };
            } else if (mode === 'ontime') {
              updatedRecords[pId] = { ...existing, attendance: true, onTime: true };
            } else {
              updatedRecords[pId] = { ...existing, attendance: true };
            }
            matchedGeneral.push(pName);
          }
        } else if (token.length > 2) {
          notFound.push(token);
        }
      });
    });

    if (matchedA.length > 0 || matchedB.length > 0) {
      setTeamAName(detectedTeamAName);
      setTeamBName(detectedTeamBName);
    }

    setRecords(updatedRecords);

    const totalMatched = [...matchedA, ...matchedB, ...matchedGeneral];
    setPasteFeedback({
      matched: totalMatched,
      notFound: notFound,
      mode: matchedA.length > 0 || matchedB.length > 0 
        ? `Match Sheet (${detectedTeamAName}: ${matchedA.length} players, ${detectedTeamBName}: ${matchedB.length} players)`
        : mode === 'all_bonus' ? 'All 3 (+2.5)' : mode === 'win' ? 'Win (+1.0)' : 'Attendance (+0.5)',
    });
  };

  const handleCloseModal = () => {
    setSearchQuery('');
    setSelectedPlayerIds(new Set());
    setFilterMode('all');
    setShowPasteRoster(false);
    setPasteText('');
    setPasteFeedback(null);
    wasOpenRef.current = false;
    hasUserEditedRef.current = false;
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sheet = buildCurrentMatchSheet();
    onSaveMatchResults(matchId, records, matchDate, sheet);
    setSearchQuery('');
    setSelectedPlayerIds(new Set());
    setFilterMode('all');
    setShowPasteRoster(false);
    setPasteText('');
    setPasteFeedback(null);
    wasOpenRef.current = false;
    hasUserEditedRef.current = false;
    onClose();
  };

  const activeMatchObj = leagueData.matches.find(m => m.id === matchId);
  const activeMatchTitle = activeMatchObj ? activeMatchObj.title : `Match ${matchId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-6xl rounded-2xl p-4 sm:p-7 shadow-2xl border border-slate-700 space-y-5 my-4 max-h-[94vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-900/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Record Match Sheet & Results ({activeMatchTitle})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track Team Gaza vs Team Rashu lineups, match winner outcome, and individual points.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Match Week & Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Match Week
              </label>
              <select
                value={matchId}
                onChange={(e) => handleMatchSelectChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none cursor-pointer"
              >
                {leagueData.matches.map((m) => {
                  const day = getDayOfWeekName(m.date);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.title} ({day ? `${day}, ` : ''}{m.date}) {m.completed ? '• Completed' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Match Date (Playing on Friday)
                </label>
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    isFriday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isFriday ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{selectedDayName || 'Select Date'}</span>
                </div>
              </div>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: MATCH SHEET & TEAM ROSTERS (TEAM GAZA vs TEAM RASHU)           */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 p-4 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-4">
            
            {/* Header & Winner Outcome Declaration */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Match Sheet & Team Lineups</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Official Scoresheet
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Assign players to teams, record final score, and select match winner.
                  </p>
                </div>
              </div>

              {/* Paste Roster Button */}
              <button
                type="button"
                onClick={() => setShowPasteRoster(!showPasteRoster)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow ${
                  showPasteRoster
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showPasteRoster ? 'Hide Paste Box' : '📋 Paste Team Sheet'}</span>
              </button>
            </div>

            {/* Paste Two-Team Roster Drawer */}
            {showPasteRoster && (
              <div className="bg-slate-950/95 p-4 rounded-xl border border-amber-500/50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    Paste WhatsApp / Viber team sheet with team titles:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    e.g. Team Gaza (hasan, ablo, shimad) Team Rashu (adhu, atta, muru)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Team Gaza&#10;hasan&#10;ablo&#10;shimad&#10;&#10;Team Rashu&#10;adhu&#10;atta&#10;muru`}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs text-white font-mono focus:outline-none placeholder-slate-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleProcessPasteRoster('match_sheet')}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Parse Both Teams</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessPasteRoster('all_bonus')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <span>Tick ALL 3 (+2.5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessPasteRoster('present_only')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <span>Attendance Only (+0.5)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPasteText('');
                      setPasteFeedback(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>

                {pasteFeedback && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <p className="text-emerald-400 font-bold">
                      ✓ Successfully imported {pasteFeedback.matched.length} player(s) as [{pasteFeedback.mode}]: {pasteFeedback.matched.join(', ')}
                    </p>
                    {pasteFeedback.notFound.length > 0 && (
                      <p className="text-amber-400/90 text-[11px]">
                        ⚠️ Could not match {pasteFeedback.notFound.length} item(s): {pasteFeedback.notFound.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Teams & Score Input Bar */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              {/* Presets Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Presets:</span>
                  {TEAM_NAME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setTeamAName(preset.a);
                        setTeamBName(preset.b);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        teamAName === preset.a && teamBName === preset.b
                          ? 'bg-amber-500 text-slate-950 font-black ring-1 ring-amber-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 italic">Editable per match day</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                {/* Team A Info (Red Team) */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-sm">🔴</span>
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>Team 1 (Red Jersey)</span>
                    </label>
                    <span className="text-[11px] text-rose-300 font-bold">
                      {teamAPlayers.length} Players Assigned
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={teamAName}
                      onChange={(e) => {
                        hasUserEditedRef.current = true;
                        setTeamAName(e.target.value);
                      }}
                      placeholder="e.g. Red Team"
                      className="w-full bg-slate-900 border border-rose-500/50 focus:border-rose-400 rounded-xl px-3 py-2 text-sm text-white font-black focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={teamAScore}
                      onChange={(e) => {
                        hasUserEditedRef.current = true;
                        setTeamAScore(e.target.value);
                      }}
                      placeholder="Goals"
                      className="w-16 bg-slate-900 border border-rose-500/50 focus:border-rose-400 rounded-xl px-2 py-2 text-sm text-rose-400 font-black text-center focus:outline-none"
                      title={`${teamAName} Score / Goals`}
                    />
                  </div>
                </div>

                {/* VS Divider */}
                <div className="md:col-span-3 flex flex-col items-center justify-center py-2 text-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {activeMatchTitle}
                  </span>
                  <span className="text-base font-black text-amber-400">
                    {teamAScore !== '' ? teamAScore : '—'} : {teamBScore !== '' ? teamBScore : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {matchDate ? `${selectedDayName ? `${selectedDayName}, ` : ''}${matchDate}` : 'Friday Fixture'}
                  </span>
                </div>

                {/* Team B Info (Blue Team) */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-sky-300 font-bold">
                      {teamBPlayers.length} Players Assigned
                    </span>
                    <label className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-sm">🔵</span>
                      <span>Team 2 (Blue Jersey)</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={teamBScore}
                      onChange={(e) => {
                        hasUserEditedRef.current = true;
                        setTeamBScore(e.target.value);
                      }}
                      placeholder="Goals"
                      className="w-16 bg-slate-900 border border-sky-500/50 focus:border-sky-400 rounded-xl px-2 py-2 text-sm text-sky-400 font-black text-center focus:outline-none"
                      title={`${teamBName} Score / Goals`}
                    />
                    <input
                      type="text"
                      value={teamBName}
                      onChange={(e) => {
                        hasUserEditedRef.current = true;
                        setTeamBName(e.target.value);
                      }}
                      placeholder="e.g. Blue Team"
                      className="w-full bg-slate-900 border border-sky-500/50 focus:border-sky-400 rounded-xl px-3 py-2 text-sm text-white font-black text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Official Winning Outcome Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Match Winner (Auto-Ticks +1.0 Win Bonus for all Attending Team Players):</span>
                </span>
                <span className="text-[11px] text-amber-400 font-bold">
                  {matchWinner === 'teamA' 
                    ? `🏆 ${teamAName} Won` 
                    : matchWinner === 'teamB' 
                    ? `🏆 ${teamBName} Won` 
                    : matchWinner === 'draw' 
                    ? '🤝 Draw' 
                    : 'Outcome Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Team A Win Button */}
                <button
                  type="button"
                  onClick={() => handleSelectWinner('teamA')}
                  className={`px-3 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow ${
                    matchWinner === 'teamA'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-300 shadow-rose-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>🔴 {teamAName} Won</span>
                </button>

                {/* Draw Button */}
                <button
                  type="button"
                  onClick={() => handleSelectWinner('draw')}
                  className={`px-3 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow ${
                    matchWinner === 'draw'
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>🤝 Draw (Level)</span>
                </button>

                {/* Team B Win Button */}
                <button
                  type="button"
                  onClick={() => handleSelectWinner('teamB')}
                  className={`px-3 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow ${
                    matchWinner === 'teamB'
                      ? 'bg-sky-600 text-white ring-2 ring-sky-300 shadow-sky-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>🔵 {teamBName} Won</span>
                </button>

                {/* Reset / None Button */}
                <button
                  type="button"
                  onClick={() => handleSelectWinner('none')}
                  className={`px-3 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                    matchWinner === 'none'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-500 border border-slate-800'
                  }`}
                >
                  <span>None / Unset</span>
                </button>
              </div>

              {/* Official Result Banner */}
              {matchWinner !== 'none' && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in duration-150 ${
                  matchWinner === 'teamA' 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200' 
                    : matchWinner === 'teamB' 
                    ? 'bg-sky-950/80 border-sky-500 text-sky-200' 
                    : 'bg-slate-900/90 border-amber-500/50 text-amber-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {matchWinner === 'teamA' 
                        ? `🔴 ${teamAName} (Red) won ${activeMatchTitle} on Friday ${matchDate}`
                        : matchWinner === 'teamB'
                        ? `🔵 ${teamBName} (Blue) won ${activeMatchTitle} on Friday ${matchDate}`
                        : `Draw match between 🔴 ${teamAName} & 🔵 ${teamBName} on Friday ${matchDate}`}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80">
                    {matchWinner === 'draw' ? 'No win bonuses awarded' : '+1.0 pts applied to winning players'}
                  </span>
                </div>
              )}
            </div>

            {/* Side-by-Side Team Rosters Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* TEAM A ROSTER CARD (Red Team) */}
              <div className="bg-slate-950/90 rounded-xl border border-rose-500/50 p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <h5 className="font-black text-rose-300 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <span>🔴 {teamAName}</span>
                      <span className="text-[11px] font-normal text-rose-400/80">({teamAPlayers.length} Players)</span>
                    </h5>
                  </div>
                  <span className="text-[11px] text-rose-400 font-black">
                    ⚽ {teamAGoals} Goals
                  </span>
                </div>

                {/* Team A Lineup Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[60px] max-h-40 overflow-y-auto p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  {teamAPlayers.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic p-2 w-full text-center">
                      No players assigned to {teamAName} yet. Select players below or paste roster.
                    </div>
                  ) : (
                    teamAPlayers.map(player => {
                      const r = records[player.id];
                      const fName = formatPlayerName(player.name);
                      return (
                        <div
                          key={player.id}
                          className="inline-flex items-center space-x-1.5 px-2 py-1 bg-rose-950/80 border border-rose-500/60 rounded-lg text-rose-200 text-xs font-bold"
                        >
                          <span>🔴 {fName}</span>
                          {r?.win && <span title="Win (+1.0)">🏆</span>}
                          {r?.onTime && <span title="On-time (+1.0)">⏰</span>}
                          {r?.goals ? <span className="text-emerald-400 font-black">⚽{r.goals}</span> : null}
                          <button
                            type="button"
                            onClick={() => handleAssignPlayerTeam(player.id, undefined)}
                            className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 rounded cursor-pointer"
                            title={`Remove ${fName} from ${teamAName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Add Player to Team A */}
                <div className="flex items-center space-x-2 pt-1">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignPlayerTeam(e.target.value, 'teamA');
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-900 border border-rose-700/60 text-xs text-rose-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>+ Add Player to 🔴 {teamAName} (Red)...</option>
                    {leagueData.players
                      .filter(p => records[p.id]?.team !== 'teamA')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {formatPlayerName(p.name)} {records[p.id]?.team === 'teamB' ? `(In ${teamBName})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* TEAM B ROSTER CARD (Blue Team) */}
              <div className="bg-slate-950/90 rounded-xl border border-sky-500/50 p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                    <h5 className="font-black text-sky-300 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <span>🔵 {teamBName}</span>
                      <span className="text-[11px] font-normal text-sky-400/80">({teamBPlayers.length} Players)</span>
                    </h5>
                  </div>
                  <span className="text-[11px] text-sky-400 font-black">
                    ⚽ {teamBGoals} Goals
                  </span>
                </div>

                {/* Team B Lineup Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[60px] max-h-40 overflow-y-auto p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  {teamBPlayers.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic p-2 w-full text-center">
                      No players assigned to {teamBName} yet. Select players below or paste roster.
                    </div>
                  ) : (
                    teamBPlayers.map(player => {
                      const r = records[player.id];
                      const fName = formatPlayerName(player.name);
                      return (
                        <div
                          key={player.id}
                          className="inline-flex items-center space-x-1.5 px-2 py-1 bg-sky-950/80 border border-sky-500/60 rounded-lg text-sky-200 text-xs font-bold"
                        >
                          <span>🔵 {fName}</span>
                          {r?.win && <span title="Win (+1.0)">🏆</span>}
                          {r?.onTime && <span title="On-time (+1.0)">⏰</span>}
                          {r?.goals ? <span className="text-emerald-400 font-black">⚽{r.goals}</span> : null}
                          <button
                            type="button"
                            onClick={() => handleAssignPlayerTeam(player.id, undefined)}
                            className="text-slate-400 hover:text-sky-400 ml-1 p-0.5 rounded cursor-pointer"
                            title={`Remove ${fName} from ${teamBName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Add Player to Team B */}
                <div className="flex items-center space-x-2 pt-1">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignPlayerTeam(e.target.value, 'teamB');
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-900 border border-sky-700/60 text-xs text-sky-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>+ Add Player to 🔵 {teamBName} (Blue)...</option>
                    {leagueData.players
                      .filter(p => records[p.id]?.team !== 'teamB')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {formatPlayerName(p.name)} {records[p.id]?.team === 'teamA' ? `(In ${teamAName})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: SEARCH & 1-CLICK BATCH TAGGING FOR TEAMS & POINTS               */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-xl">
            
            {/* Search Input & Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredPlayers.length > 0) {
                      e.preventDefault();
                      handleSelectAllFiltered();
                    }
                  }}
                  placeholder="Search name(s)... e.g. Hasan, Ablo, Shimad, Adhu (comma separated • Press Enter to select)"
                  className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none placeholder-slate-500 shadow-inner"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    title="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Select All Search Matches */}
              {searchTerms.length > 0 && (() => {
                const allSelectedInBatch = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedPlayerIds.has(p.id));
                return (
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered()}
                    disabled={filteredPlayers.length === 0}
                    className={`px-3.5 py-2.5 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer active:scale-95 ${
                      filteredPlayers.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : allSelectedInBatch
                        ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/60'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                    }`}
                  >
                    {allSelectedInBatch ? <X className="w-4 h-4 text-rose-300" /> : <CheckCheck className="w-4 h-4" />}
                    <span>{allSelectedInBatch ? '✕ Deselect' : '✓ Select'} {filteredPlayers.length} Match{filteredPlayers.length === 1 ? '' : 'es'}</span>
                  </button>
                );
              })()}

              {/* Apply / Save Progress Button */}
              <button
                type="button"
                onClick={handleApplySave}
                className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-md transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer active:scale-95 ring-1 ring-amber-300"
                title="Save current changes to the database without closing this modal"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                <span>💾 Save Progress</span>
              </button>
            </div>

            {/* Feedback Alerts */}
            {saveProgressToast && (
              <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-xs text-emerald-300 font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✓ Match Sheet & scores saved! Continue editing.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveProgressToast(false)}
                  className="text-emerald-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {lastAppliedFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{lastAppliedFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLastAppliedFeedback(null)}
                  className="text-emerald-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Batch Action Tray for Selected Players */}
            {activeBatchPlayers.length > 0 && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/60 space-y-2.5 shadow-lg animate-in fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                      Selected Players ({activeBatchPlayers.length}) — 1-Click Assign:
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    {/* Team Assign Buttons */}
                    <button
                      type="button"
                      onClick={() => handleAssignSelectedToTeam('teamA')}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>🔴 Assign to {teamAName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignSelectedToTeam('teamB')}
                      className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>🔵 Assign to {teamBName}</span>
                    </button>
                    
                    {/* Point Assign Buttons */}
                    <button
                      type="button"
                      onClick={() => handleBatchSelectedAction('all_bonus')}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-emerald-500 hover:from-amber-300 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow transition flex items-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>ALL 3 (+2.5)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBatchSelectedAction('present_only')}
                      className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      <span>Att (+0.5)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearStagedSelection}
                      className="px-2 py-1 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 font-bold text-[11px] rounded-lg border border-slate-800 transition cursor-pointer"
                    >
                      <span>Clear Selection</span>
                    </button>
                  </div>
                </div>

                {/* Staged Chips */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/80 rounded-lg">
                  {activeBatchPlayers.map(player => {
                    const r = records[player.id];
                    const fName = formatPlayerName(player.name);
                    return (
                      <div
                        key={player.id}
                        className="inline-flex items-center space-x-1.5 px-2 py-1 bg-slate-950 border border-amber-500/40 rounded-lg text-white text-xs font-bold"
                      >
                        <span className="text-emerald-300">{fName}</span>
                        {r?.team === 'teamA' && <span className="text-[10px] text-rose-400 font-bold">(🔴 {teamAName})</span>}
                        {r?.team === 'teamB' && <span className="text-[10px] text-sky-400 font-bold">(🔵 {teamBName})</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlayerIds(prev => {
                              const next = new Set(prev);
                              next.delete(player.id);
                              return next;
                            });
                          }}
                          className="text-slate-500 hover:text-red-400 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Interactive Chips Cloud */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">
                  Quick Name Selection (Click name to select):
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  <span className="text-rose-400 font-black">🔴 Red = {teamAName}</span> • <span className="text-sky-400 font-black">🔵 Blue = {teamBName}</span> • <span>⚪ Gray = Unassigned</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedPlayerIds.has(player.id);
                  const isPresent = Boolean(records[player.id]?.attendance);
                  const isTeamA = records[player.id]?.team === 'teamA';
                  const isTeamB = records[player.id]?.team === 'teamB';
                  const isWin = Boolean(records[player.id]?.win);
                  const fName = formatPlayerName(player.name);

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggleSelectPlayerForBatch(player.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border border-amber-300 font-black shadow-md ring-2 ring-amber-500/40'
                          : isTeamA
                          ? 'bg-rose-950/90 border border-rose-500/70 text-rose-200'
                          : isTeamB
                          ? 'bg-sky-950/90 border border-sky-500/70 text-sky-200'
                          : isPresent
                          ? 'bg-slate-900 border border-slate-700 text-emerald-300'
                          : 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isTeamA ? 'bg-rose-400' : isTeamB ? 'bg-sky-400' : isPresent ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      <span>{fName}</span>
                      {isWin && <span className="text-[10px]">🏆</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Mode Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center flex-wrap gap-1">
                {(['all', 'present', 'teamA', 'teamB', 'absent', 'win', 'ontime'] as FilterViewMode[]).map((mode) => {
                  const labels = {
                    all: `All (${leagueData.players.length})`,
                    present: `Present (${presentCount})`,
                    teamA: `🔴 ${teamAName} (${teamAPlayers.length})`,
                    teamB: `🔵 ${teamBName} (${teamBPlayers.length})`,
                    absent: `Absent (${absentCount})`,
                    win: `Wins (${winCount})`,
                    ontime: `On-Time (${onTimeCount})`,
                  };
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFilterMode(mode)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterMode === mode
                          ? mode === 'teamA'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : mode === 'teamB'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <label className="flex items-center space-x-1.5 text-slate-300 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinSelectedToTop}
                    onChange={(e) => setPinSelectedToTop(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Pin Present on Top</span>
                </label>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: DETAILED PLAYER ROWS & SCORESHEET TABLE                         */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Detailed Stats & Scoresheet ({filteredPlayers.length} Players Listed)
              </label>
              <span className="text-[11px] text-slate-400">
                Att (+0.5) • Win (+1.0) • On-Time (+1.0)
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  No players match the current search term or filter.
                </div>
              ) : (
                filteredPlayers.map((player: Player) => {
                  const r = records[player.id] || {
                    attendance: false,
                    win: false,
                    onTime: false,
                    goals: 0,
                    ownGoals: 0,
                    penalty: 0,
                  };
                  const formattedName = formatPlayerName(player.name);

                  let matchPts = 0;
                  if (r.attendance) matchPts += 0.5;
                  if (r.win) matchPts += 1.0;
                  if (r.onTime) matchPts += 1.0;
                  matchPts -= (r.penalty || 0);

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-xl border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 transition shadow-sm ${
                        r.attendance
                          ? r.team === 'teamA'
                            ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/20'
                            : r.team === 'teamB'
                            ? 'bg-sky-950/30 border-sky-500/50 ring-1 ring-sky-500/20'
                            : 'bg-slate-900/95 border-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800/80 opacity-80'
                      }`}
                    >
                      {/* Player info, Team Badge, & Points */}
                      <div className="flex items-center justify-between w-full xl:w-72 shrink-0">
                        <div className="flex items-center space-x-2.5 truncate">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="w-8 h-8 rounded-lg object-cover border border-amber-500/40 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                              {formattedName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="text-xs sm:text-sm font-bold text-white block truncate" title={player.name}>
                              {formattedName}
                            </span>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                              <span>{r.attendance ? 'Present' : 'Absent'}</span>
                              {r.team === 'teamA' && <span className="text-rose-400 font-bold">• 🔴 {teamAName}</span>}
                              {r.team === 'teamB' && <span className="text-sky-400 font-bold">• 🔵 {teamBName}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Calculated match points tag */}
                        <div className="shrink-0 ml-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black ${
                              matchPts > 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {matchPts > 0 ? `+${matchPts.toFixed(1)} pts` : `${matchPts.toFixed(1)} pts`}
                          </span>
                        </div>
                      </div>

                      {/* Team Assignment Toggle */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAssignPlayerTeam(player.id, r.team === 'teamA' ? undefined : 'teamA')}
                          className={`px-2 py-1 rounded text-[11px] font-black transition cursor-pointer ${
                            r.team === 'teamA'
                              ? 'bg-rose-600 text-white font-black shadow-sm ring-1 ring-rose-300'
                              : 'bg-slate-950 text-slate-400 hover:text-rose-300 border border-slate-800'
                          }`}
                          title={`Assign to 🔴 ${teamAName} (Red)`}
                        >
                          <span>{r.team === 'teamA' ? `✓ 🔴 ${teamAName}` : `+ 🔴 ${teamAName}`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAssignPlayerTeam(player.id, r.team === 'teamB' ? undefined : 'teamB')}
                          className={`px-2 py-1 rounded text-[11px] font-black transition cursor-pointer ${
                            r.team === 'teamB'
                              ? 'bg-sky-600 text-white font-black shadow-sm ring-1 ring-sky-300'
                              : 'bg-slate-950 text-slate-400 hover:text-sky-300 border border-slate-800'
                          }`}
                          title={`Assign to 🔵 ${teamBName} (Blue)`}
                        >
                          <span>{r.team === 'teamB' ? `✓ 🔵 ${teamBName}` : `+ 🔵 ${teamBName}`}</span>
                        </button>
                      </div>

                      {/* Checkboxes & Numerical Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 w-full xl:w-auto items-center">
                        {/* Attendance */}
                        <label
                          className={`flex items-center space-x-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg border transition ${
                            r.attendance
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-slate-800/90 border-slate-700 text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={r.attendance}
                            onChange={(e) => handleFieldChange(player.id, 'attendance', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Att (+0.5)</span>
                        </label>

                        {/* Win */}
                        <label
                          className={`flex items-center space-x-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg border transition ${
                            r.win
                              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold'
                              : 'bg-slate-800/90 border-slate-700 text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={r.win}
                            onChange={(e) => handleFieldChange(player.id, 'win', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Win (+1.0)</span>
                        </label>

                        {/* On-Time */}
                        <label
                          className={`flex items-center space-x-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg border transition ${
                            r.onTime
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-slate-800/90 border-slate-700 text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={r.onTime}
                            onChange={(e) => handleFieldChange(player.id, 'onTime', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Time (+1.0)</span>
                        </label>

                        {/* Goals */}
                        <div className="flex items-center justify-between space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-emerald-500/50 shadow-inner">
                          <span className="text-[11px] text-emerald-400 font-black" title="Goals Scored">
                            ⚽ G:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="1"
                            value={r.goals}
                            onChange={(e) => handleFieldChange(player.id, 'goals', Number(e.target.value) || 0)}
                            className="w-9 bg-slate-900 border border-emerald-500/50 rounded px-1 py-0.5 text-xs text-white text-center font-black focus:outline-none"
                          />
                        </div>

                        {/* Own Goals */}
                        <div className="flex items-center justify-between space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-red-500/50 shadow-inner">
                          <span className="text-[11px] text-red-400 font-black" title="Own Goals">
                            🥅 OG:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="1"
                            value={r.ownGoals}
                            onChange={(e) => handleFieldChange(player.id, 'ownGoals', Number(e.target.value) || 0)}
                            className="w-9 bg-slate-900 border border-red-500/50 rounded px-1 py-0.5 text-xs text-red-300 text-center font-black focus:outline-none"
                          />
                        </div>

                        {/* Penalties */}
                        <div className={`flex items-center justify-between space-x-1 px-2 py-1 rounded-lg border shadow-inner transition ${
                          r.penalty > 0
                            ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500/30'
                            : 'bg-slate-950 border-slate-700'
                        }`}>
                          <span className={`text-[11px] font-black ${r.penalty > 0 ? 'text-red-400' : 'text-slate-300'}`} title="Penalty Deductions">
                            ⚠️ Pen:
                          </span>
                          <div className="flex items-center space-x-0.5">
                            {r.penalty > 0 && <span className="text-xs font-black text-red-500">-</span>}
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={r.penalty}
                              onChange={(e) => handleFieldChange(player.id, 'penalty', Number(e.target.value) || 0)}
                              className={`w-9 bg-slate-900 border rounded px-1 py-0.5 text-xs text-center font-black focus:outline-none ${
                                r.penalty > 0 ? 'border-red-500 text-red-400' : 'border-slate-700 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer with Active Summary and Save Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3.5 border-t border-slate-800">
            <div>
              {leagueData.matchResults[matchId] && onResetMatchResults && (
                <button
                  type="button"
                  onClick={() => {
                    onResetMatchResults(matchId);
                    handleCloseModal();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                  title="Clear all recorded player results for this match"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Match Results</span>
                </button>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplySave}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="Save current changes to the league without closing the modal"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Progress</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 transition flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>
                  Save & Close Match Sheet ({presentCount} Present • {matchWinner === 'teamA' ? `${teamAName} Won` : matchWinner === 'teamB' ? `${teamBName} Won` : matchWinner === 'draw' ? 'Draw' : `${winCount} Wins`})
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
