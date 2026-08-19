import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'RESET';

  const handleExecute = () => {
    if (!isConfirmed) return;
    onConfirmReset();
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-red-500/40 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-red-400 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span>Danger Zone: Reset Match Data</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">
            Are you sure you want to reset all match results, attendance, and scores?
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This action will clear recorded match attendance, wins, goals, and points. <strong className="text-emerald-400 font-bold">Your registered players roster and profile photos will be safely preserved.</strong>
          </p>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Type <span className="text-red-400 font-bold">RESET</span> below to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET here"
              className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white font-bold tracking-widest focus:outline-none uppercase"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecute}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isConfirmed
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-95 shadow-red-900/40'
                : 'bg-red-950/40 text-red-400/40 border border-red-900/30 cursor-not-allowed'
            }`}
          >
            Reset Match Data
          </button>
        </div>
      </div>
    </div>
  );
};
