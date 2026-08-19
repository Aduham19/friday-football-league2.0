import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StandingsView } from './components/StandingsView';
import { MatchesView } from './components/MatchesView';
import { PlayersView } from './components/PlayersView';
import { RulesView } from './components/RulesView';
import { AddPlayerModal } from './components/modals/AddPlayerModal';
import { EditPlayerModal } from './components/modals/EditPlayerModal';
import { PlayerDetailModal } from './components/modals/PlayerDetailModal';
import { RecordMatchModal } from './components/modals/RecordMatchModal';
import { MatchDetailModal } from './components/modals/MatchDetailModal';
import { AddMatchModal } from './components/modals/AddMatchModal';
import { EditMatchModal } from './components/modals/EditMatchModal';
import { ResetConfirmModal } from './components/modals/ResetConfirmModal';
import { DeletePlayerConfirmModal } from './components/modals/DeletePlayerConfirmModal';
import { ConfirmActionModal } from './components/modals/ConfirmActionModal';
import { AdminSecurityModal } from './components/modals/AdminSecurityModal';
import { AdminUnlockModal } from './components/modals/AdminUnlockModal';
import { DataBackupModal } from './components/modals/DataBackupModal';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { formatPlayerName } from './constants';
import { AuthConfig, AuthSession, LeagueData, Match, MatchSheet, Player, PlayerMatchRecord, TabType } from './types';
import {
  exportStandingsCSV,
  exportStandingsPDF,
  exportPlayersCSV,
  exportPlayersPDF,
  exportPlayerIndividualCSV,
  exportPlayerIndividualPDF,
  exportMatchSheetCSV,
  exportMatchSheetPDF,
} from './utils/export';
import { loadLeagueData, saveLeagueDataLocally, syncLeagueDataToServer, fetchServerLeagueData, clearLegacyStorageKeys, mergeLeagueData } from './utils/storage';
import { getAuthConfig, getCurrentSession, logoutSession, saveAuthConfig, saveAuthSession, fetchServerAuthConfig } from './utils/auth';
import { subscribeToFirebaseLeague } from './firebase';

export default function App() {
  const [leagueData, setLeagueData] = useState<LeagueData>(() => loadLeagueData());
  const [currentTab, setCurrentTab] = useState<TabType>('standings');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCloudLive, setIsCloudLive] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Ref to always hold latest league data in sync callbacks
  const leagueDataRef = useRef<LeagueData>(leagueData);
  useEffect(() => {
    leagueDataRef.current = leagueData;
  }, [leagueData]);

  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [authConfig, setAuthConfig] = useState<AuthConfig>(() => getAuthConfig());

  // Security & Data modals state
  const [isAdminSecurityOpen, setIsAdminSecurityOpen] = useState(false);
  const [isAdminUnlockOpen, setIsAdminUnlockOpen] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [adminUnlockAction, setAdminUnlockAction] = useState<string>('perform administrative action');

  // Modals state
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isEditPlayerOpen, setIsEditPlayerOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const [isPlayerDetailOpen, setIsPlayerDetailOpen] = useState(false);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);

  const [isRecordMatchOpen, setIsRecordMatchOpen] = useState(false);
  const [recordMatchId, setRecordMatchId] = useState<number>(1);

  const [isMatchDetailOpen, setIsMatchDetailOpen] = useState(false);
  const [detailMatchId, setDetailMatchId] = useState<number | null>(null);
  const [matchDetailInitialPrint, setMatchDetailInitialPrint] = useState(false);

  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isEditMatchOpen, setIsEditMatchOpen] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeletePlayerConfirmOpen, setIsDeletePlayerConfirmOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const [isConfirmActionOpen, setIsConfirmActionOpen] = useState(false);
  const [confirmActionConfig, setConfirmActionConfig] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isAdmin = authSession?.role === 'admin';

  // Manual Force Sync Function
  const handleForceSync = useCallback(async (showFeedback = true) => {
    setIsSyncing(true);
    try {
      const currentLocal = leagueDataRef.current;
      const serverData = await fetchServerLeagueData(currentLocal);
      if (serverData && Array.isArray(serverData.players) && serverData.players.length > 0) {
        setLeagueData(serverData);
        saveLeagueDataLocally(serverData);
        if (showFeedback) {
          showToast('Live league data synchronized successfully.', 'success');
        }
      } else {
        if (showFeedback) {
          showToast('League data is already up to date.', 'info');
        }
      }
      const serverAuth = await fetchServerAuthConfig();
      if (serverAuth && serverAuth.adminPassword) {
        setAuthConfig(serverAuth);
      }
    } catch (err) {
      console.warn('Manual sync notice:', err);
      if (showFeedback) {
        showToast('Sync completed with local cache fallback.', 'info');
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, []);

  // Real-time Firebase Cloud Database synchronization + polling fallback
  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to real-time live updates from Firebase Cloud Firestore
    const unsubscribe = subscribeToFirebaseLeague(
      (remoteData) => {
        if (!isMounted) return;
        setIsCloudLive(true);
        if (remoteData && Array.isArray(remoteData.players) && remoteData.players.length > 0) {
          const currentLocal = leagueDataRef.current;
          const merged = mergeLeagueData(currentLocal, remoteData);
          setLeagueData(merged);
          saveLeagueDataLocally(merged);
        }
      },
      () => {
        if (isMounted) setIsCloudLive(false);
      }
    );

    const syncFromServer = async () => {
      try {
        const currentLocal = leagueDataRef.current;
        const serverData = await fetchServerLeagueData(currentLocal);
        if (serverData && isMounted && Array.isArray(serverData.players) && serverData.players.length > 0) {
          setLeagueData(serverData);
        }
        const serverAuth = await fetchServerAuthConfig();
        if (serverAuth && isMounted && serverAuth.adminPassword) {
          setAuthConfig(serverAuth);
        }
      } catch (err) {
        console.warn('Sync error:', err);
      }
    };

    // Initial sync
    syncFromServer();

    // Poll every 6 seconds to ensure fallback sync across all browsers and devices
    const interval = setInterval(syncFromServer, 6000);

    // Sync on tab focus / visibility change / pageshow (critical for iOS Add to Home Screen Web Clips)
    const handleReactivation = () => {
      syncFromServer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromServer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleReactivation);
    window.addEventListener('pageshow', handleReactivation);
    window.addEventListener('online', handleReactivation);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleReactivation);
      window.removeEventListener('pageshow', handleReactivation);
      window.removeEventListener('online', handleReactivation);
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (leagueData && Array.isArray(leagueData.players) && leagueData.players.length > 0) {
      saveLeagueDataLocally(leagueData);
    }
  }, [leagueData]);

  // Helper to update league data in state and sync with server on admin actions
  const updateAndSyncLeagueData = (updater: (prev: LeagueData) => LeagueData) => {
    setLeagueData((prev) => {
      const updated = updater(prev);
      updated.lastUpdated = Date.now();
      leagueDataRef.current = updated;
      saveLeagueDataLocally(updated);
      syncLeagueDataToServer(updated);
      return updated;
    });
  };

  // Toast trigger
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleOpenAdminUnlock = (actionName?: string) => {
    setAdminUnlockAction(actionName || 'perform administrative changes');
    setIsAdminUnlockOpen(true);
  };

  const handleAdminElevationSuccess = (session: AuthSession) => {
    saveAuthSession(session);
    setAuthSession(session);
    showToast(`Administrator privileges unlocked! Welcome back, ${session.username}.`, 'success');
  };

  const handleUpdateAuthConfig = (newConfig: AuthConfig) => {
    saveAuthConfig(newConfig);
    setAuthConfig(newConfig);
    showToast('Security credentials updated successfully!', 'success');
  };

  const handleLogout = () => {
    logoutSession();
    setAuthSession(null);
    showToast('Exited Admin mode. Switched to Read-Only Viewer mode.', 'info');
  };

  // Player handlers (Admin guarded)
  const handleAddPlayer = (name: string, avatar: string) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('register new players');
      return;
    }

    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim().toUpperCase(),
      avatar: avatar || '',
      createdAt: Date.now(),
    };

    const trimmedNameLower = name.trim().toLowerCase();

    updateAndSyncLeagueData((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
      // If this name was previously marked as deleted, remove it from tombstones so new player can participate cleanly
      deletedPlayerNames: (prev.deletedPlayerNames || []).filter((n) => n.trim().toLowerCase() !== trimmedNameLower),
    }));

    showToast(`Player ${formatPlayerName(newPlayer.name)} registered successfully!`);
  };

  const handleUpdatePlayer = (playerId: string, newName: string, newAvatar: string) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('edit player profile');
      return;
    }

    updateAndSyncLeagueData((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, name: newName.trim().toUpperCase(), avatar: newAvatar } : p
      ),
    }));

    showToast(`Player profile updated successfully!`);
  };

  const handleUpdatePlayerAvatar = (playerId: string, avatarDataUrl: string) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('update player photo');
      return;
    }

    updateAndSyncLeagueData((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, avatar: avatarDataUrl } : p
      ),
    }));

    const player = leagueData.players.find((p) => p.id === playerId);
    if (player) {
      showToast(`Profile photo updated for ${formatPlayerName(player.name)}!`);
    }
  };

  // Delete player handler with safe confirmation modal
  const handleDeletePlayer = (playerId: string) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('remove players');
      return;
    }

    const player = leagueData.players.find((p) => p.id === playerId);
    if (!player) return;

    setPlayerToDelete(player);
    setIsDeletePlayerConfirmOpen(true);
  };

  const handleConfirmDeletePlayer = (playerId: string) => {
    const player = leagueData.players.find((p) => p.id === playerId);
    const playerName = player ? formatPlayerName(player.name) : 'Player';

    updateAndSyncLeagueData((prev) => {
      const updatedResults = { ...prev.matchResults };
      const pNameLower = player ? player.name.trim().toLowerCase() : '';
      
      Object.keys(updatedResults).forEach((mId) => {
        const mObj = updatedResults[mId as any];
        if (mObj && typeof mObj === 'object') {
          delete mObj[playerId];
          if (player) {
            delete mObj[player.name];
            delete mObj[player.name.toUpperCase()];
            delete mObj[player.name.toLowerCase()];
          }
          // Also clean up any matching keys case-insensitively
          Object.keys(mObj).forEach((k) => {
            if (k.trim().toLowerCase() === pNameLower || k === playerId) {
              delete mObj[k];
            }
          });
        }
      });

      const newDeletedIds = Array.from(new Set([...(prev.deletedPlayerIds || []), playerId]));
      const newDeletedNames = player
        ? Array.from(new Set([...(prev.deletedPlayerNames || []), player.name.trim().toLowerCase()]))
        : (prev.deletedPlayerNames || []);

      return {
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
        matchResults: updatedResults,
        deletedPlayerIds: newDeletedIds,
        deletedPlayerNames: newDeletedNames,
      };
    });

    showToast(`${playerName} removed from league roster.`, 'info');
    setIsDeletePlayerConfirmOpen(false);
    setPlayerToDelete(null);
  };

  // Match save handler (Admin guarded)
  const handleSaveMatchResults = (
    matchId: number,
    matchRecords: Record<string, PlayerMatchRecord>,
    updatedDate?: string,
    matchSheet?: MatchSheet
  ) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('record match scores');
      return;
    }

    updateAndSyncLeagueData((prev) => {
      // Check if match had any attendances or non-zero goals/penalties or matchSheet info
      const hasAnyActivity = Object.values(matchRecords).some(
        (r) => r.attendance || r.goals > 0 || r.ownGoals > 0 || r.penalty > 0 || r.win || r.onTime
      ) || (matchSheet && (matchSheet.teamAScore !== undefined || matchSheet.winner !== 'none'));

      const updatedResults = { ...prev.matchResults };
      if (hasAnyActivity) {
        updatedResults[matchId] = matchRecords;
      } else {
        // If completely empty/unplayed, remove from matchResults so it does not pollute player breakdowns
        delete updatedResults[matchId];
      }

      return {
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                date: updatedDate || m.date,
                completed: Boolean(hasAnyActivity),
                matchSheet: matchSheet !== undefined ? matchSheet : m.matchSheet
              }
            : m
        ),
        matchResults: updatedResults,
      };
    });

    const targetMatch = leagueData.matches.find((m) => m.id === matchId);
    const mTitle = targetMatch ? targetMatch.title : `Match ${matchId}`;
    if (matchSheet && matchSheet.winner && matchSheet.winner !== 'none') {
      const winnerName = matchSheet.winner === 'teamA' ? matchSheet.teamAName : (matchSheet.winner === 'teamB' ? matchSheet.teamBName : 'Draw');
      showToast(`${mTitle} Match Sheet saved! ${winnerName === 'Draw' ? 'Result: Draw' : `Winner: ${winnerName}`}`, 'success');
    } else {
      showToast(`${mTitle} scores and Match Sheet updated successfully!`, 'success');
    }
  };

  // Quick assign player to team from MatchDetailModal (Admin or direct interactive roster assignment)
  const handleAssignPlayerTeam = (matchId: number, playerId: string, team: 'teamA' | 'teamB' | undefined) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('assign players to teams');
      return;
    }

    const player = leagueData.players.find(p => p.id === playerId);
    const pName = player ? formatPlayerName(player.name) : 'Player';
    const targetMatch = leagueData.matches.find(m => m.id === matchId);
    const ms = targetMatch?.matchSheet;
    const teamAName = ms?.teamAName || 'Red Team';
    const teamBName = ms?.teamBName || 'Blue Team';

    updateAndSyncLeagueData((prev) => {
      const matchRecs = { ...(prev.matchResults[matchId] || {}) };
      const existing = matchRecs[playerId] || {
        attendance: true,
        win: false,
        onTime: false,
        goals: 0,
        ownGoals: 0,
        penalty: 0,
      };

      // Set attendance if assigning to team
      const shouldAttend = team ? true : existing.attendance;
      
      // Auto calculate win if match has confirmed winner
      let shouldWin = existing.win;
      if (ms?.winner === 'teamA') {
        shouldWin = team === 'teamA';
      } else if (ms?.winner === 'teamB') {
        shouldWin = team === 'teamB';
      } else if (ms?.winner === 'draw') {
        shouldWin = false;
      }

      matchRecs[playerId] = {
        ...existing,
        attendance: shouldAttend,
        team: team,
        win: shouldWin,
      };

      return {
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? { ...m, completed: true } : m),
        matchResults: {
          ...prev.matchResults,
          [matchId]: matchRecs,
        },
      };
    });

    const targetTeamName = team === 'teamA' ? teamAName : team === 'teamB' ? teamBName : 'Unassigned pool';
    showToast(team ? `Added ${pName} to ${targetTeamName}` : `Moved ${pName} to attending pool`, 'info');
  };

  // Reset a single match's recorded results (Admin guarded)
  const handleResetSingleMatch = (matchId: number) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('reset match results');
      return;
    }
    const match = leagueData.matches.find((m) => m.id === matchId);
    const title = match ? match.title : `Match ${matchId}`;

    setConfirmActionConfig({
      title: `Reset ${title} Results`,
      message: `Are you sure you want to clear and reset all recorded player results for ${title}? This will restore ${title} to uncompleted status. Registered players will remain safe.`,
      confirmLabel: `Reset ${title}`,
      confirmVariant: 'danger',
      onConfirm: () => {
        updateAndSyncLeagueData((prev) => {
          const updatedResults = { ...prev.matchResults };
          delete updatedResults[matchId];
          delete (updatedResults as any)[String(matchId)];

          return {
            ...prev,
            matches: prev.matches.map((m) =>
              m.id === matchId ? { ...m, completed: false } : m
            ),
            matchResults: updatedResults,
          };
        });
        showToast(`Results cleared for ${title}.`, 'info');
      },
    });
    setIsConfirmActionOpen(true);
  };

  // Add new match fixture handler (Admin guarded)
  const handleAddMatch = (
    title: string,
    date: string,
    teamAName?: string,
    teamBName?: string
  ) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('schedule extra match date');
      return;
    }

    const nextId =
      leagueData.matches.length > 0
        ? Math.max(...leagueData.matches.map((m) => m.id)) + 1
        : 1;

    const newMatch: Match = {
      id: nextId,
      title: title.trim() || `Match ${nextId}`,
      date: date,
      completed: false,
      matchSheet: {
        teamAName: teamAName?.trim() || 'Team Gaza',
        teamBName: teamBName?.trim() || 'Team Rashu',
      },
    };

    updateAndSyncLeagueData((prev) => ({
      ...prev,
      matches: [...prev.matches, newMatch],
    }));

    showToast(`Added ${newMatch.title} (${newMatch.matchSheet?.teamAName} vs ${newMatch.matchSheet?.teamBName}) scheduled for ${newMatch.date}!`, 'success');
  };

  // Update existing match details (Admin guarded)
  const handleUpdateMatch = (
    matchId: number,
    newTitle: string,
    newDate: string,
    completed: boolean,
    teamAName?: string,
    teamBName?: string,
    matchSheet?: Partial<MatchSheet>
  ) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('modify match details');
      return;
    }

    updateAndSyncLeagueData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.id !== matchId) return m;

        let updatedSheet: MatchSheet | undefined = m.matchSheet;
        if (teamAName || teamBName || matchSheet) {
          updatedSheet = {
            teamAName: teamAName?.trim() || m.matchSheet?.teamAName || 'Team Gaza',
            teamBName: teamBName?.trim() || m.matchSheet?.teamBName || 'Team Rashu',
            teamAScore: matchSheet?.teamAScore !== undefined ? matchSheet.teamAScore : m.matchSheet?.teamAScore,
            teamBScore: matchSheet?.teamBScore !== undefined ? matchSheet.teamBScore : m.matchSheet?.teamBScore,
            winner: matchSheet?.winner !== undefined ? matchSheet.winner : m.matchSheet?.winner,
            playerTeams: matchSheet?.playerTeams !== undefined ? matchSheet.playerTeams : m.matchSheet?.playerTeams,
            notes: matchSheet?.notes !== undefined ? matchSheet.notes : m.matchSheet?.notes,
          };
        }

        return {
          ...m,
          title: newTitle.trim(),
          date: newDate,
          completed,
          matchSheet: updatedSheet,
        };
      }),
    }));

    showToast(`Match details & team names updated successfully!`, 'success');
  };

  // Delete match fixture (Admin guarded)
  const handleDeleteMatch = (matchId: number) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('delete match fixture');
      return;
    }

    const match = leagueData.matches.find((m) => m.id === matchId);
    const title = match ? match.title : `Match ${matchId}`;

    setConfirmActionConfig({
      title: `Delete ${title}`,
      message: `Are you sure you want to delete ${title} from the league schedule? Any recorded scores for this fixture will be removed.`,
      confirmLabel: `Delete Match`,
      confirmVariant: 'danger',
      onConfirm: () => {
        updateAndSyncLeagueData((prev) => {
          const updatedResults = { ...prev.matchResults };
          delete updatedResults[matchId];
          delete (updatedResults as any)[String(matchId)];

          return {
            ...prev,
            matches: prev.matches.filter((m) => m.id !== matchId),
            matchResults: updatedResults,
          };
        });
        showToast(`${title} removed from league schedule.`, 'info');
      },
    });
    setIsConfirmActionOpen(true);
  };

  // Reset match data handler (Admin guarded)
  const handleResetMatchData = () => {
    if (!isAdmin) {
      handleOpenAdminUnlock('reset match database');
      return;
    }

    clearLegacyStorageKeys();

    const resetTimestamp = Date.now();
    updateAndSyncLeagueData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => ({ ...m, completed: false })),
      matchResults: {},
      lastUpdated: resetTimestamp,
    }));

    showToast(`All match results have been reset. Registered players preserved.`, 'info');
  };

  // Modal open helpers
  const handleOpenEditPlayer = (playerId: string) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('edit player profile');
      return;
    }
    setEditingPlayerId(playerId);
    setIsEditPlayerOpen(true);
  };

  const handleOpenPlayerDetail = (playerId: string) => {
    setDetailPlayerId(playerId);
    setIsPlayerDetailOpen(true);
  };

  const handleOpenRecordMatch = (matchId?: number) => {
    if (!isAdmin) {
      handleOpenAdminUnlock('record match scores and attendance');
      return;
    }
    if (matchId) {
      setRecordMatchId(matchId);
    } else {
      // Intelligently find the earliest uncompleted match, or the first match
      const nextUncompleted = leagueData.matches.find((m) => !m.completed) || leagueData.matches[0];
      setRecordMatchId(nextUncompleted ? nextUncompleted.id : 1);
    }
    setIsRecordMatchOpen(true);
  };

  const handleOpenMatchDetail = (matchId: number, initialPrint: boolean = false) => {
    setDetailMatchId(matchId);
    setMatchDetailInitialPrint(initialPrint);
    setIsMatchDetailOpen(true);
  };

  const editingPlayer = leagueData.players.find((p) => p.id === editingPlayerId) || null;
  const detailPlayer = leagueData.players.find((p) => p.id === detailPlayerId) || null;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Hidden print container */}
      <div id="print-report-container" className="hidden"></div>

      {/* Header Navigation */}
      <Header
        currentTab={currentTab}
        authSession={authSession}
        matchCount={leagueData.matches.length}
        isCloudLive={isCloudLive}
        isSyncing={isSyncing}
        onForceSync={() => handleForceSync(true)}
        onTabChange={setCurrentTab}
        onOpenAddPlayer={() => {
          if (!isAdmin) {
            handleOpenAdminUnlock('register new players');
            return;
          }
          setIsAddPlayerOpen(true);
        }}
        onOpenRecordMatch={(mId) => handleOpenRecordMatch(mId)}
        onOpenSecurityModal={() => setIsAdminSecurityOpen(true)}
        onOpenDataBackup={() => setIsDataBackupOpen(true)}
        onOpenAdminUnlock={() => handleOpenAdminUnlock('elevate to Administrator')}
        onLogout={handleLogout}
      />

      {/* Viewer mode banner info */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-sky-950/70 border-b border-sky-900/40 px-4 py-2 text-xs text-sky-200 text-center flex items-center justify-center space-x-2 no-print">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span>
            <strong className="font-bold text-white">Public Viewer Mode</strong> (Direct Link Access • Read-Only). Standings, matches, and reports are freely accessible.
          </span>
          <button
            onClick={() => handleOpenAdminUnlock('admin editing privileges')}
            className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'standings' && (
          <StandingsView
            leagueData={leagueData}
            isAdmin={isAdmin}
            onOpenPlayerDetail={handleOpenPlayerDetail}
            onExportExcel={() => exportStandingsCSV(leagueData)}
            onExportPDF={() => exportStandingsPDF(leagueData)}
            onOpenResetModal={() => setIsResetConfirmOpen(true)}
            onOpenAdminUnlock={handleOpenAdminUnlock}
          />
        )}

        {currentTab === 'matches' && (
          <MatchesView
            leagueData={leagueData}
            isAdmin={isAdmin}
            onOpenRecordMatch={handleOpenRecordMatch}
            onOpenMatchDetail={handleOpenMatchDetail}
            onOpenAddMatch={() => {
              if (!isAdmin) {
                handleOpenAdminUnlock('schedule new match date');
                return;
              }
              setIsAddMatchOpen(true);
            }}
            onOpenEditMatch={(match) => {
              if (!isAdmin) {
                handleOpenAdminUnlock('edit match date or title');
                return;
              }
              setMatchToEdit(match);
              setIsEditMatchOpen(true);
            }}
            onOpenAdminUnlock={handleOpenAdminUnlock}
          />
        )}

        {currentTab === 'players' && (
          <PlayersView
            leagueData={leagueData}
            isAdmin={isAdmin}
            onOpenAddPlayer={() => setIsAddPlayerOpen(true)}
            onOpenEditPlayer={handleOpenEditPlayer}
            onOpenPlayerDetail={handleOpenPlayerDetail}
            onDeletePlayer={handleDeletePlayer}
            onUpdatePlayerAvatar={handleUpdatePlayerAvatar}
            onExportExcel={() => exportPlayersCSV(leagueData)}
            onExportPDF={() => exportPlayersPDF(leagueData)}
            onOpenAdminUnlock={handleOpenAdminUnlock}
          />
        )}

        {currentTab === 'rules' && <RulesView />}
      </main>

      {/* Modals */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onAddPlayer={handleAddPlayer}
      />

      <EditPlayerModal
        isOpen={isEditPlayerOpen}
        player={editingPlayer}
        onClose={() => {
          setIsEditPlayerOpen(false);
          setEditingPlayerId(null);
        }}
        onUpdatePlayer={handleUpdatePlayer}
        onDeletePlayer={handleDeletePlayer}
      />

      <PlayerDetailModal
        isOpen={isPlayerDetailOpen}
        player={detailPlayer}
        leagueData={leagueData}
        isAdmin={isAdmin}
        onClose={() => {
          setIsPlayerDetailOpen(false);
          setDetailPlayerId(null);
        }}
        onOpenEdit={(pId) => {
          setIsPlayerDetailOpen(false);
          handleOpenEditPlayer(pId);
        }}
        onDeletePlayer={handleDeletePlayer}
        onExportExcel={(p) => exportPlayerIndividualCSV(p, leagueData)}
        onExportPDF={(p) => exportPlayerIndividualPDF(p, leagueData)}
      />

      <RecordMatchModal
        isOpen={isRecordMatchOpen}
        selectedMatchId={recordMatchId}
        leagueData={leagueData}
        onClose={() => setIsRecordMatchOpen(false)}
        onSaveMatchResults={handleSaveMatchResults}
        onResetMatchResults={handleResetSingleMatch}
      />

      <MatchDetailModal
        isOpen={isMatchDetailOpen}
        matchId={detailMatchId}
        leagueData={leagueData}
        isAdmin={isAdmin}
        initialPrintMode={matchDetailInitialPrint}
        onClose={() => {
          setIsMatchDetailOpen(false);
          setDetailMatchId(null);
          setMatchDetailInitialPrint(false);
        }}
        onOpenRecord={(mId) => {
          setIsMatchDetailOpen(false);
          handleOpenRecordMatch(mId);
        }}
        onOpenEditMatch={(match) => {
          setIsMatchDetailOpen(false);
          setMatchToEdit(match);
          setIsEditMatchOpen(true);
        }}
        onResetMatchResults={handleResetSingleMatch}
        onExportExcel={(match) => exportMatchSheetCSV(match, leagueData)}
        onExportPDF={(match) => exportMatchSheetPDF(match, leagueData)}
        onAssignPlayerTeam={handleAssignPlayerTeam}
      />

      <AddMatchModal
        isOpen={isAddMatchOpen}
        leagueData={leagueData}
        onClose={() => setIsAddMatchOpen(false)}
        onAddMatch={handleAddMatch}
      />

      <EditMatchModal
        isOpen={isEditMatchOpen}
        match={matchToEdit}
        canDelete={leagueData.matches.length > 1}
        onClose={() => {
          setIsEditMatchOpen(false);
          setMatchToEdit(null);
        }}
        onUpdateMatch={handleUpdateMatch}
        onDeleteMatch={handleDeleteMatch}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirmReset={handleResetMatchData}
      />

      <DeletePlayerConfirmModal
        isOpen={isDeletePlayerConfirmOpen}
        player={playerToDelete}
        onClose={() => {
          setIsDeletePlayerConfirmOpen(false);
          setPlayerToDelete(null);
        }}
        onConfirm={handleConfirmDeletePlayer}
      />

      <ConfirmActionModal
        isOpen={isConfirmActionOpen}
        title={confirmActionConfig.title}
        message={confirmActionConfig.message}
        confirmLabel={confirmActionConfig.confirmLabel}
        confirmVariant={confirmActionConfig.confirmVariant}
        onClose={() => setIsConfirmActionOpen(false)}
        onConfirm={confirmActionConfig.onConfirm}
      />

      {/* Security & Data Modals */}
      <DataBackupModal
        isOpen={isDataBackupOpen}
        leagueData={leagueData}
        onClose={() => setIsDataBackupOpen(false)}
        onRestoreData={(restored) => {
          updateAndSyncLeagueData(() => restored);
        }}
        onShowToast={showToast}
      />

      <AdminSecurityModal
        isOpen={isAdminSecurityOpen}
        authConfig={authConfig}
        onClose={() => setIsAdminSecurityOpen(false)}
        onUpdateConfig={handleUpdateAuthConfig}
      />

      <AdminUnlockModal
        isOpen={isAdminUnlockOpen}
        authConfig={authConfig}
        actionName={adminUnlockAction}
        onClose={() => setIsAdminUnlockOpen(false)}
        onSuccess={handleAdminElevationSuccess}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Footer */}
      <footer className="mt-auto bg-slate-900/90 border-t border-slate-800 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            Friday Football Individual League 2.0 • 14 Aug 2026 – 27 Nov 2026 • 15 Scheduled Matches
          </p>
          <div className="flex items-center space-x-3 text-slate-500 font-medium">
            <span>Best 13 Results Competition Engine</span>
            <span>•</span>
            <button
              onClick={() => {
                if (isAdmin) setIsAdminSecurityOpen(true);
                else handleOpenAdminUnlock('security portal');
              }}
              className="hover:text-amber-400 transition cursor-pointer"
            >
              Security Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
