import React, { useState } from 'react';
import { Calendar, PlusCircle, Eye, Edit3, CheckCircle2, Clock, Lock, Plus, CalendarDays, Printer, X, Check, EyeOff, FileText } from 'lucide-react';
import { LeagueData, Match, PlayerMatchRecord } from '../types';
import { getDayOfWeekName } from '../constants';
import { FFLogo } from './FFLogo';

interface MatchesViewProps {
  leagueData: LeagueData;
  isAdmin: boolean;
  onOpenRecordMatch: (matchId?: number) => void;
  onOpenMatchDetail: (matchId: number, initialPrint?: boolean) => void;
  onOpenAddMatch: () => void;
  onOpenEditMatch: (match: Match) => void;
  onOpenAdminUnlock?: (actionName?: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  leagueData,
  isAdmin,
  onOpenRecordMatch,
  onOpenMatchDetail,
  onOpenAddMatch,
  onOpenEditMatch,
  onOpenAdminUnlock,
}) => {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printLayout, setPrintLayout] = useState<'table' | 'cards'>('table');
  const [showSummaryStatsInPrint, setShowSummaryStatsInPrint] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'upcoming'>('all');

  // Compute League KPI totals across matches
  const totalMatches = leagueData.matches.length;
  let completedMatchesCount = 0;
  let totalAttendancesAcrossSeason = 0;
  let totalGoalsAcrossSeason = 0;
  let totalOnTimesAcrossSeason = 0;

  leagueData.matches.forEach(m => {
    if (m.completed) completedMatchesCount++;
    const res = leagueData.matchResults[m.id] || {};
    Object.values(res).forEach((r: PlayerMatchRecord) => {
      if (r.attendance) totalAttendancesAcrossSeason++;
      if (r.goals) totalGoalsAcrossSeason += Number(r.goals) || 0;
      if (r.onTime) totalOnTimesAcrossSeason++;
    });
  });

  const avgAttendance = completedMatchesCount > 0 
    ? (totalAttendancesAcrossSeason / completedMatchesCount).toFixed(1) 
    : '0';

  const filteredMatches = leagueData.matches.filter(m => {
    if (statusFilter === 'completed') return m.completed;
    if (statusFilter === 'upcoming') return !m.completed;
    return true;
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
            <FFLogo className="w-11 h-13 shrink-0 drop-shadow-sm" />
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight leading-tight">
                Friday Football League 2.0
              </h1>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Official Season Match Schedule & Results • Season: 14 Aug 2026 – 27 Nov 2026
              </p>
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-700 font-medium">
            <div><strong>{totalMatches}</strong> Scheduled Match Weeks ({completedMatchesCount} Completed)</div>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded p-2 text-[9.5px] text-slate-800 mb-3 flex items-center justify-between">
          <span>
            <strong>Schedule Note:</strong> Every Friday morning from 6:00 AM – 8:00 AM. 15 Total Match Weeks.
          </span>
          <span className="font-bold text-slate-700">Best 13 Rule Applied in Standings</span>
        </div>

        {/* Print KPI Summary Grid */}
        {showSummaryStatsInPrint && (
          <div className="grid grid-cols-4 gap-2 mb-3 text-[9px]">
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Matches</span>
              <span className="font-black text-slate-950 text-xs">{completedMatchesCount} / {totalMatches}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Total Attendance</span>
              <span className="font-black text-emerald-800 text-xs">{totalAttendancesAcrossSeason}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Avg Att./Match</span>
              <span className="font-black text-blue-800 text-xs">{avgAttendance}</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 font-bold uppercase">Goals Scored</span>
              <span className="font-black text-amber-800 text-xs">{totalGoalsAcrossSeason}</span>
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
                  <span>A4 Print View Mode (Matches Schedule)</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Clean Sheet Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive edit buttons and modal triggers are hidden for a crisp, high-contrast A4 printout.
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
              onClick={() => setPrintLayout(prev => prev === 'table' ? 'cards' : 'table')}
              className="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format: {printLayout === 'table' ? 'Official Schedule Table' : 'Match Cards Grid'}</span>
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
              <span>Season Summary Cards: {showSummaryStatsInPrint ? 'Included' : 'Excluded'}</span>
            </button>

            <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                All ({totalMatches})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusFilter === 'completed' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
              >
                Completed ({completedMatchesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusFilter === 'upcoming' ? 'bg-amber-600 text-slate-950' : 'text-slate-400'}`}
              >
                Upcoming ({totalMatches - completedMatchesCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDARD DASHBOARD CONTROLS (Hidden during print view)                    */}
      {/* ========================================================================= */}
      {!isPrintMode && (
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center">
              <Calendar className="w-6 h-6 text-amber-400 mr-2.5 shrink-0" />
              <span>League Matches ({leagueData.matches.length} Scheduled)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Every Friday 6:00 AM – 8:00 AM. Click any match to view its specific match sheet, edit match dates, or record results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={() => setIsPrintMode(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow"
              title="Toggle clean A4 printer-friendly view"
            >
              <Printer className="w-4 h-4" />
              <span>A4 Print View</span>
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={onOpenAddMatch}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 hover:border-amber-400 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow"
                  title="Add Extra Match Week / Date"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Extra Match</span>
                </button>

                <button
                  onClick={() => onOpenRecordMatch()}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-amber-900/30 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Record Match Result</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenAdminUnlock && onOpenAdminUnlock('record match results or add dates')}
                className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Record Match (Admin Only)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT-OPTIMIZED SCHEDULE TABLE (Active in table print mode or paper print)*/}
      {/* ========================================================================= */}
      {(isPrintMode && printLayout === 'table') ? (
        <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-300 shadow-2xl overflow-hidden">
          {/* Document header in Print View Mode */}
          <div className="no-print mb-4 pb-4 border-b-2 border-amber-600 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl">
                ⚽
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  Friday Football League 2.0 • Match Schedule
                </h2>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Season: 14 Aug 2026 – 27 Nov 2026 • 15 Match Weeks
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div className="font-bold text-slate-900">{filteredMatches.length} Matches Shown</div>
              <div>A4 Printable Schedule</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950 text-white text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3 font-bold text-center w-16">Match</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Week Title</th>
                  <th className="py-3 px-3 font-bold text-center">Status</th>
                  <th className="py-3 px-3 font-bold text-center">Attended</th>
                  <th className="py-3 px-3 font-bold text-center">Goals</th>
                  <th className="py-3 px-3 font-bold text-center">On-Time</th>
                  <th className="py-3 px-4 font-bold text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMatches.map((match: Match, idx: number) => {
                  const matchRes = leagueData.matchResults[match.id] || {};
                  let attendedCount = 0;
                  let onTimeCount = 0;
                  let totalMatchGoals = 0;

                  leagueData.players.forEach(player => {
                    const r = matchRes[player.id];
                    if (r) {
                      if (r.attendance) attendedCount++;
                      if (r.onTime) onTimeCount++;
                      if (r.goals) totalMatchGoals += Number(r.goals) || 0;
                    }
                  });

                  const dayName = getDayOfWeekName(match.date);

                  return (
                    <tr
                      key={match.id}
                      className={idx % 2 === 0 ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-50'}
                    >
                      <td className="py-3 px-3 text-center font-bold">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-900 border border-amber-500/40 rounded text-xs font-black">
                          M{match.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="font-bold text-slate-950">{dayName ? `${dayName}, ` : ''}{match.date}</div>
                        <div className="text-xs text-slate-500">6:00 AM – 8:00 AM</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{match.title}</div>
                        {match.matchSheet && (
                          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                            🛡️ {match.matchSheet.teamAName} {match.matchSheet.teamAScore !== undefined ? `(${match.matchSheet.teamAScore})` : ''} vs {match.matchSheet.teamBScore !== undefined ? `(${match.matchSheet.teamBScore})` : ''} {match.matchSheet.teamBName}
                            {match.matchSheet.winner === 'teamA' && <span className="ml-1 text-amber-700 font-bold">• 🏆 {match.matchSheet.teamAName} Won</span>}
                            {match.matchSheet.winner === 'teamB' && <span className="ml-1 text-emerald-700 font-bold">• 🏆 {match.matchSheet.teamBName} Won</span>}
                            {match.matchSheet.winner === 'draw' && <span className="ml-1 text-blue-700 font-bold">• 🤝 Draw</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            match.completed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {match.completed ? '✓ Completed' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-emerald-800">
                        {match.completed ? attendedCount : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-amber-800">
                        {match.completed ? totalMatchGoals : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-800">
                        {match.completed ? onTimeCount : '—'}
                      </td>
                      <td className="py-3 px-4 text-right no-print">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onOpenMatchDetail(match.id, true)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-sm cursor-pointer"
                            title={`Print clean A4 Match Sheet for Match M${match.id}`}
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print A4</span>
                          </button>

                          <button
                            onClick={() => onOpenMatchDetail(match.id, false)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition cursor-pointer border border-slate-800"
                          >
                            View Sheet
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="print-only mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[8.5px] text-slate-600">
            <div>Friday Football League 2.0 • Official Match Schedule & Results Document</div>
            <div>Total {leagueData.matches.length} Scheduled Match Weeks</div>
          </div>
        </div>
      ) : (
        /* Matches Grid Cards (Standard View & Card Print View) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((match: Match) => {
            const matchRes = leagueData.matchResults[match.id] || {};
            let attendedCount = 0;
            let onTimeCount = 0;
            let totalMatchGoals = 0;

            leagueData.players.forEach(player => {
              const r = matchRes[player.id];
              if (r) {
                if (r.attendance) attendedCount++;
                if (r.onTime) onTimeCount++;
                if (r.goals) totalMatchGoals += Number(r.goals) || 0;
              }
            });

            const dayName = getDayOfWeekName(match.date);

            return (
              <div
                key={match.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition shadow-lg ${
                  isPrintMode
                    ? 'bg-white text-slate-900 border-slate-300'
                    : 'glass-panel border-slate-800 hover:border-amber-500/40 group'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0 ${
                      isPrintMode
                        ? 'bg-amber-100 border border-amber-300 text-amber-900'
                        : 'bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 text-amber-400'
                    }`}>
                      M{match.id}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className={`font-black text-base tracking-wide transition ${
                          isPrintMode ? 'text-slate-950' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {match.title}
                        </h4>
                        {isAdmin && !isPrintMode && (
                          <button
                            onClick={() => onOpenEditMatch(match)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                            title="Edit match date or title"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className={`text-xs flex items-center gap-1 mt-0.5 font-medium ${
                        isPrintMode ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        <Clock className={`w-3 h-3 shrink-0 ${isPrintMode ? 'text-amber-700' : 'text-amber-400'}`} />
                        <span>{dayName ? `${dayName}, ` : ''}{match.date} • 6:00 AM</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        match.completed
                          ? isPrintMode
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isPrintMode
                            ? 'bg-slate-100 text-slate-600 border border-slate-300'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {match.completed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <span>Upcoming</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Match Stats Grid */}
                <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center ${
                  isPrintMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-900/70 border-slate-800'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isPrintMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Attended
                    </span>
                    <span className={`text-sm font-black ${isPrintMode ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      {attendedCount}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isPrintMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Goals
                    </span>
                    <span className={`text-sm font-black ${isPrintMode ? 'text-amber-800' : 'text-amber-400'}`}>
                      {totalMatchGoals}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isPrintMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      On-Time
                    </span>
                    <span className={`text-sm font-black ${isPrintMode ? 'text-slate-800' : 'text-slate-200'}`}>
                      {onTimeCount}
                    </span>
                  </div>
                </div>

                {/* Match Sheet Team Info if Available */}
                {match.matchSheet && (
                  <div className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                    isPrintMode 
                      ? 'bg-slate-100 border-slate-300 text-slate-900' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}>
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-xs">🛡️</span>
                      <span className="font-bold truncate text-[11px]">
                        <span className="text-rose-400">🔴 {match.matchSheet.teamAName}</span>
                        {match.matchSheet.teamAScore !== undefined ? ` (${match.matchSheet.teamAScore})` : ''} 
                        <span className="text-slate-400 mx-1">vs</span> 
                        {match.matchSheet.teamBScore !== undefined ? `(${match.matchSheet.teamBScore}) ` : ''}
                        <span className="text-emerald-400">🟢 {match.matchSheet.teamBName}</span>
                      </span>
                    </div>
                    {match.matchSheet.winner === 'teamA' && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded shrink-0 ml-1.5 shadow-sm">
                        🏆 {match.matchSheet.teamAName}
                      </span>
                    )}
                    {match.matchSheet.winner === 'teamB' && (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded shrink-0 ml-1.5 shadow-sm">
                        🏆 {match.matchSheet.teamBName}
                      </span>
                    )}
                    {match.matchSheet.winner === 'draw' && (
                      <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded shrink-0 ml-1.5">
                        🤝 Draw
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons (Hidden in printout) */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 gap-2 no-print">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenMatchDetail(match.id, false)}
                      className={`text-xs font-bold flex items-center space-x-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg transition ${
                        isPrintMode ? 'text-slate-700 hover:text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                      }`}
                      title="View Lineups, Pitch, H2H & Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Preview Sheet</span>
                    </button>

                    <button
                      onClick={() => onOpenMatchDetail(match.id, true)}
                      className={`text-xs font-bold flex items-center space-x-1 cursor-pointer py-1 px-2 rounded-lg transition ${
                        isPrintMode 
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black' 
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30'
                      }`}
                      title={`Open clean A4 printable sheet for Match ${match.id}`}
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print A4</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => onOpenEditMatch(match)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                          isPrintMode
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
                        }`}
                        title="Edit Match Date & Title"
                      >
                        <CalendarDays className="w-3 h-3 text-amber-500" />
                        <span>Edit Date</span>
                      </button>
                    )}

                    {isAdmin ? (
                      <button
                        onClick={() => onOpenRecordMatch(match.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer active:scale-95 shadow"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Record</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenMatchDetail(match.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-slate-800 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

