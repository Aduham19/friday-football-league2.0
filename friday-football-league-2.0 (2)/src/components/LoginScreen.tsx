import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Info, LogIn, Users } from 'lucide-react';
import { AuthConfig, AuthSession } from '../types';
import { authenticate, getAuthConfig } from '../utils/auth';

interface LoginScreenProps {
  authConfig?: AuthConfig;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ authConfig: propAuthConfig, onLoginSuccess }) => {
  const authConfig = propAuthConfig || getAuthConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'admin'>('viewer');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = authenticate(username, password, authConfig);
    if (result.success && result.session) {
      onLoginSuccess(result.session);
    } else {
      setError(result.error || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500 selection:text-slate-950">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/30 mx-auto transform hover:scale-105 transition">
            ⚽
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
              FRIDAY FOOTBALL LEAGUE 2.0
            </h1>
            <p className="text-xs text-amber-400/90 font-bold tracking-wide mt-1">
              Individual Points Competition • 15 Match Season
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {/* Role Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('viewer');
                setError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'viewer'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Viewer / Player</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin (Editor)</span>
            </button>
          </div>

          {/* Role description banner */}
          <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
            activeTab === 'viewer'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
          }`}>
            {activeTab === 'viewer' ? (
              <div className="flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Viewer & Player Portal</p>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    Sign in with your league access code to check live standings, match records, and player statistics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">League Organizer Access</p>
                  <p className="text-[11px] text-amber-300/90 mt-0.5">
                    Sign in with administrator credentials to record scores, register players, and manage league data.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                User ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter username / ID..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter password..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg active:scale-98 ${
                activeTab === 'viewer'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-950/40'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {activeTab === 'viewer' ? 'Sign In as Viewer' : 'Sign In as Admin'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Friday Football League 2.0 • Official Individual Points Competition
        </p>
      </div>
    </div>
  );
};
