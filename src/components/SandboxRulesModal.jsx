import React, { useState } from 'react';
import { X, Sliders, Shield, Clock, Zap, Users, Cpu, Play, Sparkles } from 'lucide-react';

export default function SandboxRulesModal({
  isOpen,
  onClose,
  onStartCustomGame,
}) {
  const [wallsCount, setWallsCount] = useState(10);
  const [increment, setIncrement] = useState(0);
  const [mode, setMode] = useState('local'); // 'local' | 'ai'
  const [aiLevel, setAiLevel] = useState('medium');

  if (!isOpen) return null;

  const wallOptions = [
    { count: 5, label: '5 Walls', desc: 'Blitz Sprint' },
    { count: 8, label: '8 Walls', desc: 'Tactical' },
    { count: 10, label: '10 Walls', desc: 'Official Standard' },
    { count: 15, label: '15 Walls', desc: 'Fortress Maze' },
  ];

  const incrementOptions = [
    { sec: 0, label: '+0s', desc: 'Fixed Clock' },
    { sec: 2, label: '+2s', desc: 'Blitz Increment' },
    { sec: 5, label: '+5s', desc: 'Fischer Classic' },
  ];

  const handleStart = () => {
    onStartCustomGame({
      startingWalls: wallsCount,
      incrementSeconds: increment,
      gameMode: mode,
      aiDifficulty: aiLevel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Sandbox & Custom Rules
              </h2>
              <p className="text-[11px] text-zinc-400">
                Customize barricade count, clock increment & game rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Starting Barricades Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Shield size={14} className="text-amber-400" />
                Starting Barricades (per player)
              </span>
              <span className="text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                {wallsCount} Walls
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {wallOptions.map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setWallsCount(opt.count)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    wallsCount === opt.count
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fischer Clock Increment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-400" />
                Clock Increment Bonus (per move)
              </span>
              <span className="text-blue-400 font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                +{increment}s / move
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {incrementOptions.map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setIncrement(opt.sec)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    increment === opt.sec
                      ? 'bg-blue-500/15 border-blue-500/60 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <span className="font-semibold text-zinc-300 block mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-400" />
              Opponent Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('local')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                  mode === 'local'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white ring-1 ring-emerald-500/40'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <Users size={16} className={mode === 'local' ? 'text-emerald-400' : 'text-zinc-400'} />
                <div className="text-left">
                  <div className="font-bold text-xs">Pass & Play</div>
                  <div className="text-[10px] text-zinc-400">Local 2-Player</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                  mode === 'ai'
                    ? 'bg-indigo-500/15 border-indigo-500/60 text-white ring-1 ring-indigo-500/40'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <Cpu size={16} className={mode === 'ai' ? 'text-indigo-400' : 'text-zinc-400'} />
                <div className="text-left">
                  <div className="font-bold text-xs">StockBot AI</div>
                  <div className="text-[10px] text-zinc-400">Computer match</div>
                </div>
              </button>
            </div>
          </div>

          {mode === 'ai' && (
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl animate-in fade-in duration-150">
              <span className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
                Bot Difficulty:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {['easy', 'medium', 'hard'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAiLevel(lvl)}
                    className={`py-1.5 rounded-lg border text-center font-bold capitalize text-[11px] transition ${
                      aiLevel === lvl
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setWallsCount(10);
              setIncrement(0);
              setMode('local');
            }}
            className="py-3 px-3 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl font-semibold transition text-xs"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2 text-xs"
          >
            <Play size={14} className="fill-white" />
            <span>Start Custom Match</span>
          </button>
        </div>
      </div>
    </div>
  );
}
