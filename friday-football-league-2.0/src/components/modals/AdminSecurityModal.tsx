import React, { useState, useEffect } from 'react';
import { X, Shield, KeyRound, Check, Copy, RefreshCw, Eye, EyeOff, Users, AlertCircle } from 'lucide-react';
import { AuthConfig } from '../../types';
import { DEFAULT_AUTH_CONFIG, getAuthConfig } from '../../utils/auth';

interface AdminSecurityModalProps {
  isOpen: boolean;
  authConfig?: AuthConfig;
  onClose: () => void;
  onSaveConfig?: (newConfig: AuthConfig) => void;
  onUpdateConfig?: (newConfig: AuthConfig) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({
  isOpen,
  authConfig: propAuthConfig,
  onClose,
  onSaveConfig,
  onUpdateConfig,
  onShowToast,
}) => {
  const activeAuthConfig = propAuthConfig || getAuthConfig();
  const [adminUsername, setAdminUsername] = useState(activeAuthConfig.adminUsername || 'admin');
  const [adminPassword, setAdminPassword] = useState(activeAuthConfig.adminPassword || 'admin2026');
  const [viewerUsername, setViewerUsername] = useState(activeAuthConfig.viewerUsername || 'viewer');
  const [viewerPassword, setViewerPassword] = useState(activeAuthConfig.viewerPassword || 'ffl2026');

  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showViewerPass, setShowViewerPass] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdminUsername(activeAuthConfig.adminUsername || 'admin');
      setAdminPassword(activeAuthConfig.adminPassword || 'admin2026');
      setViewerUsername(activeAuthConfig.viewerUsername || 'viewer');
      setViewerPassword(activeAuthConfig.viewerPassword || 'ffl2026');
      setCopied(false);
    }
  }, [isOpen, activeAuthConfig]);

  if (!isOpen) return null;

  const notify = (msg: string, type?: 'success' | 'error' | 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminUsername.trim() || !adminPassword.trim()) {
      notify('Admin User ID and Password cannot be empty', 'error');
      return;
    }

    if (!viewerUsername.trim() || !viewerPassword.trim()) {
      notify('Viewer User ID and Password cannot be empty', 'error');
      return;
    }

    const updatedConfig: AuthConfig = {
      adminUsername: adminUsername.trim(),
      adminPassword: adminPassword.trim(),
      viewerUsername: viewerUsername.trim(),
      viewerPassword: viewerPassword.trim(),
    };

    if (onUpdateConfig) onUpdateConfig(updatedConfig);
    if (onSaveConfig) onSaveConfig(updatedConfig);

    notify('Security credentials updated successfully!', 'success');
    onClose();
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all User IDs and Passwords back to standard default settings?')) {
      setAdminUsername(DEFAULT_AUTH_CONFIG.adminUsername);
      setAdminPassword(DEFAULT_AUTH_CONFIG.adminPassword);
      setViewerUsername(DEFAULT_AUTH_CONFIG.viewerUsername);
      setViewerPassword(DEFAULT_AUTH_CONFIG.viewerPassword);
      notify('Reset form to defaults. Click "Save Changes" to apply.', 'info');
    }
  };

  const copyShareCredentials = () => {
    const shareText = `🏆 *Friday Football League 2.0* ⚽\n\nLogin to view live standings, 15-week match sheets, and individual player scores:\n\n👤 *User ID:* ${viewerUsername}\n🔑 *Password:* ${viewerPassword}\n\n(Multiple players can log in using this User ID simultaneously!)`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      onShowToast('Viewer credentials copied to clipboard! Ready to share.', 'success');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      onShowToast('Could not access clipboard directly.', 'error');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Access & Password Manager</h3>
              <p className="text-xs text-slate-400">Configure Viewer (Multi-User) and Admin Logins</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Share Card */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Share Viewer Credentials with Players</span>
            </h4>
            <p className="text-[11px] text-emerald-200/80">
              All league members use this shared User ID & Password to view live tables on their phones.
            </p>
          </div>

          <button
            type="button"
            onClick={copyShareCredentials}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer shadow active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-emerald-100" />}
            <span>{copied ? 'Copied!' : 'Copy Share Info'}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Viewer Credentials */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>1. Shared Viewer Credentials (Read-Only)</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                Unlimited Multi-User
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Viewer User ID
                </label>
                <input
                  type="text"
                  required
                  value={viewerUsername}
                  onChange={(e) => setViewerUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Viewer Password
                </label>
                <div className="relative">
                  <input
                    type={showViewerPass ? 'text' : 'password'}
                    required
                    value={viewerPassword}
                    onChange={(e) => setViewerPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowViewerPass(!showViewerPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showViewerPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Admin Credentials */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>2. League Admin Credentials (Full Edit Powers)</span>
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Protected Editor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Admin User ID
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 py-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Standard Defaults</span>
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer shadow-lg shadow-amber-900/40 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
