import React, { useState } from 'react';
import { Award, FileSpreadsheet, FileText, AlertTriangle, Search, Info, TrendingUp, Printer, Check, X, Eye, EyeOff } from 'lucide-react';
import { formatPlayerName } from '../constants';
import { LeagueData, PlayerStanding } from '../types';
import { computeStandings } from '../utils/stats';
import { FFLogo } from './FFLogo';

interface StandingsViewProps {
  leagueData: LeagueData;
  isAdmin: boolean;
  onOpenPlayerDetail: (playerId: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenResetModal: () => void;
  onOpenAdminUnlock?: (actionName?: string) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  leagueData,
  isAdmin,
  onOpenPlayerDetail,
  onExportExcel,
  onExportPDF,
  onOpenResetModal,
  onOpenAdminUnlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showAvatarsInPrint, setShowAvatarsInPrint] = useState(true);
  const [showSummaryStatsInPrint, setShowSummaryStatsInPrint] = useState(true);
  const [isCompactPrint, setIsCompactPrint] = useState(false);

  const standings = computeStandings(leagueData);

  const filteredStandings = standings.filter(item => {
    if (!searchQuery.trim()) return true;
    return item.player.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  // Calculate league KPIs for print summary
  let totalAttendances = 0;
  let totalWins = 0;
  let totalOnTimes = 0;
  let totalGoalsScored = 0;

  standings.forEach(item => {
    totalAttendances += item.attendanceCount;
    totalWins += item.matchWins;
    totalOnTimes += item.onTimeCount;
    totalGoalsScored += item.totalGoals;
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* OFFICIAL PRINT-ONLY HEADER (Automatically renders at top of A4 printout) */}
      {/* ========================================================================= */}
      <div className="print-only mb-4">
        <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl border border-amber-600">
              ⚽
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight leading-tight">
                Friday Football League 2.0
              </h1>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Official League Standings • Season: 14 Aug 2026 – 27 Nov 2026 (15 Match Weeks)
              </p>
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-700 font-medium">
            <div><strong>{leagueData.players.length}</strong> Registered Competitors</div>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded p-2 text-[9.5px] text-slate-800 mb-3 flex items-center justify-between">
          <span>
            <strong>Best 13 Results Rule Applied:</strong> Lowest match points are excluded (2 excluded if 15 played, 1 excluded if 14 played). Max 2.5 pts/match.
          </span>
          <span className="font-bold text-slate-700">Ties: Wins &gt; On-Time &gt; Attendances &gt; Goals</span>
        </div>

        {/* Print KPI Summary Grid */}
        {showSummaryStatsInPrint && (
          <div className="grid grid-cols-4 gap-2 mb-3 text-[9px]">
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Attendances</span>
              <span className="font-black text-slate-950 text-xs">{totalAttendances}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Match Wins</span>
              <span className="font-black text-amber-800 text-xs">{totalWins}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Goals Scored</span>
              <span className="font-black text-emerald-800 text-xs">{totalGoalsScored}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">On-Time Bonuses</span>
              <span className="font-black text-blue-800 text-xs">{totalOnTimes}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED A4 PRINT MODE BANNER & TOOLBAR (When in interactive Print View) */}
      {/* ========================================================================= */}
      {isPrintMode && (
        <div className="no-print bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>A4 Print View Mode</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Clean Sheet Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive UI buttons, search bars, and noise are stripped for a clean A4 printout.
                </p>
              </div>
            </div>

            {/* Print Mode Action Buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF (Ctrl+P)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintMode(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Exit Print View</span>
              </button>
            </div>
          </div>

          {/* Quick Print Formatting Options */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Print Options:</span>

            <button
              type="button"
              onClick={() => setShowAvatarsInPrint(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                showAvatarsInPrint
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showAvatarsInPrint ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Player Avatars: {showAvatarsInPrint ? 'Visible' : 'Hidden'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSummaryStatsInPrint(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                showSummaryStatsInPrint
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>KPI Summary Cards: {showSummaryStatsInPrint ? 'Included' : 'Excluded'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCompactPrint(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                isCompactPrint
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>Density: {isCompactPrint ? 'Compact (1-2 pages)' : 'Standard'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDARD DASHBOARD CONTROLS (Hidden during print or interactive print view) */}
      {/* ========================================================================= */}
      {!isPrintMode && (
        <>
          {/* Top Notification / Rule Summary Banner */}
          <div className="no-print bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>League 2.0 Active (14 Aug 2026 – 27 Nov 2026)</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    15 Match Weeks
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  <strong className="text-amber-400 font-bold">Best 13 Results Rule Applied:</strong> Lowest match results are excluded (2 excluded if 15 played, 1 excluded if 14 played). Max 2.5 pts/match.
                </p>
              </div>
            </div>

            {/* Global Export, Print & Reset Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              <button
                onClick={() => setIsPrintMode(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl font-black transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="Toggle clean A4 printer-friendly view"
              >
                <Printer className="w-4 h-4" />
                <span>A4 Print View</span>
              </button>

              <button
                onClick={onExportExcel}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl font-bold transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="Export official standings to Excel (CSV)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={onExportPDF}
                className="text-xs bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl font-bold transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="Generate printable PDF report"
              >
                <FileText className="w-4 h-4 text-red-100" />
                <span>Export PDF</span>
              </button>

              {isAdmin ? (
                <button
                  onClick={onOpenResetModal}
                  className="text-xs bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 px-3 py-2 rounded-xl font-bold transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
                  title="Reset match data"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Reset Data</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAdminUnlock && onOpenAdminUnlock('reset match data')}
                  className="text-xs bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 px-3 py-2 rounded-xl font-medium transition shadow flex items-center space-x-1.5 cursor-pointer"
                  title="Admin login required to reset data"
                >
                  <AlertTriangle className="w-4 h-4 text-slate-500" />
                  <span>Reset (Admin)</span>
                </button>
              )}
            </div>
          </div>

          {/* Standings Header & Search Filter */}
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center">
                <Award className="w-6 h-6 text-amber-400 mr-2.5 shrink-0" />
                <span>Official League Standings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ranked by Total Points (Best 13 Rule). Tie-breakers: Match Wins, On-Time Bonuses, Attendances, Goals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player in table..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                  <strong className="font-black text-amber-400">{leagueData.players.length}</strong> Registered Players
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ULTRA-COMPACT LEAGUE LEADERS, TOP SCORER & MOST ON-TIME SPOTLIGHT         */}
          {/* ========================================================================= */}
          {standings.length >= 3 && !searchQuery.trim() && (() => {
            const maxGoals = Math.max(...standings.map(s => s.totalGoals), 0);
            const topScorers = maxGoals > 0 ? standings.filter(s => s.totalGoals === maxGoals) : (standings.length > 0 ? [standings[0]] : []);
            const primaryTopScorer = topScorers[0];
            const isTopScorerTied = topScorers.length > 1;

            const maxOnTime = Math.max(...standings.map(s => s.onTimeCount), 0);
            const topOnTimePlayers = maxOnTime > 0 ? standings.filter(s => s.onTimeCount === maxOnTime) : (standings.length > 0 ? [standings[0]] : []);
            const primaryOnTimePlayer = topOnTimePlayers[0];
            const isOnTimeTied = topOnTimePlayers.length > 1;

            return (
              <div className="no-print">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
                  {/* 1st Place (Gold Champion) */}
                  {standings[0] && (
                    <div
                      onClick={() => onOpenPlayerDetail(standings[0].player.id)}
                      className="relative rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/70 hover:border-amber-400 transition-all duration-150 cursor-pointer shadow-md shadow-amber-950/20 group hover:scale-[1.01] flex flex-col items-center text-center"
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5 whitespace-nowrap">
                        <span>👑</span>
                        <span>#1 LEADER</span>
                      </div>

                      {/* Small Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-amber-400 shadow bg-slate-800 flex items-center justify-center text-amber-400 font-black text-sm shrink-0 mt-0.5 mb-1 group-hover:scale-105 transition">
                        {standings[0].player.avatar ? (
                          <img
                            src={standings[0].player.avatar}
                            alt={standings[0].player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formatPlayerName(standings[0].player.name).charAt(0)}</span>
                        )}
                      </div>

                      {/* Name & Points */}
                      <h4 className="text-[11px] sm:text-xs font-bold text-amber-300 group-hover:text-amber-200 transition truncate max-w-full leading-tight">
                        {formatPlayerName(standings[0].player.name)}
                      </h4>
                      <div className="mt-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[11px]">
                        <span className="text-[9px] text-amber-400/80 mr-0.5 font-semibold">Best 13:</span>
                        <span>{standings[0].best13Points.toFixed(1)}</span>
                        <span className="text-[8px] text-amber-400/70 ml-0.5">pts</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-medium">
                        <span className="text-amber-400 font-bold">{standings[0].matchWins}W</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{standings[0].totalGoals}G</span>
                        <span>•</span>
                        <span>{standings[0].matchesPlayed} Pl</span>
                      </div>
                    </div>
                  )}

                  {/* 2nd Place (Silver) */}
                  {standings[1] && (
                    <div
                      onClick={() => onOpenPlayerDetail(standings[1].player.id)}
                      className="relative rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-950 border border-slate-400/40 hover:border-slate-300 transition-all duration-150 cursor-pointer shadow-sm group hover:scale-[1.01] flex flex-col items-center text-center"
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-slate-800 border border-slate-400 text-slate-200 text-[9px] font-black shadow flex items-center gap-0.5 whitespace-nowrap">
                        <span>🥈</span>
                        <span>#2 RANK</span>
                      </div>

                      {/* Small Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-slate-300/80 shadow bg-slate-800 flex items-center justify-center text-slate-300 font-black text-sm shrink-0 mt-0.5 mb-1 group-hover:border-white transition">
                        {standings[1].player.avatar ? (
                          <img
                            src={standings[1].player.avatar}
                            alt={standings[1].player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formatPlayerName(standings[1].player.name).charAt(0)}</span>
                        )}
                      </div>

                      {/* Name & Points */}
                      <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-slate-200 transition truncate max-w-full leading-tight">
                        {formatPlayerName(standings[1].player.name)}
                      </h4>
                      <div className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-800/90 border border-slate-700 text-slate-200 font-black text-[11px]">
                        <span className="text-[9px] text-slate-400 mr-0.5 font-semibold">Best 13:</span>
                        <span>{standings[1].best13Points.toFixed(1)}</span>
                        <span className="text-[8px] text-slate-400 ml-0.5">pts</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-medium">
                        <span className="text-slate-300 font-bold">{standings[1].matchWins}W</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{standings[1].totalGoals}G</span>
                        <span>•</span>
                        <span>{standings[1].matchesPlayed} Pl</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place (Bronze) */}
                  {standings[2] && (
                    <div
                      onClick={() => onOpenPlayerDetail(standings[2].player.id)}
                      className="relative rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border border-amber-700/40 hover:border-amber-600 transition-all duration-150 cursor-pointer shadow-sm group hover:scale-[1.01] flex flex-col items-center text-center"
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-slate-800 border border-amber-700 text-amber-500 text-[9px] font-black shadow flex items-center gap-0.5 whitespace-nowrap">
                        <span>🥉</span>
                        <span>#3 RANK</span>
                      </div>

                      {/* Small Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-amber-700/80 shadow bg-slate-800 flex items-center justify-center text-amber-600 font-black text-sm shrink-0 mt-0.5 mb-1 group-hover:border-amber-500 transition">
                        {standings[2].player.avatar ? (
                          <img
                            src={standings[2].player.avatar}
                            alt={standings[2].player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formatPlayerName(standings[2].player.name).charAt(0)}</span>
                        )}
                      </div>

                      {/* Name & Points */}
                      <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-400 transition truncate max-w-full leading-tight">
                        {formatPlayerName(standings[2].player.name)}
                      </h4>
                      <div className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-800/90 border border-slate-700 text-amber-500 font-black text-[11px]">
                        <span className="text-[9px] text-slate-400 mr-0.5 font-semibold">Best 13:</span>
                        <span>{standings[2].best13Points.toFixed(1)}</span>
                        <span className="text-[8px] text-slate-400 ml-0.5">pts</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-medium">
                        <span className="text-slate-300 font-bold">{standings[2].matchWins}W</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{standings[2].totalGoals}G</span>
                        <span>•</span>
                        <span>{standings[2].matchesPlayed} Pl</span>
                      </div>
                    </div>
                  )}

                  {/* Top Goal Scorer (Golden Boot Spotlight) */}
                  {primaryTopScorer && (
                    <div
                      onClick={() => onOpenPlayerDetail(primaryTopScorer.player.id)}
                      className="relative rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/50 hover:border-emerald-400 transition-all duration-150 cursor-pointer shadow-md shadow-emerald-950/20 group hover:scale-[1.01] flex flex-col items-center text-center"
                    >
                      {/* Top Scorer Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5 whitespace-nowrap">
                        <span>⚽</span>
                        <span>TOP SCORER</span>
                        {isTopScorerTied && <span className="text-[8px] bg-slate-950/50 text-white px-0.5 rounded">TIED</span>}
                      </div>

                      {/* Small Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-emerald-400 shadow bg-slate-800 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0 mt-0.5 mb-1 group-hover:border-emerald-300 transition">
                        {primaryTopScorer.player.avatar ? (
                          <img
                            src={primaryTopScorer.player.avatar}
                            alt={primaryTopScorer.player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formatPlayerName(primaryTopScorer.player.name).charAt(0)}</span>
                        )}
                      </div>

                      {/* Name & Goals */}
                      <h4 className="text-[11px] sm:text-xs font-bold text-emerald-300 group-hover:text-emerald-200 transition truncate max-w-full leading-tight">
                        {formatPlayerName(primaryTopScorer.player.name)}
                      </h4>
                      <div className="mt-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[11px]">
                        <span className="font-black text-white mr-0.5">{primaryTopScorer.totalGoals}</span>
                        <span className="text-[9px] font-bold text-emerald-300">{primaryTopScorer.totalGoals === 1 ? 'Goal' : 'Goals'}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-medium">
                        <span className="text-emerald-400 font-bold">Golden Boot</span>
                        <span>•</span>
                        <span>{primaryTopScorer.matchesPlayed} Pl</span>
                        {isTopScorerTied && <span>• ({topScorers.length} tied)</span>}
                      </div>
                    </div>
                  )}

                  {/* Most On-Time Player (Punctuality Leader) */}
                  {primaryOnTimePlayer && (
                    <div
                      onClick={() => onOpenPlayerDetail(primaryOnTimePlayer.player.id)}
                      className="relative rounded-xl p-2 sm:p-2.5 bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/50 hover:border-sky-400 transition-all duration-150 cursor-pointer shadow-md shadow-sky-950/20 group hover:scale-[1.01] flex flex-col items-center text-center col-span-2 sm:col-span-1"
                    >
                      {/* On-Time Badge */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-sky-500 to-blue-400 text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5 whitespace-nowrap">
                        <span>⏱️</span>
                        <span>ON-TIME</span>
                        {isOnTimeTied && <span className="text-[8px] bg-slate-950/50 text-white px-0.5 rounded">TIED</span>}
                      </div>

                      {/* Small Avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-sky-400 shadow bg-slate-800 flex items-center justify-center text-sky-400 font-black text-sm shrink-0 mt-0.5 mb-1 group-hover:border-sky-300 transition">
                        {primaryOnTimePlayer.player.avatar ? (
                          <img
                            src={primaryOnTimePlayer.player.avatar}
                            alt={primaryOnTimePlayer.player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formatPlayerName(primaryOnTimePlayer.player.name).charAt(0)}</span>
                        )}
                      </div>

                      {/* Name & On-Time */}
                      <h4 className="text-[11px] sm:text-xs font-bold text-sky-300 group-hover:text-sky-200 transition truncate max-w-full leading-tight">
                        {formatPlayerName(primaryOnTimePlayer.player.name)}
                      </h4>
                      <div className="mt-0.5 px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-black text-[11px]">
                        <span className="font-black text-white mr-0.5">{primaryOnTimePlayer.onTimeCount}</span>
                        <span className="text-[9px] font-bold text-sky-300">On-Time</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-medium">
                        <span className="text-sky-400 font-bold">Punctual</span>
                        <span>•</span>
                        <span>{primaryOnTimePlayer.matchesPlayed} Pl</span>
                        {isOnTimeTied && <span>• ({topOnTimePlayers.length} tied)</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ========================================================================= */}
      {/* REFORMATTED STANDINGS TABLE (Optimized for both screen & clean A4 print)   */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl overflow-hidden shadow-2xl border ${
        isPrintMode 
          ? 'bg-white text-slate-900 border-slate-300 p-4 sm:p-6' 
          : 'glass-panel border-slate-800'
      }`}>
        {/* Document header when previewing in Print Mode on screen */}
        {isPrintMode && (
          <div className="no-print mb-4 pb-4 border-b-2 border-amber-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FFLogo className="w-12 h-14 shrink-0" />
                <div>
                  <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                    Friday Football League 2.0 • Standings
                  </h2>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Season: 14 Aug 2026 – 27 Nov 2026 • 15 Match Weeks
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="font-bold text-slate-900">{leagueData.players.length} Competitors</div>
                <div>A4 Print Preview</div>
              </div>
            </div>

            {/* KPI Summary Strip in Print Preview */}
            {showSummaryStatsInPrint && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Attendances</div>
                  <div className="text-base font-black text-slate-900">{totalAttendances}</div>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[10px] text-amber-800 font-bold uppercase">Match Wins</div>
                  <div className="text-base font-black text-amber-900">{totalWins}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Goals Scored</div>
                  <div className="text-base font-black text-emerald-900">{totalGoalsScored}</div>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[10px] text-blue-800 font-bold uppercase">On-Time Bonuses</div>
                  <div className="text-base font-black text-blue-900">{totalOnTimes}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MOBILE CONDENSED STANDINGS ROWS (< md screens)                            */}
        {/* ========================================================================= */}
        <div className={`md:hidden ${isPrintMode ? 'hidden' : 'block'} divide-y divide-slate-800/40`}>
          {filteredStandings.map((item) => {
            const formattedName = formatPlayerName(item.player.name);
            const rank = item.rank || 1;

            let rankBadge = (
              <span className="text-[11px] font-bold text-slate-400 w-6 text-center">#{rank}</span>
            );
            if (rank === 1) {
              rankBadge = (
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-black text-[10px] flex items-center justify-center border border-amber-500/40">
                  1
                </span>
              );
            } else if (rank === 2) {
              rankBadge = (
                <span className="w-5 h-5 rounded-md bg-slate-400/20 text-slate-200 font-black text-[10px] flex items-center justify-center border border-slate-400/40">
                  2
                </span>
              );
            } else if (rank === 3) {
              rankBadge = (
                <span className="w-5 h-5 rounded-md bg-amber-700/20 text-amber-500 font-black text-[10px] flex items-center justify-center border border-amber-700/40">
                  3
                </span>
              );
            }

            return (
              <div
                key={item.player.id}
                onClick={() => onOpenPlayerDetail(item.player.id)}
                className="flex items-center justify-between py-2 px-3 hover:bg-slate-900/60 transition active:bg-slate-800/80 cursor-pointer gap-2"
              >
                {/* Left: Rank, Avatar, Name & Micro-Stats */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className="shrink-0 flex items-center justify-center">
                    {rankBadge}
                  </div>
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {item.player.avatar ? (
                      <img src={item.player.avatar} alt={item.player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{formattedName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate leading-tight">
                      {formattedName}
                    </h4>
                    {/* Micro-metrics visible at a glance */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                      <span>{item.matchesPlayed}P</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{item.matchWins}W</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{item.totalGoals}G</span>
                      <span>•</span>
                      <span className="text-sky-400 font-semibold">{item.onTimeCount}OT</span>
                      {item.totalPenalties > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-semibold">-{item.totalPenalties}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Best 13 Points Badge */}
                <div className="shrink-0 text-right pl-2">
                  <div className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs shadow-sm flex items-baseline gap-0.5">
                    <span>{item.best13Points.toFixed(1)}</span>
                    <span className="text-[9px] text-amber-400/70 font-semibold">pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP & PRINT STANDINGS TABLE (>= md screens or Print Mode)             */}
        {/* ========================================================================= */}
        <div className={`${isPrintMode ? 'block' : 'hidden md:block'} overflow-x-auto`}>
          <table className={`w-full text-left border-collapse ${isCompactPrint ? 'text-xs' : 'text-sm'}`}>
            <thead>
              <tr className={`${
                isPrintMode 
                  ? 'bg-slate-950 text-white' 
                  : 'bg-slate-900/90 text-slate-400'
              } text-xs uppercase tracking-wider border-b border-slate-800`}>
                <th className="py-3 px-3 font-bold text-center w-12 sm:w-16">Rank</th>
                <th className="py-3 px-4 font-bold">Player Name</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Matches Played (P)">P</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Match Wins (W)">W</th>
                <th className="py-3 px-2.5 font-bold text-center" title="On-Time Bonuses">On-Time</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Attendances">Att.</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Goals Scored">Goals</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Own Goals (OG)">OG</th>
                <th className="py-3 px-2.5 font-bold text-center" title="Penalties (Deductions)">Pen.</th>
                <th className="py-3 px-3 font-bold text-right" title="Raw Total Points Accumulated">Raw Pts</th>
                <th className={`py-3 px-4 font-bold text-right ${isPrintMode ? 'text-amber-300' : 'text-amber-400'}`} title="Official League Points (Best 13 Matches)">
                  Best 13 Pts
                </th>
                <th className="py-3 px-3 font-bold text-center no-print w-16">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isPrintMode ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {filteredStandings.map((item) => {
                const formattedName = formatPlayerName(item.player.name);
                const rank = item.rank || 1;

                let rankBadge = (
                  <span className={`font-bold ${isPrintMode ? 'text-slate-600' : 'text-slate-400'}`}>#{rank}</span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <span className="print-rank-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black border border-amber-500/40 text-xs">
                      #1 🏆
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="print-rank-2 px-2 py-0.5 rounded bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-xs">
                      #2 🥈
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="print-rank-3 px-2 py-0.5 rounded bg-amber-700/20 text-amber-600 font-black border border-amber-700/40 text-xs">
                      #3 🥉
                    </span>
                  );
                }

                let avatarBorderClass = "border border-slate-700";
                if (rank === 1) {
                  avatarBorderClass = "border-2 border-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50";
                } else if (rank === 2) {
                  avatarBorderClass = "border-2 border-slate-300 shadow-sm ring-1 ring-slate-300/50";
                } else if (rank === 3) {
                  avatarBorderClass = "border-2 border-amber-700 shadow-sm ring-1 ring-amber-700/40";
                }

                return (
                  <tr
                    key={item.player.id}
                    className={`transition-colors ${
                      isPrintMode
                        ? rank % 2 === 0 ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-50'
                        : 'hover:bg-slate-900/60 group'
                    }`}
                  >
                    <td className={`py-2.5 px-3 text-center font-bold`}>{rankBadge}</td>
                    
                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-3">
                        {showAvatarsInPrint && (
                          item.player.avatar ? (
                            <img
                              src={item.player.avatar}
                              alt={item.player.name}
                              className={`w-8 h-8 rounded-xl object-cover shrink-0 ${avatarBorderClass}`}
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${avatarBorderClass} ${
                              isPrintMode 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'bg-slate-800 text-amber-400'
                            }`}>
                              {formattedName.charAt(0)}
                            </div>
                          )
                        )}
                        <span
                          onClick={() => onOpenPlayerDetail(item.player.id)}
                          className={`font-bold tracking-wide transition ${
                            isPrintMode 
                              ? 'text-slate-950 hover:text-amber-700 cursor-pointer' 
                              : 'text-white hover:text-amber-400 cursor-pointer'
                          }`}
                        >
                          {formattedName}
                        </span>
                      </div>
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-slate-800' : 'text-slate-200'}`}>
                      {item.matchesPlayed}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-amber-800' : 'text-amber-400'}`}>
                      {item.matchWins}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      {item.onTimeCount}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      {item.attendanceCount}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      {item.totalGoals}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-bold ${isPrintMode ? 'text-red-800' : 'text-red-400'}`}>
                      {item.totalOwnGoals}
                    </td>

                    <td className="py-2.5 px-2.5 text-center">
                      {item.totalPenalties > 0 ? (
                        <span className={`font-black px-1.5 py-0.5 rounded text-xs ${
                          isPrintMode
                            ? 'text-red-700 bg-red-100 border border-red-300'
                            : 'text-red-500 bg-red-500/10 border border-red-500/30'
                        }`}>
                          -{item.totalPenalties}
                        </span>
                      ) : (
                        <span className={`font-medium ${isPrintMode ? 'text-slate-400' : 'text-slate-500'}`}>0</span>
                      )}
                    </td>

                    <td className={`py-2.5 px-3 text-right font-bold ${isPrintMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {item.rawPoints.toFixed(1)}
                    </td>

                    <td className={`py-2.5 px-4 text-right font-black text-base ${
                      isPrintMode ? 'text-slate-950 font-black' : 'text-amber-400'
                    }`}>
                      {item.best13Points.toFixed(1)}
                    </td>

                    <td className="py-2.5 px-3 text-center no-print">
                      <button
                        onClick={() => onOpenPlayerDetail(item.player.id)}
                        className="p-1.5 bg-slate-800 hover:bg-amber-600/30 hover:text-amber-300 text-slate-300 rounded-lg transition text-xs flex items-center justify-center mx-auto cursor-pointer"
                        title="View Player Season History"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStandings.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-600 mb-3 text-xl">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-slate-300 font-bold text-sm">No matching players found.</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query.</p>
          </div>
        )}

        {/* Printout Official Footer */}
        <div className="print-only mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[8.5px] text-slate-600">
          <div>Friday Football League 2.0 • Official Standings Document</div>
          <div>All points computed via Best 13 rule engine</div>
        </div>
      </div>
    </div>
  );
};

