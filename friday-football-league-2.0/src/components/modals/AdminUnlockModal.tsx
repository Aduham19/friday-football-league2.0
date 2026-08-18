import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { AuthConfig, AuthSession } from '../../types';
import { authenticate, getAuthConfig } from '../../utils/auth';

interface AdminUnlockModalProps {
  isOpen: boolean;
  authConfig?: AuthConfig;
  onClose: () => void;
  onUnlockSuccess?: (session: AuthSession) => void;
  onSuccess?: (session: AuthSession) => void;
  actionName?: string;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  authConfig: propAuthConfig,
  onClose,
  onUnlockSuccess,
  onSuccess,
  actionName = 'perform this action',
}) => {
  const authConfig = propAuthConfig || getAuthConfig();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(authConfig.adminUsername || 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setUsername(authConfig.adminUsername || 'admin');
    }
  }, [isOpen, authConfig.adminUsername]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = authenticate(username, password, authConfig);
    if (result.success && result.session && result.session.role === 'admin') {
      if (onUnlockSuccess) onUnlockSuccess(result.session);
      if (onSuccess) onSuccess(result.session);
      onClose();
    } else {
      setError('Incorrect admin credentials. Only organizers can make edits.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-amber-500/40 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Admin Privileges Required</h3>
              <p className="text-xs text-slate-400">Sign in with Admin credentials to {actionName}</p>
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
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin User ID
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder={authConfig.adminUsername}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter admin password..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl pl-3 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer shadow-lg shadow-amber-900/40 active:scale-95 flex items-center space-x-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Admin Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
