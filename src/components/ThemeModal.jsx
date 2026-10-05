import React from 'react';
import { X, Palette, Check } from 'lucide-react';
import { THEMES, saveStoredTheme } from '../utils/themes';

export default function ThemeModal({ isOpen, onClose, currentTheme, onSelectTheme }) {
  if (!isOpen) return null;

  const handleSelect = (themeId) => {
    saveStoredTheme(themeId);
    onSelectTheme(THEMES[themeId]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <Palette className="text-brandOrange" size={20} />
            <div>
              <h3 className="text-base font-bold text-white">Board & Pawn Themes</h3>
              <p className="text-[11px] text-gray-400">Choose your visual aesthetic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme List */}
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
          {Object.values(THEMES).map((th) => {
            const isSelected = currentTheme.id === th.id;

            return (
              <div
                key={th.id}
                onClick={() => handleSelect(th.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-brandOrange bg-brandOrange/10 shadow-md'
                    : 'border-borderDark/60 bg-bgDark/60 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Miniature swatch preview */}
                  <div
                    style={{ backgroundColor: th.boardBg }}
                    className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0"
                  >
                    {/* Mini cells */}
                    <div className="grid grid-cols-2 gap-1 p-1 w-full h-full">
                      <div style={{ backgroundColor: th.cellBg }} className="rounded-xs flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${th.redPawn}`} />
                      </div>
                      <div style={{ backgroundColor: th.cellBg }} className="rounded-xs" />
                      <div style={{ backgroundColor: th.cellBg }} className="rounded-xs" />
                      <div style={{ backgroundColor: th.cellBg }} className="rounded-xs flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${th.bluePawn}`} />
                      </div>
                    </div>
                    {/* Mini Wall Bar */}
                    <div
                      className={`absolute inset-x-2 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r ${th.wallGradient} rounded-full`}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-100">{th.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{th.subtitle}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-brandOrange text-black flex items-center justify-center shrink-0 shadow-sm">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
