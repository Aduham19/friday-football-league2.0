import React, { useState } from 'react';
import { Users, UserPlus, FileSpreadsheet, FileText, Camera, Edit2, Trash2, ArrowRight, Search, Shield, Lock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { formatPlayerName } from '../constants';
import { LeagueData, Player } from '../types';
import { calculatePlayerStats } from '../utils/stats';
import { PlayerAvatarModal } from './modals/PlayerAvatarModal';

interface PlayersViewProps {
  leagueData: LeagueData;
  isAdmin: boolean;
  onOpenAddPlayer: () => void;
  onOpenEditPlayer: (playerId: string) => void;
  onOpenPlayerDetail: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onUpdatePlayerAvatar: (playerId: string, avatarDataUrl: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenAdminUnlock?: (actionName?: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  leagueData,
  isAdmin,
  onOpenAddPlayer,
  onOpenEditPlayer,
  onOpenPlayerDetail,
  onDeletePlayer,
  onUpdatePlayerAvatar,
  onExportExcel,
  onExportPDF,
  onOpenAdminUnlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarModalPlayer, setAvatarModalPlayer] = useState<Player | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const filteredPlayers = leagueData.players.filter(player => {
    if (!searchQuery.trim()) return true;
    return player.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const handleOpenAvatarModal = (player: Player) => {
    if (!isAdmin) {
      onOpenPlayerDetail(player.id);
      return;
    }
    setAvatarModalPlayer(player);
    setIsAvatarModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Player Avatar Studio Modal */}
      <PlayerAvatarModal
        player={avatarModalPlayer}
        isOpen={isAvatarModalOpen}
        onClose={() => {
          setIsAvatarModalOpen(false);
          setAvatarModalPlayer(null);
        }}
        onSaveAvatar={(playerId, avatarDataUrl) => {
          onUpdatePlayerAvatar(playerId, avatarDataUrl);
        }}
      />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center">
            <Users className="w-6 h-6 text-amber-400 mr-2.5 shrink-0" />
            <span>Players & Registration Tracker</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Rule: Players must add their name before 00:00 midnight prior to match day to secure their spot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={onExportExcel}
            className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl font-bold transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
            title="Export player roster to Excel (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onExportPDF}
            className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-xl font-bold transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
            title="Export player roster to printable PDF"
          >
            <FileText className="w-4 h-4 text-red-100" />
            <span>Export PDF</span>
          </button>

          {isAdmin ? (
            <button
              onClick={onOpenAddPlayer}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Player</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAdminUnlock && onOpenAdminUnlock('register new players')}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Register (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-bold">
          Showing <span className="text-amber-400 font-black">{filteredPlayers.length}</span> of {leagueData.players.length} Players
        </div>
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlayers.map((player: Player) => {
          const stats = calculatePlayerStats(player, leagueData);
          const formattedName = formatPlayerName(player.name);

          return (
            <div
              key={player.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition shadow-lg group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 w-full">
                  {/* Avatar upload trigger */}
                  <div
                    onClick={() => handleOpenAvatarModal(player)}
                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center shrink-0 cursor-pointer hover:border-amber-400 transition relative group/avatar shadow-md`}
                    title={isAdmin ? "Click to change or add profile photo" : "Click to view player performance"}
                  >
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-amber-400 font-black text-lg">
                        {formattedName.charAt(0)}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition text-amber-300 text-[10px] font-bold">
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between overflow-hidden">
                    <div className="truncate mr-2">
                      <h4
                        onClick={() => onOpenPlayerDetail(player.id)}
                        className="text-base font-black text-white tracking-wide truncate cursor-pointer hover:text-amber-400 transition"
                      >
                        {formattedName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Shield className="w-3 h-3 text-amber-500/80" />
                          <span>FFL Player</span>
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenAvatarModal(player)}
                            className="text-[10px] font-bold text-amber-400/90 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                          >
                            <Camera className="w-2.5 h-2.5" />
                            <span>{player.avatar ? 'Change PP' : 'Add PP'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => onOpenEditPlayer(player.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 no-print cursor-pointer active:scale-95 shadow-sm"
                        title="Edit player profile"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Player Stats Grid */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">League</span>
                  <span className="text-sm font-black text-amber-400">{stats.best13Points.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Goals</span>
                  <span className="text-sm font-black text-emerald-400">{stats.totalGoals}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">OG</span>
                  <span className="text-sm font-black text-red-400">{stats.totalOwnGoals}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pen</span>
                  <span className={`text-sm font-black ${stats.totalPenalties > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    {stats.totalPenalties > 0 ? `-${stats.totalPenalties}` : '0'}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex justify-between items-center no-print border-t border-slate-800/80">
                {isAdmin ? (
                  <button
                    onClick={() => onDeletePlayer(player.id)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-red-950/60 text-red-400 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-red-900/30 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {stats.matchesPlayed} Matches played
                  </span>
                )}

                <button
                  onClick={() => onOpenPlayerDetail(player.id)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer py-1"
                >
                  <span>Season Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800">
          <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-600 mb-3 text-xl">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-slate-300 font-bold text-sm">No players match your search.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing the search input or click "Register New Player".</p>
        </div>
      )}
    </div>
  );
};
