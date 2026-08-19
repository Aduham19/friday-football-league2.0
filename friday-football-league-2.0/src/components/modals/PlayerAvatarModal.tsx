import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Link, Trash2, Check, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Player } from '../../types';
import { formatPlayerName } from '../../constants';
import { PRESET_AVATARS, processAndCompressImage } from '../../utils/imageUtils';

interface PlayerAvatarModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (playerId: string, avatarDataUrl: string) => void;
}

export const PlayerAvatarModal: React.FC<PlayerAvatarModalProps> = ({
  player,
  isOpen,
  onClose,
  onSaveAvatar,
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setCurrentAvatar(player.avatar || '');
      setUrlInput('');
      setErrorMsg('');
      setActiveTab('upload');
    }
    return () => {
      stopCamera();
    };
  }, [player, isOpen]);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not access camera. Please allow camera permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const handleCaptureCamera = async () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const minDim = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = ((video.videoWidth || minDim) - minDim) / 2;
        const startY = ((video.videoHeight || minDim) - minDim) / 2;
        ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 256, 256);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCurrentAvatar(dataUrl);
        stopCamera();
        setActiveTab('upload');
      }
    } catch (e) {
      setErrorMsg('Failed to capture camera snapshot.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !player) return null;

  const formattedName = formatPlayerName(player.name);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsProcessing(true);
        setErrorMsg('');
        const compressed = await processAndCompressImage(file, 256, 256, 0.85);
        setCurrentAvatar(compressed);
      } catch (err) {
        console.error('Error processing image:', err);
        setErrorMsg('Failed to process image. Please try another file.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleApplyUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsProcessing(true);
      setErrorMsg('');
      const compressed = await processAndCompressImage(urlInput.trim(), 256, 256, 0.85);
      setCurrentAvatar(compressed);
      setUrlInput('');
      setActiveTab('upload');
    } catch (err) {
      // If CORS prevents canvas draw, use the URL directly
      setCurrentAvatar(urlInput.trim());
      setUrlInput('');
      setActiveTab('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = (presetSvg: string) => {
    setCurrentAvatar(presetSvg);
  };

  const handleRemovePhoto = () => {
    setCurrentAvatar('');
    setErrorMsg('');
  };

  const handleSave = () => {
    stopCamera();
    onSaveAvatar(player.id, currentAvatar);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-700 space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Player Profile Picture</h3>
              <p className="text-xs text-amber-400/90 font-bold">{formattedName}</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Avatar Preview Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-xl bg-slate-900 flex items-center justify-center text-amber-400 font-black text-3xl shrink-0 relative">
              {currentAvatar ? (
                <img src={currentAvatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <span>{formattedName.charAt(0)}</span>
              )}
            </div>
            {currentAvatar && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-1 border-2 border-slate-900 shadow">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>{currentAvatar ? 'Custom Photo Assigned' : 'Default Initials Badge'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {currentAvatar
                ? 'Ready to save. This picture will appear on standings, match sheets, and player cards.'
                : 'Upload a picture from your device, take a photo with your camera, or pick a football avatar.'}
            </p>
            {currentAvatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center justify-center sm:justify-start gap-1 transition pt-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Picture & Reset to Initials</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('presets');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('url');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Web URL</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-900/50 text-red-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Upload from Device */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 hover:bg-slate-900 rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-200">
                Click to browse photo from phone or computer
              </div>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG, WEBP, HEIC. Automatically optimized for Firebase live sync.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Live Camera Snapshot */}
        {activeTab === 'camera' && (
          <div className="space-y-3 text-center">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square max-w-[280px] mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              {!isCameraActive && (
                <div className="p-4 space-y-2 text-slate-400">
                  <Camera className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">Initializing device camera...</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-bold"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {isCameraActive && (
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCaptureCamera}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Preset Football Avatars & Badges */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-bold">
              Choose a football badge or role avatar:
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = currentAvatar === preset.svgDataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.svgDataUrl)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                      <img src={preset.svgDataUrl} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Direct Web Image URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Image Web Link (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/player-photo.jpg"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim() || isProcessing}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40 transition cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
