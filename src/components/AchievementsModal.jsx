import React, { useState } from 'react';
import {
  X,
  Trophy,
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Flame,
  Zap,
  Filter
} from 'lucide-react';
import { getAchievementsList } from '../utils/achievements';

export default function AchievementsModal({ isOpen, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  if (!isOpen) return null;

  const achievements = getAchievementsList();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements.reduce((acc, a) => acc + (a.unlocked ? a.points : 0), 0);
  const maxPoints = achievements.reduce((acc, a) => acc + a.points, 0);

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="text-brandOrange" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Trophies & Badges</h3>
              <p className="text-[11px] text-gray-400">Complete challenges & earn points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress & Points Summary Card */}
        <div className="bg-bgDark/80 border border-borderDark/80 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Award size={14} className="text-brandOrange" />
              <span>Completion Progress</span>
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {unlockedCount} <span className="text-xs text-gray-400 font-normal">/ {achievements.length} Badges</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-amber-400 font-bold">
              <Sparkles size={13} />
              <span>{totalPoints} pts</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Total: {maxPoints} pts
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-bgDark/40 p-1 rounded-xl border border-borderDark/40 text-xs">
          {[
            { id: 'all', label: `All (${achievements.length})` },
            { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
            { id: 'locked', label: `Locked (${achievements.length - unlockedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-brandOrange text-black shadow-xs font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Badges List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition relative flex items-start gap-3 ${
                item.unlocked
                  ? 'bg-gradient-to-r from-amber-500/10 via-cardDark to-cardDark border-amber-500/40 shadow-sm'
                  : 'bg-bgDark/50 border-borderDark/60 opacity-75'
              }`}
            >
              {/* Badge Icon / Lock */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                  item.unlocked
                    ? 'bg-amber-500/20 border-amber-500/40 shadow-xs'
                    : 'bg-borderDark/40 border-borderDark text-gray-500'
                }`}
              >
                {item.unlocked ? item.icon : <Lock size={16} />}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold truncate ${item.unlocked ? 'text-amber-200' : 'text-gray-300'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-brandOrange shrink-0">
                    +{item.points} pts
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                  {item.description}
                </p>

                {/* Progress bar if multi-target */}
                {item.target && !item.unlocked && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-borderDark/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brandOrange h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (item.progress / item.target) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 shrink-0">
                      {item.progress}/{item.target}
                    </span>
                  </div>
                )}

                {item.unlocked && item.unlockedAt && (
                  <div className="flex items-center gap-1 text-[10px] text-green-400 font-semibold mt-1.5">
                    <CheckCircle2 size={11} />
                    <span>Unlocked {item.unlockedAt}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
