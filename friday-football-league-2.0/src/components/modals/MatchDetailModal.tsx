import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, FileSpreadsheet, FileText, Edit3, Users, Trophy, Clock, CheckCircle2, 
  AlertCircle, CalendarDays, RotateCcw, Printer, Check, Eye, Swords, Shield, Star,
  Share2, Copy, BarChart3, Sparkles
} from 'lucide-react';
import { formatPlayerName, getDayOfWeekName } from '../../constants';
import { LeagueData, Match, Player, PlayerMatchRecord } from '../../types';
import { TacticalPitchView } from './TacticalPitchView';

interface MatchDetailModalProps {
  matchId: number | null;
  leagueData: LeagueData;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecord: (matchId: number) => void;
  onOpenEditMatch?: (match: Match) => void;
  onResetMatchResults?: (matchId: number) => void;
  onExportExcel: (match: Match) => void;
  onExportPDF: (match: Match) => void;
  onAssignPlayerTeam?: (matchId: number, playerId: string, team: 'teamA' | 'teamB' | undefined) => void;
  initialPrintMode?: boolean;
}

type DetailViewTab = 'pitch' | 'teams' | 'h2h' | 'table';

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  matchId,
  leagueData,
  isAdmin,
  isOpen,
  onClose,
  onOpenRecord,
  onOpenEditMatch,
  onResetMatchResults,
  onExportExcel,
  onExportPDF,
  onAssignPlayerTeam,
  initialPrintMode = false,
}) => {
  const [isPrintView, setIsPrintView] = useState(initialPrintMode);
  const [filterRoster, setFilterRoster] = useState<'attending' | 'all'>('attending');
  const [viewTab, setViewTab] = useState<DetailViewTab>('pitch');
  const [copiedText, setCopiedText] = useState(false);
  const [selectedTeamTarget, setSelectedTeamTarget] = useState<'teamA' | 'teamB'>('teamA');

  useEffect(() => {
    setIsPrintView(initialPrintMode);
  }, [initialPrintMode, matchId]);

  if (!isOpen || matchId === null) return null;

  const match = leagueData.matches.find(m => m.id === matchId) || leagueData.matches[0];
  const matchRes = leagueData.matchResults[match.id] || {};
  const dayName = getDayOfWeekName(match.date);
  const matchSheet = match.matchSheet;

  const teamAName = matchSheet?.teamAName || 'Red Team';
  const teamBName = matchSheet?.teamBName || 'Blue Team';
  const teamAScore = matchSheet?.teamAScore;
  const teamBScore = matchSheet?.teamBScore;
  const winner = matchSheet?.winner;

  let attendedCount = 0;
  let winnersCount = 0;
  let ontimeCount = 0;
  let totalMatchGoals = 0;
  let totalMatchOwnGoals = 0;
  let totalMatchPenalties = 0;

  const presentList: Player[] = [];
  const absentList: Player[] = [];
  const teamAPlayers: { player: Player; record: PlayerMatchRecord }[] = [];
  const teamBPlayers: { player: Player; record: PlayerMatchRecord }[] = [];
  const unassignedPlayers: { player: Player; record: PlayerMatchRecord }[] = [];

  let teamAGoalsCount = 0;
  let teamBGoalsCount = 0;
  let teamAOnTimeCount = 0;
  let teamBOnTimeCount = 0;
  let teamATotalPoints = 0;
  let teamBTotalPoints = 0;

  leagueData.players.forEach(player => {
    const r = matchRes[player.id];
    if (r && r.attendance) {
      attendedCount++;
      if (r.win) winnersCount++;
      if (r.onTime) ontimeCount++;
      if (r.goals) totalMatchGoals += Number(r.goals) || 0;
      if (r.ownGoals) totalMatchOwnGoals += Number(r.ownGoals) || 0;
      if (r.penalty) totalMatchPenalties += Number(r.penalty) || 0;
      presentList.push(player);

      let pPts = 0.5;
      if (r.win) pPts += 1.0;
      if (r.onTime) pPts += 1.0;
      if (r.penalty) pPts -= Number(r.penalty) || 0;

      if (r.team === 'teamA') {
        teamAPlayers.push({ player, record: r });
        if (r.goals) teamAGoalsCount += Number(r.goals) || 0;
        if (r.onTime) teamAOnTimeCount++;
        teamATotalPoints += pPts;
      } else if (r.team === 'teamB') {
        teamBPlayers.push({ player, record: r });
        if (r.goals) teamBGoalsCount += Number(r.goals) || 0;
        if (r.onTime) teamBOnTimeCount++;
        teamBTotalPoints += pPts;
      } else {
        unassignedPlayers.push({ player, record: r });
      }
    } else {
      absentList.push(player);
    }
  });

  presentList.sort((a, b) => a.name.localeCompare(b.name));
  absentList.sort((a, b) => a.name.localeCompare(b.name));
  teamAPlayers.sort((a, b) => a.player.name.localeCompare(b.player.name));
  teamBPlayers.sort((a, b) => a.player.name.localeCompare(b.player.name));
  
  const displayedPlayers = filterRoster === 'attending' 
    ? presentList 
    : [...presentList, ...absentList];

  const handlePrint = () => {
    document.body.classList.add('printing-match-sheet');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-match-sheet');
    }, 1000);
  };

  const winnerText = winner === 'teamA' 
    ? `🔴 ${teamAName} (Red) won ${match.title} on Friday ${match.date}`
    : winner === 'teamB'
    ? `🔵 ${teamBName} (Blue) won ${match.title} on Friday ${match.date}`
    : winner === 'draw'
    ? `🤝 Draw match between 🔴 ${teamAName} & 🔵 ${teamBName} on Friday ${match.date}`
    : null;

  const handleCopyTeamSheet = () => {
    let text = `⚽ *FRIDAY FOOTBALL LEAGUE 2.0 • TEAM SHEET*\n`;
    text += `📅 *${match.title}* • ${dayName ? `${dayName}, ` : ''}${match.date} (6:00 AM – 8:00 AM)\n`;
    if (winnerText) {
      text += `🏆 *Result:* 🔴 ${teamAName} ${teamAScore !== undefined ? teamAScore : teamAGoalsCount} - ${teamBScore !== undefined ? teamBScore : teamBGoalsCount} 🔵 ${teamBName}\n`;
      text += `📢 *Outcome:* ${winnerText}\n\n`;
    } else {
      text += `🛡️ *Matchup:* 🔴 ${teamAName} (Red) vs 🔵 ${teamBName} (Blue)\n\n`;
    }

    text += `🔴 *${teamAName.toUpperCase()} (RED JERSEY)* [${teamAPlayers.length} Players • ${teamAGoalsCount} Goals]:\n`;
    if (teamAPlayers.length === 0) {
      text += `_No players assigned yet_\n`;
    } else {
      teamAPlayers.forEach(({ player, record }, idx) => {
        const badges = [];
        if (record.goals > 0) badges.push(`⚽${record.goals}`);
        if (record.onTime) badges.push(`⏰`);
        if (record.win) badges.push(`🏆`);
        text += `${idx + 1}. ${formatPlayerName(player.name)}${badges.length ? ' ' + badges.join(' ') : ''}\n`;
      });
    }

    text += `\n🔵 *${teamBName.toUpperCase()} (BLUE JERSEY)* [${teamBPlayers.length} Players • ${teamBGoalsCount} Goals]:\n`;
    if (teamBPlayers.length === 0) {
      text += `_No players assigned yet_\n`;
    } else {
      teamBPlayers.forEach(({ player, record }, idx) => {
        const badges = [];
        if (record.goals > 0) badges.push(`⚽${record.goals}`);
        if (record.onTime) badges.push(`⏰`);
        if (record.win) badges.push(`🏆`);
        text += `${idx + 1}. ${formatPlayerName(player.name)}${badges.length ? ' ' + badges.join(' ') : ''}\n`;
      });
    }

    if (unassignedPlayers.length > 0) {
      text += `\n🪑 *Bench / Unassigned* (${unassignedPlayers.length}):\n`;
      text += unassignedPlayers.map(({ player }) => formatPlayerName(player.name)).join(', ') + '\n';
    }

    text += `\n📊 Scoring: Attendance = +0.5 | Win = +1.0 | On-Time = +1.0 (Max +2.5 pts)`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="match-detail-modal-wrapper fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className={`match-detail-modal-box w-full max-w-4xl rounded-2xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto transition-all ${
        isPrintView 
          ? 'bg-white text-slate-950 p-5 sm:p-7 border-2 border-amber-500' 
          : 'glass-panel p-5 sm:p-7 border border-slate-700'
      }`}>
        
        {/* ========================================================================= */}
        {/* A4 PRINT VIEW TOP CONTROLS (Clean floating action bar outside paper on screen) */}
        {/* ========================================================================= */}
        {isPrintView && (
          <div className="no-print flex items-center justify-between gap-2 pb-2 border-b border-slate-300">
            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>📄 A4 Match Sheet Print Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintView(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* A4 PRINTABLE DOCUMENT CONTAINER                                           */}
        {/* ========================================================================= */}
        {isPrintView ? (
          <div className="print-clean-container bg-white text-slate-900 p-4 sm:p-6 rounded-xl border border-slate-300 shadow-sm space-y-4">
            
            {/* 1. Official League Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-lg bg-amber-500 border border-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shrink-0 shadow-sm">
                  ⚽
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">
                    Friday Football League 2.0
                  </h1>
                  <h2 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Official Match & Squad Team Sheet • {match.title}
                  </h2>
                  <p className="text-[10px] font-semibold text-slate-600">
                    {dayName ? `${dayName}, ` : ''}{match.date} • 6:00 AM – 8:00 AM • Main Turf Ground
                  </p>
                </div>
              </div>

              <div className="text-right text-[9px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900 uppercase">
                  Status: <span className="text-emerald-700">{match.completed ? 'Official Final' : 'Scheduled Match'}</span>
                </div>
                <div>Doc ID: <strong>FFL-2026-M{match.id}</strong></div>
                <div>Date Printed: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>

            {/* 2. Official Match Scoreboard & Outcome Banner */}
            <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-3.5 text-center">
              <div className="grid grid-cols-11 gap-2 items-center">
                {/* Red Team Name & Badge */}
                <div className="col-span-4 bg-rose-50 border border-rose-300 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-left">
                    <span className="text-base">🔴</span>
                    <div>
                      <div className="font-black text-rose-950 text-xs sm:text-sm uppercase tracking-wide">{teamAName}</div>
                      <div className="text-[10px] font-bold text-rose-800">Red Jersey • {teamAPlayers.length} Players</div>
                    </div>
                  </div>
                  {winner === 'teamA' && (
                    <span className="px-2 py-0.5 bg-rose-700 text-white text-[10px] font-black rounded">
                      🏆 WINNER
                    </span>
                  )}
                </div>

                {/* Match Score */}
                <div className="col-span-3 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-widest">
                    <span className="text-rose-700">{teamAScore !== undefined ? teamAScore : teamAGoalsCount}</span>
                    <span className="text-slate-400 mx-2">:</span>
                    <span className="text-sky-700">{teamBScore !== undefined ? teamBScore : teamBGoalsCount}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                    Match Result
                  </span>
                </div>

                {/* Blue Team Name & Badge */}
                <div className="col-span-4 bg-sky-50 border border-sky-300 rounded-lg p-2 flex items-center justify-between">
                  {winner === 'teamB' && (
                    <span className="px-2 py-0.5 bg-sky-700 text-white text-[10px] font-black rounded">
                      🏆 WINNER
                    </span>
                  )}
                  <div className="flex items-center space-x-2 text-right ml-auto">
                    <div>
                      <div className="font-black text-sky-950 text-xs sm:text-sm uppercase tracking-wide">{teamBName}</div>
                      <div className="text-[10px] font-bold text-sky-800">Blue Jersey • {teamBPlayers.length} Players</div>
                    </div>
                    <span className="text-base">🔵</span>
                  </div>
                </div>
              </div>

              {winnerText && (
                <div className="mt-2 pt-2 border-t border-slate-300 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>{winnerText}</span>
                </div>
              )}
            </div>

            {/* 3. Match Key Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Total Turnout</span>
                <span className="text-sm font-black text-emerald-800">{attendedCount} Players</span>
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Match Winners</span>
                <span className="text-sm font-black text-amber-800">{winnersCount} Players</span>
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">On-Time Arrivals</span>
                <span className="text-sm font-black text-blue-800">{ontimeCount} Players</span>
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Goals Scored</span>
                <span className="text-sm font-black text-slate-900">{totalMatchGoals} Goals</span>
              </div>
            </div>

            {/* 4. Side-by-Side Official Team Squads */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* RED TEAM SQUAD BOX */}
                <div className="border-2 border-rose-700 rounded-xl overflow-hidden bg-white">
                  <div className="bg-rose-700 text-white px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wide">
                      <span>🔴</span>
                      <span>{teamAName} (Red Jersey)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-rose-900 px-2 py-0.5 rounded-full">
                      {teamAPlayers.length} Players • {teamAGoalsCount} Goals
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-rose-50 text-rose-950 border-b border-rose-200 text-[10px] uppercase font-black">
                        <th className="py-1.5 px-2 text-center w-6">#</th>
                        <th className="py-1.5 px-2">Player Name</th>
                        <th className="py-1.5 px-1.5 text-center">Att</th>
                        <th className="py-1.5 px-1.5 text-center">Win</th>
                        <th className="py-1.5 px-1.5 text-center">Time</th>
                        <th className="py-1.5 px-1.5 text-center">Goal</th>
                        <th className="py-1.5 px-2 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {teamAPlayers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-500 italic text-[10px]">
                            No players assigned to {teamAName}
                          </td>
                        </tr>
                      ) : (
                        teamAPlayers.map(({ player, record }, idx) => {
                          let pPts = 0.5;
                          if (record.win) pPts += 1.0;
                          if (record.onTime) pPts += 1.0;
                          if (record.penalty) pPts -= record.penalty;

                          return (
                            <tr key={player.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-1 px-2 text-center font-bold text-slate-500 text-[10px]">{idx + 1}</td>
                              <td className="py-1 px-2 font-bold text-slate-950">{formatPlayerName(player.name)}</td>
                              <td className="py-1 px-1.5 text-center text-emerald-700 font-bold">✓</td>
                              <td className="py-1 px-1.5 text-center font-bold text-amber-700">{record.win ? '🏆' : '—'}</td>
                              <td className="py-1 px-1.5 text-center font-bold text-blue-700">{record.onTime ? '⏰' : '—'}</td>
                              <td className="py-1 px-1.5 text-center font-black text-emerald-800">{record.goals > 0 ? `⚽${record.goals}` : '—'}</td>
                              <td className="py-1 px-2 text-right font-black text-slate-900">+{pPts.toFixed(1)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-rose-50 border-t border-rose-300 font-black text-[10px] text-rose-950">
                      <tr>
                        <td colSpan={2} className="py-1.5 px-2">Red Team Totals:</td>
                        <td className="py-1.5 px-1.5 text-center text-emerald-800">{teamAPlayers.length}</td>
                        <td className="py-1.5 px-1.5 text-center text-amber-800">{winner === 'teamA' ? teamAPlayers.length : 0}</td>
                        <td className="py-1.5 px-1.5 text-center text-blue-800">{teamAOnTimeCount}</td>
                        <td className="py-1.5 px-1.5 text-center text-emerald-800">{teamAGoalsCount}</td>
                        <td className="py-1.5 px-2 text-right">+{teamATotalPoints.toFixed(1)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* BLUE TEAM SQUAD BOX */}
                <div className="border-2 border-sky-700 rounded-xl overflow-hidden bg-white">
                  <div className="bg-sky-700 text-white px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wide">
                      <span>🔵</span>
                      <span>{teamBName} (Blue Jersey)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-sky-900 px-2 py-0.5 rounded-full">
                      {teamBPlayers.length} Players • {teamBGoalsCount} Goals
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-sky-50 text-sky-950 border-b border-sky-200 text-[10px] uppercase font-black">
                        <th className="py-1.5 px-2 text-center w-6">#</th>
                        <th className="py-1.5 px-2">Player Name</th>
                        <th className="py-1.5 px-1.5 text-center">Att</th>
                        <th className="py-1.5 px-1.5 text-center">Win</th>
                        <th className="py-1.5 px-1.5 text-center">Time</th>
                        <th className="py-1.5 px-1.5 text-center">Goal</th>
                        <th className="py-1.5 px-2 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {teamBPlayers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-500 italic text-[10px]">
                            No players assigned to {teamBName}
                          </td>
                        </tr>
                      ) : (
                        teamBPlayers.map(({ player, record }, idx) => {
                          let pPts = 0.5;
                          if (record.win) pPts += 1.0;
                          if (record.onTime) pPts += 1.0;
                          if (record.penalty) pPts -= record.penalty;

                          return (
                            <tr key={player.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-1 px-2 text-center font-bold text-slate-500 text-[10px]">{idx + 1}</td>
                              <td className="py-1 px-2 font-bold text-slate-950">{formatPlayerName(player.name)}</td>
                              <td className="py-1 px-1.5 text-center text-emerald-700 font-bold">✓</td>
                              <td className="py-1 px-1.5 text-center font-bold text-amber-700">{record.win ? '🏆' : '—'}</td>
                              <td className="py-1 px-1.5 text-center font-bold text-blue-700">{record.onTime ? '⏰' : '—'}</td>
                              <td className="py-1 px-1.5 text-center font-black text-emerald-800">{record.goals > 0 ? `⚽${record.goals}` : '—'}</td>
                              <td className="py-1 px-2 text-right font-black text-slate-900">+{pPts.toFixed(1)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-sky-50 border-t border-sky-300 font-black text-[10px] text-sky-950">
                      <tr>
                        <td colSpan={2} className="py-1.5 px-2">Blue Team Totals:</td>
                        <td className="py-1.5 px-1.5 text-center text-emerald-800">{teamBPlayers.length}</td>
                        <td className="py-1.5 px-1.5 text-center text-amber-800">{winner === 'teamB' ? teamBPlayers.length : 0}</td>
                        <td className="py-1.5 px-1.5 text-center text-blue-800">{teamBOnTimeCount}</td>
                        <td className="py-1.5 px-1.5 text-center text-emerald-800">{teamBGoalsCount}</td>
                        <td className="py-1.5 px-2 text-right">+{teamBTotalPoints.toFixed(1)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Reserves / Unassigned Players (if any) */}
              {unassignedPlayers.length > 0 && (
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs">
                  <span className="font-bold text-slate-800 uppercase text-[10px] block mb-1">
                    Attending Bench / Reserves ({unassignedPlayers.length}):
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 font-semibold">
                    {unassignedPlayers.map(({ player }, idx) => (
                      <span key={player.id} className="bg-white border border-slate-300 px-2 py-0.5 rounded shadow-xs">
                        {idx + 1}. {formatPlayerName(player.name)} (+0.5 pt)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Official Sign-off & Certification Footer */}
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-[10px] text-slate-700">
              <div>
                <div className="font-black uppercase text-slate-900">Scoring Formula:</div>
                <div>Attendance = +0.5 | Win = +1.0 | On-Time = +1.0</div>
                <div>Max Match Pts = +2.5 per player</div>
              </div>

              <div className="text-center flex flex-col justify-end">
                <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                <div className="font-bold text-slate-900 uppercase text-[9px]">🔴 {teamAName} Captain Sign-off</div>
              </div>

              <div className="text-right flex flex-col justify-end">
                <div className="border-b border-slate-400 w-36 ml-auto mb-1"></div>
                <div className="font-bold text-slate-900 uppercase text-[9px]">Referee / Scorer Sign-off</div>
              </div>
            </div>

          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* MODAL HEADER (In Standard Dark View Mode)                                 */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3 no-print">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shrink-0 shadow-sm">
                  M{match.id}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg sm:text-xl font-black text-white">{match.title} Team Sheet</h3>
                    {isAdmin && onOpenEditMatch && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenEditMatch(match);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Match Date & Title"
                      >
                        <CalendarDays className="w-4 h-4 text-amber-400" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dayName ? `${dayName}, ` : ''}{match.date} • 6:00 AM – 8:00 AM</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Copy Team Sheet WhatsApp Text */}
                <button
                  type="button"
                  onClick={handleCopyTeamSheet}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow active:scale-95"
                  title="Copy formatted lineup for WhatsApp or Telegram"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied to Clipboard!' : 'Share Sheet'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintView(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
                  title="Toggle Clean A4 Match Sheet Printout"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>A4 Print View</span>
                </button>

                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

        {/* ========================================================================= */}
        {/* MATCH SHEET SCOREBOARD & WINNER BANNER                                    */}
        {/* ========================================================================= */}
        <div className={`p-4 rounded-2xl border shadow-lg space-y-3 ${
          isPrintView
            ? 'bg-slate-50 border-slate-300 text-slate-950'
            : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-800'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center text-center">
            {/* Team A (Red Jersey) Badge & Name */}
            <div 
              onClick={() => setSelectedTeamTarget('teamA')}
              className={`md:col-span-4 p-3 rounded-xl flex items-center justify-between border transition cursor-pointer ${
                selectedTeamTarget === 'teamA'
                  ? 'ring-2 ring-rose-400 border-rose-500 bg-rose-950/60 shadow-md shadow-rose-950/50'
                  : 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/60'
              }`}
              title="Click to select Red Team. Then click any player below to assign them here!"
            >
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border shadow-sm ${
                  selectedTeamTarget === 'teamA'
                    ? 'bg-rose-500 text-white border-rose-300 ring-2 ring-rose-400'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  🔴
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black block text-rose-300">
                      {teamAName}
                    </span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40">
                      Red
                    </span>
                    {selectedTeamTarget === 'teamA' && (
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 bg-rose-500 text-white rounded shadow animate-pulse">
                        Selected Target
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {teamAPlayers.length} Players • {teamAGoalsCount} Goals
                  </span>
                </div>
              </div>
              {winner === 'teamA' && (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-md shadow">
                  🏆 WINNER
                </span>
              )}
            </div>

            {/* Scoreboard Middle */}
            <div className="md:col-span-3 flex flex-col items-center justify-center py-1">
              <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                <span className="text-rose-400">{teamAScore !== undefined ? teamAScore : teamAGoalsCount}</span>
                <span className="text-slate-500 mx-2">:</span>
                <span className="text-sky-400">{teamBScore !== undefined ? teamBScore : teamBGoalsCount}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {match.title} Result
              </span>
              {!isPrintView && isAdmin && onOpenEditMatch && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditMatch(match);
                  }}
                  className="mt-1 text-[10px] text-amber-400/90 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CalendarDays className="w-3 h-3" />
                  <span>Edit Teams / Fixture</span>
                </button>
              )}
            </div>

            {/* Team B (Blue Jersey) Badge & Name */}
            <div 
              onClick={() => setSelectedTeamTarget('teamB')}
              className={`md:col-span-4 p-3 rounded-xl flex items-center justify-between border transition cursor-pointer ${
                selectedTeamTarget === 'teamB'
                  ? 'ring-2 ring-sky-400 border-sky-500 bg-sky-950/60 shadow-md shadow-sky-950/50'
                  : 'bg-sky-950/30 border-sky-500/30 hover:border-sky-500/60'
              }`}
              title="Click to select Blue Team. Then click any player below to assign them here!"
            >
              {winner === 'teamB' && (
                <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-black rounded-md shadow">
                  🏆 WINNER
                </span>
              )}
              <div className="flex items-center space-x-2.5 ml-auto text-right">
                <div>
                  <div className="flex items-center justify-end gap-1.5">
                    {selectedTeamTarget === 'teamB' && (
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 bg-sky-500 text-white rounded shadow animate-pulse">
                        Selected Target
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded border border-sky-500/40">
                      Blue
                    </span>
                    <span className="text-xs sm:text-sm font-black block text-sky-300">
                      {teamBName}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {teamBPlayers.length} Players • {teamBGoalsCount} Goals
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border shadow-sm ${
                  selectedTeamTarget === 'teamB'
                    ? 'bg-sky-500 text-white border-sky-300 ring-2 ring-sky-400'
                    : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                }`}>
                  🔵
                </div>
              </div>
            </div>
          </div>

          {/* Official Winner Highlight Banner */}
          {winnerText && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold shadow-md ${
              winner === 'teamA' 
                ? 'bg-rose-950/90 border-rose-500 text-rose-200' 
                : winner === 'teamB'
                ? 'bg-sky-950/90 border-sky-500 text-sky-200'
                : 'bg-slate-900/90 border-amber-500/50 text-amber-200'
            }`}>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black">
                  {winnerText}
                </span>
              </div>
              <span className="text-[11px] opacity-80 font-semibold">
                {winner === 'draw' ? 'Result: Level Draw' : 'Official Match Sheet Verified'}
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STATS SUMMARY BOXES                                                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
          <div className={`p-2.5 sm:p-3 rounded-xl border ${
            isPrintView 
              ? 'bg-slate-50 border-slate-300 text-slate-900' 
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isPrintView ? 'text-slate-600' : 'text-slate-400'}`}>
              Players Attended
            </span>
            <span className={`text-xl font-black ${isPrintView ? 'text-emerald-800' : 'text-emerald-400'}`}>
              {attendedCount} / {leagueData.players.length}
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${
            isPrintView 
              ? 'bg-slate-50 border-slate-300 text-slate-900' 
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isPrintView ? 'text-slate-600' : 'text-slate-400'}`}>
              Match Winners
            </span>
            <span className={`text-xl font-black ${isPrintView ? 'text-amber-800' : 'text-amber-400'}`}>
              {winnersCount}
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${
            isPrintView 
              ? 'bg-slate-50 border-slate-300 text-slate-900' 
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isPrintView ? 'text-slate-600' : 'text-slate-400'}`}>
              On-Time Arrivals
            </span>
            <span className={`text-xl font-black ${isPrintView ? 'text-blue-800' : 'text-slate-200'}`}>
              {ontimeCount}
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${
            isPrintView 
              ? 'bg-slate-50 border-slate-300 text-slate-900' 
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isPrintView ? 'text-slate-600' : 'text-slate-400'}`}>
              Goals Scored
            </span>
            <span className={`text-xl font-black ${isPrintView ? 'text-emerald-800' : 'text-emerald-400'}`}>
              {totalMatchGoals}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW NAVIGATION TABS (Tactical Pitch / Team Rosters / H2H / Table)        */}
        {/* ========================================================================= */}
        {!isPrintView && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1 no-print border-b border-slate-800 pb-3">
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setViewTab('pitch')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewTab === 'pitch'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>🏟️ Pitch Lineup</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('teams')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewTab === 'teams'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Squad Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('h2h')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewTab === 'h2h'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Head-to-Head</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewTab === 'table'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Full Table ({displayedPlayers.length})</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Att (+0.5) • Win (+1.0) • On-Time (+1.0)
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. TACTICAL PITCH VISUALIZER VIEW                                         */}
        {/* ========================================================================= */}
        {!isPrintView && viewTab === 'pitch' && (
          <TacticalPitchView
            teamAName={teamAName}
            teamBName={teamBName}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            unassignedPlayers={unassignedPlayers}
            winner={winner}
            teamAScore={teamAScore}
            teamBScore={teamBScore}
            teamAGoalsCount={teamAGoalsCount}
            teamBGoalsCount={teamBGoalsCount}
            matchTitle={match.title}
            matchDate={match.date}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. SIDE-BY-SIDE TEAM ROSTERS VIEW                                         */}
        {/* ========================================================================= */}
        {!isPrintView && viewTab === 'teams' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* TEAM A (RED JERSEY) LINEUP CARD */}
              <div className="bg-slate-950/90 rounded-2xl border border-rose-500/50 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
                    <h5 className="font-black text-rose-300 text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5">
                      <span>🔴 {teamAName}</span>
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40">Red Jersey</span>
                    </h5>
                  </div>
                  {winner === 'teamA' ? (
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-xs font-black rounded-lg shadow">
                      🏆 WIN (+1.0 PTS)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">
                      {teamAPlayers.length} Players Assigned
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {teamAPlayers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      No players assigned to {teamAName} (Red Jersey).
                    </div>
                  ) : (
                    teamAPlayers.map(({ player, record }) => {
                      const fName = formatPlayerName(player.name);
                      let pts = 0;
                      if (record.attendance) pts += 0.5;
                      if (record.win) pts += 1.0;
                      if (record.onTime) pts += 1.0;
                      if (record.penalty) pts -= record.penalty;

                      return (
                        <div
                          key={player.id}
                          className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs hover:border-rose-400/50 transition"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {player.avatar ? (
                              <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full object-cover border border-rose-500/40 shrink-0" />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-rose-900/60 border border-rose-700/60 text-rose-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {fName.charAt(0)}
                              </span>
                            )}
                            <span className="font-bold text-white truncate">{fName}</span>
                            {record.goals > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
                                ⚽ {record.goals}
                              </span>
                            )}
                            {record.onTime && (
                              <span className="text-[10px] text-emerald-400 font-bold" title="On-Time">⏰</span>
                            )}
                            {record.win && (
                              <span className="text-[10px] text-rose-400 font-bold" title="Match Win">🏆</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="font-black text-rose-400">
                              +{pts.toFixed(1)} pts
                            </span>
                            {onAssignPlayerTeam && (
                              <button
                                type="button"
                                onClick={() => onAssignPlayerTeam(match.id, player.id, undefined)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition"
                                title={`Remove ${fName} from ${teamAName}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* TEAM B (BLUE JERSEY) LINEUP CARD */}
              <div className="bg-slate-950/90 rounded-2xl border border-sky-500/50 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-sky-400 shadow-sm"></span>
                    <h5 className="font-black text-sky-300 text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5">
                      <span>🔵 {teamBName}</span>
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded border border-sky-500/40">Blue Jersey</span>
                    </h5>
                  </div>
                  {winner === 'teamB' ? (
                    <span className="px-2 py-0.5 bg-sky-600 text-white text-xs font-black rounded-lg shadow">
                      🏆 WIN (+1.0 PTS)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-sky-400">
                      {teamBPlayers.length} Players Assigned
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {teamBPlayers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      No players assigned to {teamBName} (Blue Jersey).
                    </div>
                  ) : (
                    teamBPlayers.map(({ player, record }) => {
                      const fName = formatPlayerName(player.name);
                      let pts = 0;
                      if (record.attendance) pts += 0.5;
                      if (record.win) pts += 1.0;
                      if (record.onTime) pts += 1.0;
                      if (record.penalty) pts -= record.penalty;

                      return (
                        <div
                          key={player.id}
                          className="p-2.5 bg-sky-950/20 border border-sky-500/30 rounded-xl flex items-center justify-between text-xs hover:border-sky-400/50 transition"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {player.avatar ? (
                              <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full object-cover border border-sky-500/40 shrink-0" />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-sky-900/60 border border-sky-700/60 text-sky-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {fName.charAt(0)}
                              </span>
                            )}
                            <span className="font-bold text-white truncate">{fName}</span>
                            {record.goals > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
                                ⚽ {record.goals}
                              </span>
                            )}
                            {record.onTime && (
                              <span className="text-[10px] text-emerald-400 font-bold" title="On-Time">⏰</span>
                            )}
                            {record.win && (
                              <span className="text-[10px] text-sky-400 font-bold" title="Match Win">🏆</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="font-black text-sky-400">
                              +{pts.toFixed(1)} pts
                            </span>
                            {onAssignPlayerTeam && (
                              <button
                                type="button"
                                onClick={() => onAssignPlayerTeam(match.id, player.id, undefined)}
                                className="text-slate-500 hover:text-sky-400 p-0.5 rounded cursor-pointer transition"
                                title={`Remove ${fName} from ${teamBName}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Quick Click-to-Add Player to Active Team Section */}
            {onAssignPlayerTeam && (
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      🎯 Active Target:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamTarget('teamA')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedTeamTarget === 'teamA'
                          ? 'bg-rose-600 text-white ring-2 ring-rose-300 shadow'
                          : 'bg-slate-800 text-rose-300 hover:bg-slate-700 border border-rose-500/30'
                      }`}
                    >
                      <span>🔴 {teamAName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamTarget('teamB')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedTeamTarget === 'teamB'
                          ? 'bg-sky-600 text-white ring-2 ring-sky-300 shadow'
                          : 'bg-slate-800 text-sky-300 hover:bg-slate-700 border border-sky-500/30'
                      }`}
                    >
                      <span>🔵 {teamBName}</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    💡 Click any player below to assign them to {selectedTeamTarget === 'teamA' ? `🔴 ${teamAName}` : `🔵 ${teamBName}`}
                  </span>
                </div>

                {/* Available / Unassigned Players to Click-Add */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold block">
                    Click player to add to {selectedTeamTarget === 'teamA' ? `🔴 ${teamAName}` : `🔵 ${teamBName}`}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    {leagueData.players
                      .filter(p => {
                        const rec = matchRes[p.id];
                        return !rec?.team || rec.team !== selectedTeamTarget;
                      })
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => {
                        const rec = matchRes[p.id];
                        const inOtherTeam = rec?.team && rec.team !== selectedTeamTarget;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => onAssignPlayerTeam(match.id, p.id, selectedTeamTarget)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                              inOtherTeam
                                ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-amber-400 hover:text-white'
                                : rec?.attendance
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                            }`}
                            title={`Click to add ${p.name} to ${selectedTeamTarget === 'teamA' ? teamAName : teamBName}`}
                          >
                            <span>+ {formatPlayerName(p.name)}</span>
                            {inOtherTeam && (
                              <span className="text-[9px] opacity-70">
                                ({rec.team === 'teamA' ? '🔴 Team 1' : '🔵 Team 2'})
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Unassigned Attending Players (if any) */}
            {unassignedPlayers.length > 0 && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 block">
                    Other Attending Players ({unassignedPlayers.length}):
                  </span>
                  <span className="text-[10px] text-slate-500 italic">
                    Click to add to {selectedTeamTarget === 'teamA' ? `🔴 ${teamAName}` : `🔵 ${teamBName}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedPlayers.map(({ player, record }) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => onAssignPlayerTeam && onAssignPlayerTeam(match.id, player.id, selectedTeamTarget)}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-800 hover:border-amber-400 transition cursor-pointer flex items-center gap-1"
                      title={`Click to assign ${player.name} to ${selectedTeamTarget === 'teamA' ? teamAName : teamBName}`}
                    >
                      <span>+ {formatPlayerName(player.name)}</span>
                      {record.win && <span>🏆</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. HEAD-TO-HEAD COMPARISON VIEW                                           */}
        {/* ========================================================================= */}
        {!isPrintView && viewTab === 'h2h' && (
          <div className="space-y-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              Head-to-Head Team Statistics
            </h4>

            <div className="space-y-4 max-w-xl mx-auto">
              {/* Squad Size Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">🔴 {teamAName}: {teamAPlayers.length} Players</span>
                  <span className="text-slate-400">Squad Size</span>
                  <span className="text-sky-400">🔵 {teamBName}: {teamBPlayers.length} Players</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
                  <div 
                    style={{ width: `${(teamAPlayers.length + teamBPlayers.length) > 0 ? (teamAPlayers.length / (teamAPlayers.length + teamBPlayers.length)) * 100 : 50}%` }} 
                    className="bg-rose-500 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${(teamAPlayers.length + teamBPlayers.length) > 0 ? (teamBPlayers.length / (teamAPlayers.length + teamBPlayers.length)) * 100 : 50}%` }} 
                    className="bg-sky-500 h-full transition-all"
                  />
                </div>
              </div>

              {/* Goals Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">🔴 {teamAGoalsCount} Goals</span>
                  <span className="text-slate-400">Goals Scored</span>
                  <span className="text-sky-400">🔵 {teamBGoalsCount} Goals</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
                  <div 
                    style={{ width: `${(teamAGoalsCount + teamBGoalsCount) > 0 ? (teamAGoalsCount / (teamAGoalsCount + teamBGoalsCount)) * 100 : 50}%` }} 
                    className="bg-rose-500 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${(teamAGoalsCount + teamBGoalsCount) > 0 ? (teamBGoalsCount / (teamAGoalsCount + teamBGoalsCount)) * 100 : 50}%` }} 
                    className="bg-sky-500 h-full transition-all"
                  />
                </div>
              </div>

              {/* On-Time Arrival Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">🔴 {teamAOnTimeCount} ({teamAPlayers.length > 0 ? Math.round((teamAOnTimeCount / teamAPlayers.length) * 100) : 0}%)</span>
                  <span className="text-slate-400">On-Time Arrivals</span>
                  <span className="text-sky-400">🔵 {teamBOnTimeCount} ({teamBPlayers.length > 0 ? Math.round((teamBOnTimeCount / teamBPlayers.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
                  <div 
                    style={{ width: `${(teamAOnTimeCount + teamBOnTimeCount) > 0 ? (teamAOnTimeCount / (teamAOnTimeCount + teamBOnTimeCount)) * 100 : 50}%` }} 
                    className="bg-rose-500 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${(teamAOnTimeCount + teamBOnTimeCount) > 0 ? (teamBOnTimeCount / (teamAOnTimeCount + teamBOnTimeCount)) * 100 : 50}%` }} 
                    className="bg-sky-500 h-full transition-all"
                  />
                </div>
              </div>

              {/* Match Points Generated */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">🔴 +{teamATotalPoints.toFixed(1)} pts</span>
                  <span className="text-slate-400">Total Points Generated</span>
                  <span className="text-sky-400">🔵 +{teamBTotalPoints.toFixed(1)} pts</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
                  <div 
                    style={{ width: `${(teamATotalPoints + teamBTotalPoints) > 0 ? (teamATotalPoints / (teamATotalPoints + teamBTotalPoints)) * 100 : 50}%` }} 
                    className="bg-rose-500 h-full transition-all"
                  />
                  <div 
                    style={{ width: `${(teamATotalPoints + teamBTotalPoints) > 0 ? (teamBTotalPoints / (teamATotalPoints + teamBTotalPoints)) * 100 : 50}%` }} 
                    className="bg-sky-500 h-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. FULL LEAGUE TABLE VIEW (Active in Table tab)                           */}
        {/* ========================================================================= */}
        {viewTab === 'table' && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold text-center w-10">#</th>
                    <th className="py-2.5 px-3 font-bold">Player Name</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">Team / Jersey</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">Att (+0.5)</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">Win (+1.0)</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">On-Time (+1.0)</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">Goals</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">OG</th>
                    <th className="py-2.5 px-2.5 font-bold text-center">Pen</th>
                    <th className="py-2.5 px-3 font-bold text-right">Match Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {displayedPlayers.map((player, idx) => {
                    const r = matchRes[player.id] || {
                      attendance: false,
                      win: false,
                      onTime: false,
                      penalty: 0,
                      goals: 0,
                      ownGoals: 0,
                    };

                    let score = 0;
                    if (r.attendance) score += 0.5;
                    if (r.win) score += 1.0;
                    if (r.onTime) score += 1.0;
                    if (r.penalty) score -= r.penalty;

                    const formattedName = formatPlayerName(player.name);

                    return (
                      <tr 
                        key={player.id} 
                        className={idx % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-900/80' : 'bg-slate-950/40 hover:bg-slate-900/80'}
                      >
                        <td className="py-2 px-3 text-center font-bold text-slate-500 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-white">
                          {formattedName}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold">
                          {r.team === 'teamA' ? (
                            <span className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40 font-black text-[10px] inline-flex items-center gap-1">
                              <span>🔴</span>
                              <span>{teamAName} (Red)</span>
                            </span>
                          ) : r.team === 'teamB' ? (
                            <span className="text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/40 font-black text-[10px] inline-flex items-center gap-1">
                              <span>🔵</span>
                              <span>{teamBName} (Blue)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold">
                          {r.attendance ? (
                            <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              ✓ Attended
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold">
                          {r.win ? (
                            <span className="text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                              🏆 Win
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold">
                          {r.onTime ? (
                            <span className="text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/30">
                              ⏰ On-Time
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black text-emerald-400">
                          {r.goals > 0 ? r.goals : '0'}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold text-red-400">
                          {r.ownGoals > 0 ? r.ownGoals : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold text-red-400">
                          {r.penalty > 0 ? `-${r.penalty}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-xs">
                          <span className={score > 0 ? 'text-amber-400 font-bold' : score < 0 ? 'text-red-500' : 'text-slate-400'}>
                            {score > 0 ? `+${score.toFixed(1)}` : `${score.toFixed(1)}`} Pts
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    )}

        {/* ========================================================================= */}
        {/* MODAL FOOTER ACTIONS (Hidden in Print View)                               */}
        {/* ========================================================================= */}
        {!isPrintView && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800 no-print">
            <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap gap-2">
              <button
                onClick={() => onExportExcel(match)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => onExportPDF(match)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
              >
                <FileText className="w-3.5 h-3.5 text-red-100" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print A4 Sheet</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-2">
              {isAdmin && Object.keys(matchRes).length > 0 && onResetMatchResults && (
                <button
                  onClick={() => {
                    onResetMatchResults(match.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 transition flex items-center space-x-1 cursor-pointer"
                  title="Clear all recorded player results for this match"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Results</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRecord(match.id);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center space-x-1 cursor-pointer active:scale-95 shadow"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Match Sheet</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

