import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Plus, Sparkles, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { LeagueData } from '../../types';
import { getDayOfWeekName, getNextFridayAfterDate } from '../../constants';

interface AddMatchModalProps {
  isOpen: boolean;
  leagueData: LeagueData;
  onClose: () => void;
  onAddMatch: (title: string, date: string, teamAName?: string, teamBName?: string) => void;
}

const TEAM_PRESETS = [
  { a: 'Team Gaza', b: 'Team Rashu', label: 'Gaza vs Rashu' },
  { a: 'Bibs', b: 'Non-Bibs', label: 'Bibs vs Non-Bibs' },
  { a: 'Red Team', b: 'Blue Team', label: 'Reds vs Blues' },
  { a: 'White Team', b: 'Black Team', label: 'Whites vs Blacks' },
  { a: 'Lions', b: 'Tigers', label: 'Lions vs Tigers' },
  { a: 'Team A', b: 'Team B', label: 'Team A vs B' },
];

export const AddMatchModal: React.FC<AddMatchModalProps> = ({
  isOpen,
  leagueData,
  onClose,
  onAddMatch,
}) => {
  const nextMatchNum = (leagueData.matches.length || 0) + 1;
  const lastMatch = leagueData.matches[leagueData.matches.length - 1];
  const defaultSuggestedDate = lastMatch ? getNextFridayAfterDate(lastMatch.date) : '2026-08-14';

  const [title, setTitle] = useState(`Match ${nextMatchNum}`);
  const [date, setDate] = useState(defaultSuggestedDate);
  const [teamAName, setTeamAName] = useState('Team Gaza');
  const [teamBName, setTeamBName] = useState('Team Rashu');

  useEffect(() => {
    if (isOpen) {
      const nextNum = (leagueData.matches.length || 0) + 1;
      const last = leagueData.matches[leagueData.matches.length - 1];
      const sugDate = last ? getNextFridayAfterDate(last.date) : '2026-08-14';
      setTitle(`Match ${nextNum}`);
      setDate(sugDate);
      setTeamAName(last?.matchSheet?.teamAName || 'Team Gaza');
      setTeamBName(last?.matchSheet?.teamBName || 'Team Rashu');
    }
  }, [isOpen, leagueData.matches]);

  const dayOfWeek = useMemo(() => getDayOfWeekName(date), [date]);
  const isFriday = dayOfWeek.toLowerCase() === 'friday';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onAddMatch(
      title.trim(),
      date,
      teamAName.trim() || 'Team Gaza',
      teamBName.trim() || 'Team Rashu'
    );
    onClose();
  };

  const handleSetDateOffset = (weeksAhead: number) => {
    const last = leagueData.matches[leagueData.matches.length - 1];
    if (!last) return;
    const [y, m, d] = last.date.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + weeksAhead * 7);
    const yStr = newDate.getFullYear();
    const mStr = String(newDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(newDate.getDate()).padStart(2, '0');
    setDate(`${yStr}-${mStr}-${dStr}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Add Match Fixture</h3>
              <p className="text-xs text-slate-400">Schedule a match & set team names</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Match Title / Label
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Match 16 or Friendly Cup"
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none"
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
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none cursor-pointer"
            />

            {/* Day of Week Indicator */}
            <div className="mt-2 flex items-center justify-between">
              <div
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isFriday
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isFriday ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{dayOfWeek || 'Select a date'}</span>
                {isFriday && <span className="text-[10px] opacity-80">(Standard League Day)</span>}
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetDateOffset(1)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                  title="Set to next Friday"
                >
                  +1 Week (Fri)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDateOffset(2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition"
                  title="Set to 2 Fridays ahead"
                >
                  +2 Weeks
                </button>
              </div>
            </div>
          </div>

          {/* Team Names for this fixture */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Team Names for this Match</span>
              </label>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {TEAM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setTeamAName(preset.a);
                    setTeamBName(preset.b);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    teamAName === preset.a && teamBName === preset.b
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                  Team 1
                </label>
                <input
                  type="text"
                  required
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Team Gaza"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">
                  Team 2
                </label>
                <input
                  type="text"
                  required
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Team Rashu"
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="flex items-center text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Automatic Standings Recalculation</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Adding a match will automatically expand the season. Player stats will retain their Best 13 point system across all played matches.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
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
              <Plus className="w-4 h-4" />
              <span>Add Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

