import React from 'react';
import { Shield, Clock, Calculator, Star, ListOrdered, Hand, CheckCircle, CalendarDays, Award } from 'lucide-react';
import { FFLogo } from './FFLogo';

export const RulesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <FFLogo className="w-14 h-16 shrink-0 drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]" />
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                FRIDAY FOOTBALL LEAGUE 2.0
              </h3>
              <p className="text-xs sm:text-sm text-amber-400 font-bold mt-0.5">
                Official Individual Points League Rules • Effective Friday, 14 August 2026
              </p>
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300">
          <div className="space-y-6">
            {/* Rule 1: Duration & Schedule */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-white font-black text-base flex items-center">
                <Clock className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>1. League Duration & Schedule</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Consists of <strong className="text-amber-400">15 scheduled league matches</strong>. Commences Friday, 14 August 2026, with the final match on Friday, 27 November 2026. Matches officially commence at 6:00 AM and conclude at 8:00 AM every Friday.
              </p>
            </section>

            {/* Rule 2: Best 13 Results */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-white font-black text-base flex items-center">
                <Calculator className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>2. Best 13 Results Rule</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Only a player’s <strong className="text-emerald-400 font-bold">best 13 match results</strong> count towards final league standings.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 mt-2">
                <li>If a player completes 14 matches, their lowest-scoring result is excluded.</li>
                <li>If 15 matches are completed, the two lowest-scoring match results are excluded.</li>
              </ul>
            </section>

            {/* Rule 3: Points System */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-amber-500/20">
              <h4 className="text-white font-black text-base flex items-center">
                <Star className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>3. Match Points System (Max 2.5 pts)</span>
              </h4>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Attendance (min. 1 half played):</span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">+0.5 pt</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Match Win:</span>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">+1.0 pt</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">On-Time Bonus (arrive on/before official reporting time):</span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">+1.0 pt</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-red-900/50 bg-red-950/30">
                  <span className="text-xs font-bold text-red-200">Penalty Point (disciplinary / handball / fouls):</span>
                  <span className="text-xs font-black text-red-400 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/40 shadow-sm shadow-red-500/20">
                    -0.5 / -1.0 pt (Deducted from Player's Total)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 italic">
                * Note: Penalty points are strictly deducted from the player's total and Best 13 league points.
              </p>
            </section>
          </div>

          <div className="space-y-6">
            {/* Rule 4: Tie-Breakers */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-white font-black text-base flex items-center">
                <ListOrdered className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>4. Tie-Breaker Hierarchy</span>
              </h4>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4 font-medium mt-2">
                <li className="text-slate-200"><strong className="text-amber-400">Most Match Wins</strong></li>
                <li className="text-slate-200"><strong className="text-emerald-400">Highest Number of On-Time Bonuses</strong></li>
                <li className="text-slate-200"><strong className="text-slate-300">Highest Number of Attendances</strong></li>
                <li className="text-slate-200"><strong className="text-slate-400">Organizer's Decision</strong></li>
              </ol>
            </section>

            {/* Rule 5: Deliberate Handball */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-white font-black text-base flex items-center">
                <Hand className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>5. Deliberate Handball Regulation</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                A deliberate handball inside the penalty area results in a penalty from the kick-off spot. Decided by the <strong className="text-white">two match-day captains</strong> and <strong className="text-amber-400">one additional player</strong> (the player with the lowest points in the league table present at the match).
              </p>
            </section>

            {/* Rule 6: Registration & Protocol */}
            <section className="space-y-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-white font-black text-base flex items-center">
                <CalendarDays className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>6. Registration & Reporting Deadlines</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Players must add their name to the match list before <strong className="text-white">00:00 midnight prior to matchday</strong>. Arriving on or before 6:00 AM secures the on-time bonus (+1.0 pt).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
