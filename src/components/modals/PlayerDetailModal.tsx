import React from 'react';
import { X, FileSpreadsheet, FileText, Edit2, Trash2, Trophy, Target, ShieldAlert, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPlayerName } from '../../constants';
import { LeagueData, Player } from '../../types';
import { calculatePlayerStats } from '../../utils/stats';

interface PlayerDetailModalProps {
  player: Player | null;
  leagueData: LeagueData;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onExportExcel: (player: Player) => void;
  onExportPDF: (player: Player) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  leagueData,
  isAdmin,
  isOpen,
  onClose,
  onOpenEdit,
  onDeletePlayer,
  onExportExcel,
  onExportPDF,
}) => {
  if (!isOpen || !player) return null;

  const stats = calculatePlayerStats(player, leagueData);
  const formattedName = formatPlayerName(player.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div
              onClick={() => {
                if (isAdmin) {
                  onOpenEdit(player.id);
                }
              }}
              className={`w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-800 flex items-center justify-center text-amber-400 font-black text-2xl shrink-0 shadow-lg ${
                isAdmin ? 'cursor-pointer hover:border-amber-400 transition group/avatar relative' : ''
              }`}
              title={isAdmin ? 'Click to change profile picture' : undefined}
            >
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <span>{formattedName.charAt(0)}</span>
              )}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-[10px] text-amber-300 font-bold transition">
                  Edit
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-lg sm:text-xl font-black text-white">{formattedName}</h3>
                {isAdmin && (
                  <div className="flex items-center space-x-1.5 no-print">
                    <button
                      onClick={() => {
                        onOpenEdit(player.id);
                      }}
                      className="px-2 py-0.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeletePlayer(player.id);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Season Performance & Match-by-Match Breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">League Pts</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">{stats.best13Points.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 block">Raw: {stats.rawPoints.toFixed(1)}</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Goals</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.totalGoals}</span>
            <span className="text-[10px] text-slate-500 block">Scored</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Own Goals</span>
            <span className="text-xl sm:text-2xl font-black text-red-400">{stats.totalOwnGoals}</span>
            <span className="text-[10px] text-slate-500 block">OG</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Penalties</span>
            <span className={`text-xl sm:text-2xl font-black ${stats.totalPenalties > 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {stats.totalPenalties > 0 ? `-${stats.totalPenalties}` : '0'}
            </span>
            <span className="text-[10px] text-slate-500 block">Deducted</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-inner col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Wins</span>
            <span className="text-xl sm:text-2xl font-black text-amber-500">{stats.matchWins}</span>
            <span className="text-[10px] text-slate-500 block">{stats.matchesPlayed} Played</span>
          </div>
        </div>

        {/* Match-by-Match Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Match-by-Match Score Breakdown
            </h4>
            <span className="text-[11px] text-slate-400">
              {stats.matchesPlayed} Matches with participation
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stats.matchScores.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/80 text-slate-500 text-xs font-medium">
                No recorded match participation yet for this player.
              </div>
            ) : (
              stats.matchScores.map((ms) => {
                const match = leagueData.matches.find((m) => m.id === ms.matchId);
                return (
                  <div
                    key={ms.matchId}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                      ms.isExcludedFromBest13
                        ? 'bg-red-950/20 border-red-900/40 opacity-80'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{ms.matchTitle}</span>
                        <span className="text-[10px] text-slate-400">({match?.date})</span>
                        {ms.isExcludedFromBest13 && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">
                            Excluded (Lowest)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className={ms.details.attendance ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {ms.details.attendance ? '✓ Attend (+0.5)' : '✗ Absent'}
                        </span>
                        <span>•</span>
                        <span className={ms.details.win ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                          {ms.details.win ? '✓ Win (+1.0)' : 'No Win'}
                        </span>
                        <span>•</span>
                        <span className={ms.details.onTime ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {ms.details.onTime ? '✓ On-Time (+1.0)' : 'Late'}
                        </span>
                        {ms.details.goals > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-black">⚽ {ms.details.goals} Goal{ms.details.goals > 1 ? 's' : ''}</span>
                          </>
                        )}
                        {ms.details.ownGoals > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-400 font-black">🥅 {ms.details.ownGoals} OG</span>
                          </>
                        )}
                        {ms.details.penalty > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-500 font-black bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                              ⚠️ -{ms.details.penalty} Pen
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className={`font-black text-base ${ms.score < 0 ? 'text-red-500' : 'text-amber-400'}`}>
                        {ms.score > 0 ? `+${ms.score.toFixed(1)}` : `${ms.score.toFixed(1)}`} Pts
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer & Individual Export Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800 no-print">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => onExportExcel(player)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Player Excel</span>
            </button>

            <button
              onClick={() => onExportPDF(player)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
            >
              <FileText className="w-3.5 h-3.5 text-red-100" />
              <span>Export Player PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
