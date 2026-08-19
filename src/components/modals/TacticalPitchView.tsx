import React, { useState } from 'react';
import { Trophy, Clock, Star, Flame } from 'lucide-react';
import { Player, PlayerMatchRecord } from '../../types';
import { formatPlayerName } from '../../constants';

interface TacticalPitchViewProps {
  teamAName: string;
  teamBName: string;
  teamAPlayers: { player: Player; record: PlayerMatchRecord }[];
  teamBPlayers: { player: Player; record: PlayerMatchRecord }[];
  unassignedPlayers: { player: Player; record: PlayerMatchRecord }[];
  winner?: 'teamA' | 'teamB' | 'draw' | 'none';
  teamAScore?: number;
  teamBScore?: number;
  teamAGoalsCount: number;
  teamBGoalsCount: number;
  matchTitle: string;
  matchDate: string;
}

export const TacticalPitchView: React.FC<TacticalPitchViewProps> = ({
  teamAName,
  teamBName,
  teamAPlayers,
  teamBPlayers,
  unassignedPlayers,
  winner,
  teamAScore,
  teamBScore,
  teamAGoalsCount,
  teamBGoalsCount,
  matchTitle,
  matchDate,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; record: PlayerMatchRecord; team: 'teamA' | 'teamB' } | null>(null);
  const [showBadges, setShowBadges] = useState(true);

  // Helper to compute tactical grid positions for players on each side (0% to 100%)
  const getPlayerPositions = (count: number, isTeamA: boolean) => {
    // Team A is on the left half (X: 5% to 45%), Team B is on the right half (X: 55% to 95%)
    const positions: { x: number; y: number }[] = [];
    if (count === 0) return positions;

    // Common formations depending on player count
    if (count === 1) {
      positions.push({ x: isTeamA ? 25 : 75, y: 50 });
    } else if (count === 2) {
      positions.push({ x: isTeamA ? 20 : 80, y: 35 });
      positions.push({ x: isTeamA ? 30 : 70, y: 65 });
    } else if (count === 3) {
      positions.push({ x: isTeamA ? 15 : 85, y: 50 }); // GK/Def
      positions.push({ x: isTeamA ? 32 : 68, y: 30 }); // Fwd
      positions.push({ x: isTeamA ? 32 : 68, y: 70 }); // Fwd
    } else if (count === 4) {
      positions.push({ x: isTeamA ? 14 : 86, y: 50 }); // Def
      positions.push({ x: isTeamA ? 26 : 74, y: 25 }); // Mid L
      positions.push({ x: isTeamA ? 26 : 74, y: 75 }); // Mid R
      positions.push({ x: isTeamA ? 38 : 62, y: 50 }); // Att
    } else if (count === 5) {
      positions.push({ x: isTeamA ? 12 : 88, y: 50 }); // GK
      positions.push({ x: isTeamA ? 22 : 78, y: 28 }); // Def L
      positions.push({ x: isTeamA ? 22 : 78, y: 72 }); // Def R
      positions.push({ x: isTeamA ? 36 : 64, y: 32 }); // Att L
      positions.push({ x: isTeamA ? 36 : 64, y: 68 }); // Att R
    } else if (count === 6) {
      positions.push({ x: isTeamA ? 12 : 88, y: 50 }); // GK
      positions.push({ x: isTeamA ? 22 : 78, y: 25 }); // Def L
      positions.push({ x: isTeamA ? 22 : 78, y: 75 }); // Def R
      positions.push({ x: isTeamA ? 32 : 68, y: 50 }); // Mid
      positions.push({ x: isTeamA ? 40 : 60, y: 25 }); // Att L
      positions.push({ x: isTeamA ? 40 : 60, y: 75 }); // Att R
    } else if (count === 7) {
      positions.push({ x: isTeamA ? 10 : 90, y: 50 });
      positions.push({ x: isTeamA ? 20 : 80, y: 25 });
      positions.push({ x: isTeamA ? 20 : 80, y: 75 });
      positions.push({ x: isTeamA ? 30 : 70, y: 30 });
      positions.push({ x: isTeamA ? 30 : 70, y: 70 });
      positions.push({ x: isTeamA ? 40 : 60, y: 25 });
      positions.push({ x: isTeamA ? 40 : 60, y: 75 });
    } else {
      // General distribution grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const xStep = 30 / (cols > 1 ? cols - 1 : 1);
        const yStep = 70 / (rows > 1 ? rows - 1 : 1);
        const x = isTeamA ? 12 + col * xStep : 88 - col * xStep;
        const y = 15 + row * yStep;
        positions.push({ x, y });
      }
    }
    return positions;
  };

  const teamAPositions = getPlayerPositions(teamAPlayers.length, true);
  const teamBPositions = getPlayerPositions(teamBPlayers.length, false);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Pitch Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm animate-pulse"></span>
            <span className="text-xs font-black text-rose-300">🔴 {teamAName} ({teamAPlayers.length})</span>
          </div>
          <span className="text-xs font-black text-amber-400">VS</span>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm animate-pulse"></span>
            <span className="text-xs font-black text-emerald-300">🟢 {teamBName} ({teamBPlayers.length})</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowBadges(!showBadges)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              showBadges 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <span>{showBadges ? '✓ Stats Badges Visible' : 'Hide Stats Badges'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REALISTIC SOCCER PITCH FIELD CANVAS                                        */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-900/60 select-none bg-emerald-900">
        {/* Grass Striping Background */}
        <div 
          className="absolute inset-0 opacity-95"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              #15803d 0px,
              #15803d 8%,
              #166534 8%,
              #166534 16%
            )`
          }}
        />

        {/* Subtle Pitch Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Pitch Boundary Lines */}
        <div className="absolute inset-3 sm:inset-4 border-2 border-white/60 rounded-lg pointer-events-none">
          {/* Halfway Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/60 -translate-x-1/2" />
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full border-2 border-white/60 flex items-center justify-center">
            {/* Center Spot */}
            <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
          </div>

          {/* Left Penalty Box (Team A side) */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[18%] h-[60%] border-r-2 border-y-2 border-white/60 flex items-center justify-end pr-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
          {/* Left Goal Box */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[7%] h-[32%] border-r-2 border-y-2 border-white/60" />
          {/* Left Goal Line Net indicator */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full w-2 h-[24%] bg-white/20 border-l border-y border-white/40" />

          {/* Right Penalty Box (Team B side) */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[18%] h-[60%] border-l-2 border-y-2 border-white/60 flex items-center pl-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
          {/* Right Goal Box */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[7%] h-[32%] border-l-2 border-y-2 border-white/60" />
          {/* Right Goal Line Net indicator */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-2 h-[24%] bg-white/20 border-r border-y border-white/40" />

          {/* Corner Arcs */}
          <div className="absolute top-0 left-0 w-3 h-3 border-b border-r border-white/50 rounded-br-full" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-t border-r border-white/50 rounded-tr-full" />
          <div className="absolute top-0 right-0 w-3 h-3 border-b border-l border-white/50 rounded-bl-full" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-t border-l border-white/50 rounded-tl-full" />
        </div>

        {/* Watermark Branding in Middle of Pitch */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="text-center">
            <div className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest">
              FFL 2.0
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest mt-1">
              Friday Football League
            </div>
          </div>
        </div>

        {/* TEAM A ROSTER NODES (Red) */}
        {teamAPlayers.map(({ player, record }, idx) => {
          const pos = teamAPositions[idx] || { x: 20, y: 50 };
          const fName = formatPlayerName(player.name);
          const isWinner = record.win;
          const goals = record.goals || 0;
          const isSelected = selectedPlayer?.player.id === player.id;

          let matchPts = 0;
          if (record.attendance) matchPts += 0.5;
          if (record.win) matchPts += 1.0;
          if (record.onTime) matchPts += 1.0;
          if (record.penalty) matchPts -= record.penalty;

          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer({ player, record, team: 'teamA' })}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 flex flex-col items-center cursor-pointer group transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              {/* Player Jersey Disc */}
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 text-white font-black flex items-center justify-center shadow-lg border-2 transition ${
                isSelected 
                  ? 'border-amber-300 ring-4 ring-amber-400/60 scale-110' 
                  : 'border-white/90 hover:border-amber-300'
              }`}>
                {player.avatar ? (
                  <img 
                    src={player.avatar} 
                    alt={player.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-black drop-shadow">
                    {fName.charAt(0)}
                  </span>
                )}

                {/* Floating Goal / Win Badges */}
                {showBadges && goals > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] sm:text-[10px] rounded-full border border-emerald-300 shadow flex items-center gap-0.5">
                    ⚽{goals}
                  </span>
                )}
                {showBadges && isWinner && goals === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full border border-amber-200 shadow flex items-center justify-center">
                    🏆
                  </span>
                )}
              </div>

              {/* Name Tag Pill */}
              <div className="mt-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md border border-rose-500/40 text-[10px] sm:text-[11px] font-black text-rose-100 text-center leading-tight max-w-[80px] sm:max-w-[100px] truncate shadow">
                {fName}
              </div>

              {/* Match Points Tooltip Pill on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500 shadow pointer-events-none whitespace-nowrap z-20">
                +{matchPts.toFixed(1)} pts
              </div>
            </div>
          );
        })}

        {/* TEAM B ROSTER NODES (Green) */}
        {teamBPlayers.map(({ player, record }, idx) => {
          const pos = teamBPositions[idx] || { x: 80, y: 50 };
          const fName = formatPlayerName(player.name);
          const isWinner = record.win;
          const goals = record.goals || 0;
          const isSelected = selectedPlayer?.player.id === player.id;

          let matchPts = 0;
          if (record.attendance) matchPts += 0.5;
          if (record.win) matchPts += 1.0;
          if (record.onTime) matchPts += 1.0;
          if (record.penalty) matchPts -= record.penalty;

          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer({ player, record, team: 'teamB' })}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 flex flex-col items-center cursor-pointer group transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              {/* Player Jersey Disc */}
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-black flex items-center justify-center shadow-lg border-2 transition ${
                isSelected 
                  ? 'border-amber-300 ring-4 ring-amber-400/60 scale-110' 
                  : 'border-white/90 hover:border-amber-300'
              }`}>
                {player.avatar ? (
                  <img 
                    src={player.avatar} 
                    alt={player.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-black drop-shadow">
                    {fName.charAt(0)}
                  </span>
                )}

                {/* Floating Goal / Win Badges */}
                {showBadges && goals > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] sm:text-[10px] rounded-full border border-emerald-300 shadow flex items-center gap-0.5">
                    ⚽{goals}
                  </span>
                )}
                {showBadges && isWinner && goals === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full border border-amber-200 shadow flex items-center justify-center">
                    🏆
                  </span>
                )}
              </div>

              {/* Name Tag Pill */}
              <div className="mt-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md border border-emerald-500/40 text-[10px] sm:text-[11px] font-black text-emerald-100 text-center leading-tight max-w-[80px] sm:max-w-[100px] truncate shadow">
                {fName}
              </div>

              {/* Match Points Tooltip Pill on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500 shadow pointer-events-none whitespace-nowrap z-20">
                +{matchPts.toFixed(1)} pts
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Player Detail Card Drawer */}
      {selectedPlayer && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150 ${
          selectedPlayer.team === 'teamA'
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-100'
            : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow ${
              selectedPlayer.team === 'teamA'
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {selectedPlayer.team === 'teamA' ? '🔴' : '🟢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">
                  {formatPlayerName(selectedPlayer.player.name)}
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white border border-slate-700">
                  {selectedPlayer.team === 'teamA' ? teamAName : teamBName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Attended: <strong>+0.5</strong></span>
                {selectedPlayer.record.win && <span>• Win: <strong>+1.0 🏆</strong></span>}
                {selectedPlayer.record.onTime && <span>• On-Time: <strong>+1.0 ⏰</strong></span>}
                {selectedPlayer.record.goals > 0 && <span className="text-emerald-400 font-bold">• ⚽ {selectedPlayer.record.goals} Goals</span>}
                {selectedPlayer.record.ownGoals > 0 && <span className="text-amber-400 font-bold">• 🥅 {selectedPlayer.record.ownGoals} OG</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Points</span>
              <span className="text-base font-black text-amber-400">
                +{((selectedPlayer.record.attendance ? 0.5 : 0) + (selectedPlayer.record.win ? 1.0 : 0) + (selectedPlayer.record.onTime ? 1.0 : 0) - (selectedPlayer.record.penalty || 0)).toFixed(1)} pts
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Unassigned Attending Players Bench (if any) */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span>🪑 Bench / Attending (Unassigned Team):</span>
              <span className="text-slate-200 font-black">({unassignedPlayers.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unassignedPlayers.map(({ player, record }) => (
              <span 
                key={player.id} 
                className="px-2 py-1 bg-slate-900 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 flex items-center space-x-1"
              >
                <span>{formatPlayerName(player.name)}</span>
                {record.win && <span>🏆</span>}
                {record.goals > 0 && <span className="text-emerald-400 font-black">⚽{record.goals}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
