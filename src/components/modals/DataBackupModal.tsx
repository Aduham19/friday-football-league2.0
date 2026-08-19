import React, { useState, useEffect } from 'react';
import { X, Database, Download, Upload, RotateCcw, Clock, CheckCircle2, FileJson, RefreshCw } from 'lucide-react';
import { LeagueData } from '../../types';
import { getLocalSnapshots, syncLeagueDataToServer, scanAndRecoverAnyLocalData, fetchServerLeagueData } from '../../utils/storage';

interface DataBackupModalProps {
  isOpen: boolean;
  leagueData: LeagueData;
  onClose: () => void;
  onRestoreData: (restoredData: LeagueData) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  leagueData,
  onClose,
  onRestoreData,
  onShowToast,
}) => {
  const [snapshots, setSnapshots] = useState<{ timestamp: number; date: string; matchCount: number; data: LeagueData }[]>([]);
  const [recoveredCandidate, setRecoveredCandidate] = useState<LeagueData | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<'backup' | 'snapshots' | 'import'>('backup');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getLocalSnapshots());
      const rec = scanAndRecoverAnyLocalData();
      if (rec && Object.keys(rec.matchResults || {}).length > 0) {
        setRecoveredCandidate(rec);
      } else {
        setRecoveredCandidate(null);
      }
      setImportJsonText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leagueData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `FFL_League_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('League backup JSON downloaded successfully!', 'success');
    } catch (e) {
      onShowToast('Failed to generate download file', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.players) && Array.isArray(parsed.matches)) {
          const matchCount = Object.keys(parsed.matchResults || {}).length;
          onRestoreData(parsed);
          onShowToast(`Restored ${parsed.players.length} players and ${matchCount} matches from backup file!`, 'success');
          onClose();
        } else {
          onShowToast('Invalid backup file format. Expected players and matches arrays.', 'error');
        }
      } catch (err) {
        onShowToast('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!importJsonText.trim()) {
      onShowToast('Please paste valid JSON data.', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (parsed && Array.isArray(parsed.players) && Array.isArray(parsed.matches)) {
        const matchCount = Object.keys(parsed.matchResults || {}).length;
        onRestoreData(parsed);
        onShowToast(`Restored ${parsed.players.length} players and ${matchCount} matches successfully!`, 'success');
        onClose();
      } else {
        onShowToast('JSON does not match League Data structure.', 'error');
      }
    } catch (e) {
      onShowToast('Invalid JSON syntax. Please check the JSON format.', 'error');
    }
  };

  const handleRestoreSnapshot = (snapData: LeagueData) => {
    const count = Object.keys(snapData.matchResults || {}).length;
    onRestoreData(snapData);
    onShowToast(`Snapshot restored! (${count} recorded matches, ${snapData.players.length} players)`, 'success');
    onClose();
  };

  const handleForcePushToServer = async () => {
    setIsSyncing(true);
    const ok = await syncLeagueDataToServer(leagueData);
    setIsSyncing(false);
    if (ok) {
      onShowToast('Pushed current live data to server successfully!', 'success');
    } else {
      onShowToast('Failed to push to server. Local data is safely saved.', 'error');
    }
  };

  const handleForcePullFromServer = async () => {
    setIsSyncing(true);
    const serverData = await fetchServerLeagueData();
    setIsSyncing(false);
    if (serverData && Array.isArray(serverData.players) && serverData.players.length > 0) {
      onRestoreData(serverData);
      onShowToast('Pulled and restored latest server data!', 'success');
      onClose();
    } else {
      onShowToast('Could not retrieve data from server.', 'error');
    }
  };

  const recordedCount = Object.keys(leagueData.matchResults || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Data Management & Recovery</h2>
              <p className="text-xs text-slate-400">Restore match records, player scores, or export JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4">
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export & Status</span>
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'snapshots'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore History ({snapshots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Current Live State</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {leagueData.players.length} Registered Players • {recordedCount} Recorded Matches
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {recoveredCandidate && Object.keys(recoveredCandidate.matchResults || {}).length > 0 && (
                <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/35 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold">
                      <RotateCcw className="w-4 h-4 text-blue-400" />
                      <span>Detected Match Records in Device Cache</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/40">
                      {Object.keys(recoveredCandidate.matchResults || {}).length} Matches
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/90 leading-relaxed">
                    Found previous match score sheets and player records saved in your browser history. Click below to immediately restore all recorded matches and player stats:
                  </p>
                  <button
                    onClick={() => handleRestoreSnapshot(recoveredCandidate)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/40 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Restore All Detected Match Records ({Object.keys(recoveredCandidate.matchResults || {}).length} Matches)</span>
                  </button>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Download Full JSON Backup</h4>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    Save a permanent copy of all players, photos, and match scores to your device.
                  </p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/30 transition flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Sync Actions */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Firebase Cloud Database & Live Sync</span>
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Firebase Cloud Firestore provides instant live synchronization across all computers, tablets, and mobile devices. Any admin score entries or player updates reflect instantly for all viewers in real-time.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleForcePushToServer}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Force Push to Firebase & Server</span>
                  </button>
                  <button
                    onClick={handleForcePullFromServer}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Refresh & Pull from Firebase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Automated device snapshots saved whenever match scores or rosters are updated. Click <strong className="text-white font-semibold">Restore</strong> on any point in time:
              </p>

              {snapshots.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
                  No automated snapshots recorded yet. Snapshots are created whenever a match is recorded or updated.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {snapshots.map((snap, idx) => {
                    const count = Object.keys(snap.data?.matchResults || {}).length;
                    const pCount = snap.data?.players?.length || 37;
                    return (
                      <div
                        key={snap.timestamp || idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-black text-slate-100">{snap.date}</div>
                            <div className="text-[11px] text-slate-400">
                              <span className="text-amber-400 font-bold">{count} Recorded Matches</span> • {pCount} Players
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreSnapshot(snap.data)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black transition flex items-center space-x-1 shrink-0 cursor-pointer active:scale-95 shadow-md shadow-amber-900/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Upload Backup JSON File:
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl cursor-pointer bg-slate-950/40 transition">
                  <FileJson className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Click to upload FFL_League_Backup.json</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">or drag and drop file here</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Or Paste JSON Text:
                </label>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='Paste JSON content here: {"players": [...], "matches": [...]}'
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePasteImport}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-md shadow-amber-900/40"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Pasted JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
