import React from 'react';
import { Trophy, Gem, Sparkles, Award, ArrowRight, RotateCcw } from 'lucide-react';

export default function SetWonModal({
  isOpen,
  winner = 'you',
  score = '3-1',
  opponentName = 'Opponent',
  onContinue,
  onLobby,
}) {
  if (!isOpen) return null;

  const isYouWin = winner === 'you';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#241f17] via-[#1a1714] to-[#121110] border-2 border-amber-500/60 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Confetti / Sparkle Accents */}
        <div className="absolute top-4 left-5 text-amber-400/60 animate-bounce text-sm">✨</div>
        <div className="absolute top-6 right-6 text-cyan-400/60 animate-pulse text-sm">💎</div>
        <div className="absolute bottom-16 left-6 text-amber-400/40 text-xs">🎉</div>

        {/* Grand Trophy Centerpiece */}
        <div className="relative my-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/40 ring-4 ring-amber-300/30 animate-pulse">
            <Trophy className="text-black" size={42} strokeWidth={2.2} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-black p-1.5 rounded-full border-2 border-[#1a1714] shadow-md">
            <Gem size={14} className="fill-black" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 mt-2">
          {isYouWin ? 'SET CHAMPION!' : 'SET COMPLETED'}
        </h2>
        <p className="text-xs text-gray-300 mt-1 mb-3 font-medium">
          {isYouWin
            ? `Dominant performance against ${opponentName}!`
            : `Hard fought series against ${opponentName}.`}
        </p>

        {/* Score Pill */}
        <div className="flex items-center gap-2 bg-black/40 border border-amber-500/40 px-4 py-1.5 rounded-2xl mb-4 shadow-inner">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Final Series</span>
          <span className="text-lg font-mono font-black text-amber-300">{score}</span>
        </div>

        {/* Set Reward Badge (Only for winners) */}
        {isYouWin ? (
          <div className="w-full bg-gradient-to-r from-cyan-950/80 via-cyan-900/60 to-cyan-950/80 border border-cyan-400/60 rounded-2xl p-3 flex items-center justify-between shadow-lg mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                <Gem size={18} className="fill-cyan-400/30" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-white">SET COMPLETION REWARD</div>
                <div className="text-[11px] text-cyan-300 font-semibold">+1 Diamond 💎 Added to Wallet</div>
              </div>
            </div>
            <span className="text-sm font-black text-cyan-400 font-mono">+1 💎</span>
          </div>
        ) : (
          <div className="w-full bg-cardDark/80 border border-borderDark/80 rounded-2xl p-3 text-xs text-gray-400 mb-5">
            Series finished. Start a fresh Best-of-3 to earn the +1 Diamond bounty!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-green-500/25 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Play Next Set (Rematch)</span>
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={onLobby}
            className="w-full bg-[#2a2620] hover:bg-[#38332b] text-gray-300 hover:text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
}
