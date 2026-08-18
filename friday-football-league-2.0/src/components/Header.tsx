import React from 'react';
import { Trophy, Calendar, Users, BookOpen, UserPlus, ClipboardList, Shield, LogOut, KeyRound, Lock, Eye, Database, RefreshCw } from 'lucide-react';
import { AuthSession, TabType } from '../types';
import { FFLogo } from './FFLogo';

interface HeaderProps {
  currentTab: TabType;
  authSession: AuthSession | null;
  matchCount?: number;
  isCloudLive?: boolean;
  isSyncing?: boolean;
  onForceSync?: () => void;
  onTabChange: (tab: TabType) => void;
  onOpenAddPlayer: () => void;
  onOpenRecordMatch: (matchId?: number) => void;
  onOpenSecurityModal: () => void;
  onOpenDataBackup?: () => void;
  onOpenAdminUnlock: (actionName?: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  authSession,
  matchCount = 15,
  isCloudLive = true,
  isSyncing = false,
  onForceSync,
  onTabChange,
  onOpenAddPlayer,
  onOpenRecordMatch,
  onOpenSecurityModal,
  onOpenDataBackup,
  onOpenAdminUnlock,
  onLogout,
}) => {
  const isAdmin = authSession?.role === 'admin';

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30 sticky top-0 z-40 backdrop-blur-md shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <FFLogo className="w-11 h-13 shrink-0 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]" />
          <div className="hidden min-[420px]:block">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent leading-tight">
                FRIDAY FOOTBALL LEAGUE 2.0
              </h1>
              <button
                onClick={onForceSync}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 cursor-pointer transition active:scale-95"
                title="Click to instantly re-sync live data from cloud"
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : 'animate-pulse'}`}></span>
                <span>{isSyncing ? 'Syncing...' : 'Cloud Live'}</span>
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-bold">
              <span>Individual Points</span>
              <span className="w-1 h-1 rounded-full bg-amber-400/60 inline-block"></span>
              <span>{matchCount} Matches</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-1.5 rounded-xl border border-amber-500/20 shadow-inner">
          <button
            onClick={() => onTabChange('standings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              currentTab === 'standings'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Standings</span>
          </button>

          <button
            onClick={() => onTabChange('matches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              currentTab === 'matches'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Matches ({matchCount})</span>
          </button>

          <button
            onClick={() => onTabChange('players')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              currentTab === 'players'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Players & Reg</span>
          </button>

          <button
            onClick={() => onTabChange('rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              currentTab === 'rules'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Rules</span>
          </button>
        </nav>

          {/* User Role Badge & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Role Status Tag */}
            {isAdmin ? (
              <div className="flex items-center space-x-1.5">
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin (Editor)</span>
                </span>

                {onOpenDataBackup && (
                  <button
                    onClick={onOpenDataBackup}
                    className="p-2 bg-slate-900 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl transition cursor-pointer"
                    title="Data Management & Backups"
                  >
                    <Database className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onOpenSecurityModal}
                  className="p-2 bg-slate-900 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl transition cursor-pointer"
                  title="Manage Passwords"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenAddPlayer}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition flex items-center space-x-1 cursor-pointer active:scale-95"
                  title="Register New Player"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Player</span>
                </button>

                <button
                  onClick={() => onOpenRecordMatch()}
                  className="bg-slate-900 hover:bg-slate-850 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/30 shadow-md transition flex items-center space-x-1 cursor-pointer active:scale-95"
                  title="Record Match Results & Attendance"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Record Match</span>
                </button>

                <button
                  onClick={onLogout}
                  className="px-2.5 py-2 bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800/40 rounded-xl transition cursor-pointer flex items-center space-x-1"
                  title="Exit Admin Mode (Switch to Read-Only Viewer)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-xs font-bold">Exit Admin</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-sm">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Viewer (Read-Only)</span>
                </span>

                <button
                  onClick={() => onOpenAdminUnlock('unlock administrator tools')}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-amber-900/30 active:scale-95"
                  title="Login as League Admin to edit data"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}
          </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden flex justify-around bg-slate-950 border-t border-amber-500/20 py-2 px-1">
        <button
          onClick={() => onTabChange('standings')}
          className={`flex flex-col items-center text-[11px] font-bold py-1 px-2 rounded-lg ${
            currentTab === 'standings' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span>Standings</span>
        </button>

        <button
          onClick={() => onTabChange('matches')}
          className={`flex flex-col items-center text-[11px] font-bold py-1 px-2 rounded-lg ${
            currentTab === 'matches' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Matches</span>
        </button>

        <button
          onClick={() => onTabChange('players')}
          className={`flex flex-col items-center text-[11px] font-bold py-1 px-2 rounded-lg ${
            currentTab === 'players' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Players</span>
        </button>

        <button
          onClick={() => onTabChange('rules')}
          className={`flex flex-col items-center text-[11px] font-bold py-1 px-2 rounded-lg ${
            currentTab === 'rules' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Rules</span>
        </button>
      </div>
    </header>
  );
};
