import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Save, Trash2, CheckCircle2, AlertCircle, Clock, Shield, Trophy } from 'lucide-react';
import { Match, MatchSheet, MatchWinner } from '../../types';
import { getDayOfWeekName } from '../../constants';

interface EditMatchModalProps {
  isOpen: boolean;
  match: Match | null;
  canDelete?: boolean;
  onClose: () => void;
  onUpdateMatch: (
    matchId: number,
    newTitle: string,
    newDate: string,
    completed: boolean,
    teamAName?: string,
    teamBName?: string,
    matchSheet?: Partial<MatchSheet>
  ) => void;
  onDeleteMatch?: (matchId: number) => void;
}

const TEAM_PRESETS = [
  { a: 'Team Gaza', b: 'Team Rashu', label: 'Gaza vs Rashu' },
  { a: 'Bibs', b: 'Non-Bibs', label: 'Bibs vs Non-Bibs' },
  { a: 'Red Team', b: 'Blue Team', label: 'Reds vs Blues' },
  { a: 'White Team', b: 'Black Team', label: 'Whites vs Blacks' },
  { a: 'Lions', b: 'Tigers', label: 'Lions vs Tigers' },
  { a: 'Team A', b: 'Team B', label: 'Team A vs B' },
];

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  isOpen,
  match,
  canDelete = false,
  onClose,
  onUpdateMatch,
  onDeleteMatch,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [teamAName, setTeamAName] = useState('Team Gaza');
  const [teamBName, setTeamBName] = useState('Team Rashu');
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');
  const [winner, setWinner] = useState<MatchWinner>('none');

  useEffect(() => {
    if (isOpen && match) {
      setTitle(match.title);
      setDate(match.date);
      setCompleted(match.completed);
      setTeamAName(match.matchSheet?.teamAName || 'Team Gaza');
      setTeamBName(match.matchSheet?.teamBName || 'Team Rashu');
      setTeamAScore(match.matchSheet?.teamAScore !== undefined ? String(match.matchSheet.teamAScore) : '');
      setTeamBScore(match.matchSheet?.teamBScore !== undefined ? String(match.matchSheet.teamBScore) : '');
      setWinner(match.matchSheet?.winner || 'none');
    }
  }, [isOpen, match]);

  const dayOfWeek = useMemo(() => getDayOfWeekName(date), [date]);
  const isFriday = dayOfWeek.toLowerCase() === 'friday';

  if (!isOpen || !match) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const tAScore = teamAScore.trim() !== '' ? Number(teamAScore) : undefined;
    const tBScore = teamBScore.trim() !== '' ? Number(teamBScore) : undefined;

    const updatedSheet: Partial<MatchSheet> = {
      teamAName: teamAName.trim() || 'Team Gaza',
      teamBName: teamBName.trim() || 'Team Rashu',
      teamAScore: isNaN(Number(tAScore)) ? undefined : tAScore,
      teamBScore: isNaN(Number(tBScore)) ? undefined : tBScore,
      winner: winner,
    };

    onUpdateMatch(
      match.id,
      title.trim(),
      date,
      completed,
      teamAName.trim() || 'Team Gaza',
      teamBName.trim() || 'Team Rashu',
      updatedSheet
    );
    onClose();
  };

  const handleAdjustDays = (dayDiff: number) => {
    if (!date) return;
    const [y, m, d] = date.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + dayDiff);
    const yStr = newDate.getFullYear();
    const mStr = String(newDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(newDate.getDate()).padStart(2, '0');
    setDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleApplyPreset = (a: string, b: string) => {
    setTeamAName(a);
    setTeamBName(b);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Edit Match & Team Names</h3>
              <p className="text-xs text-slate-400">Modify fixture info, team names, date, and score</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Match Title and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Match Title / Label
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Match Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Day of Week & Quick date adjustment */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                isFriday
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isFriday ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{dayOfWeek || 'Select a date'}</span>
              {isFriday && <span className="text-[10px] opacity-80">(Friday)</span>}
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleAdjustDays(-1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                title="Move 1 day earlier"
              >
                -1 Day
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDays(1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                title="Move 1 day later"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDays(7)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                title="Move 1 week later"
              >
                +1 Week
              </button>
            </div>
          </div>

          {/* TEAM NAMES SECTION */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Team Names for This Match Day</span>
              </label>
              <span className="text-[11px] text-slate-400">Customizable per match</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
              {TEAM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.a, preset.b)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    teamAName === preset.a && teamBName === preset.b
                      ? 'bg-amber-500 text-slate-950 font-black ring-1 ring-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Editable Team Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Team A */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  Team 1 / Color
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    required
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="e.g. Team Gaza or Red Team"
                    className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={teamAScore}
                    onChange={(e) => setTeamAScore(e.target.value)}
                    placeholder="Goals"
                    className="w-16 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl px-2 py-2 text-sm text-amber-400 font-black text-center focus:outline-none"
                    title="Team 1 Goals"
                  />
                </div>
              </div>

              {/* Team B */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Team 2 / Color
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={teamBScore}
                    onChange={(e) => setTeamBScore(e.target.value)}
                    placeholder="Goals"
                    className="w-16 bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-2 py-2 text-sm text-emerald-400 font-black text-center focus:outline-none"
                    title="Team 2 Goals"
                  />
                  <input
                    type="text"
                    required
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="e.g. Team Rashu or Blue Team"
                    className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Winner Selection */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Match Winner Outcome</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setWinner('teamA')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate ${
                    winner === 'teamA'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  🏆 {teamAName || 'Team 1'}
                </button>
                <button
                  type="button"
                  onClick={() => setWinner('draw')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate ${
                    winner === 'draw'
                      ? 'bg-blue-600 text-white font-black shadow'
                      : 'bg-slate-950 hover:bg-slate-800 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  🤝 Draw
                </button>
                <button
                  type="button"
                  onClick={() => setWinner('teamB')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate ${
                    winner === 'teamB'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow'
                      : 'bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  🏆 {teamBName || 'Team 2'}
                </button>
                <button
                  type="button"
                  onClick={() => setWinner('none')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate ${
                    winner === 'none'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          {/* Completed Toggle */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Match Status</span>
                <span className="text-[11px] text-slate-400">
                  {completed ? 'Match has been played and completed' : 'Upcoming fixture'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {canDelete && onDeleteMatch ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteMatch(match.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 border border-red-800/40 transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

