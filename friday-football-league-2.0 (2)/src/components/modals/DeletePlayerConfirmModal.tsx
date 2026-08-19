import React from 'react';
import { X, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Player } from '../../types';
import { formatPlayerName } from '../../constants';

interface DeletePlayerConfirmModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onConfirm: (playerId: string) => void;
}

export const DeletePlayerConfirmModal: React.FC<DeletePlayerConfirmModalProps> = ({
  isOpen,
  player,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !player) return null;

  const formattedName = formatPlayerName(player.name);

  const handleExecute = () => {
    onConfirm(player.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-red-500/50 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Remove Player</h3>
              <p className="text-xs text-slate-400">Confirm removal from league roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile Preview Card */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span>{formattedName.charAt(0)}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-base font-black text-white truncate">{formattedName}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500/80" />
              <span>Registered Competitor</span>
            </p>
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/40 text-xs text-red-300/90 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-bold text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Are you sure you want to remove this player?</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
            This will remove <strong className="text-white font-bold">{formattedName}</strong> and any recorded match attendance/goals for them from the current season.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/40 transition cursor-pointer active:scale-95 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Remove Player</span>
          </button>
        </div>
      </div>
    </div>
  );
};
