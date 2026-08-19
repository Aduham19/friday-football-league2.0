import React, { useState, useRef } from 'react';
import { X, UserPlus, Image as ImageIcon, Sparkles, Trash2, Camera } from 'lucide-react';
import { PRESET_AVATARS, processAndCompressImage } from '../../utils/imageUtils';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (name: string, avatar: string) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
}) => {
  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await processAndCompressImage(e.target.files[0], 256, 256, 0.85);
        setAvatarPreview(compressed);
      } catch (err) {
        console.error('Failed to compress avatar', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddPlayer(name.trim().toUpperCase(), avatarPreview);
    setName('');
    setAvatarPreview('');
    setShowPresets(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <UserPlus className="w-5 h-5 text-amber-400 mr-2" />
            <span>Register New Player</span>
          </h3>
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
              Player Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MOHAMED ALI"
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-bold placeholder-slate-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Profile Photo (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{showPresets ? 'Hide Badges' : 'Choose Badge'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-amber-400 font-bold text-lg">
                    {name ? name.charAt(0).toUpperCase() : <ImageIcon className="w-5 h-5 text-slate-500" />}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => setAvatarPreview('')}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Presets Grid */}
            {showPresets && (
              <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 animate-in fade-in duration-150">
                <span className="text-[10px] text-slate-400 font-bold block mb-2">
                  Select a football avatar or badge:
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarPreview(preset.svgDataUrl);
                        setShowPresets(false);
                      }}
                      className="p-1 rounded-lg border border-slate-800 hover:border-amber-500 bg-slate-900 transition hover:scale-105"
                      title={preset.name}
                    >
                      <img src={preset.svgDataUrl} alt={preset.name} className="w-full h-auto rounded" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 transition cursor-pointer active:scale-95"
            >
              Register Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
