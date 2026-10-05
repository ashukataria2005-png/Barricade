import React from 'react';
import { X, Volume2, VolumeX, Smartphone, RotateCcw, Sliders } from 'lucide-react';
import { DEFAULT_SETTINGS, saveStoredSettings } from '../utils/settings';

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }) {
  if (!isOpen) return null;

  const current = settings || DEFAULT_SETTINGS;

  const handleToggleSfx = () => {
    const updated = { ...current, sfxEnabled: !current.sfxEnabled };
    saveStoredSettings(updated);
    onUpdateSettings(updated);
  };

  const handleVolumeChange = (e) => {
    const vol = parseInt(e.target.value, 10);
    const updated = { ...current, volume: vol };
    saveStoredSettings(updated);
    onUpdateSettings(updated);
  };

  const handleToggleHaptics = () => {
    const updated = { ...current, hapticsEnabled: !current.hapticsEnabled };
    saveStoredSettings(updated);
    onUpdateSettings(updated);
    if (updated.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (err) {}
    }
  };

  const handleReset = () => {
    saveStoredSettings(DEFAULT_SETTINGS);
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <Sliders className="text-brandOrange" size={20} />
            <div>
              <h3 className="text-base font-bold text-white">Audio & Haptics</h3>
              <p className="text-[11px] text-gray-400">Manage sound effects and vibration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-3 py-1">
          {/* SFX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-bgDark/60 border border-borderDark/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cardDark text-brandOrange border border-borderDark/60">
                {current.sfxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-100">Sound Effects</h4>
                <p className="text-[11px] text-gray-400">Pawn clicks, barricade slams & win chimes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSfx}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                current.sfxEnabled ? 'bg-brandOrange' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  current.sfxEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-bgDark/60 border border-borderDark/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                <span>SFX Volume</span>
              </div>
              <span className="text-xs font-mono font-bold text-brandOrange">{current.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={current.volume}
              onChange={handleVolumeChange}
              disabled={!current.sfxEnabled}
              className="w-full accent-brandOrange cursor-pointer disabled:opacity-40 h-2 bg-cardDark rounded-lg"
            />
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-bgDark/60 border border-borderDark/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cardDark text-cyan-400 border border-borderDark/60">
                <Smartphone size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-100">Mobile Haptics</h4>
                <p className="text-[11px] text-gray-400">Tactile vibration on moves and blocks</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleHaptics}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                current.hapticsEnabled ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  current.hapticsEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-borderDark/60">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-borderDark/80 hover:bg-borderDark/50 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-brandOrange hover:bg-amber-600 text-black py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
