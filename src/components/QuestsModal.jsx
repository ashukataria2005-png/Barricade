import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  CheckCircle2,
  Gem,
  Award,
  Clock,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  getDailyQuests,
  claimQuestReward,
  getTierFromLevel,
  getXpForNextLevel
} from '../utils/stats';

export default function QuestsModal({ isOpen, onClose, userStats, onStatsUpdate }) {
  const [quests, setQuests] = useState(() => getDailyQuests());
  const [claimToast, setClaimToast] = useState('');

  if (!isOpen) return null;

  const currentLevel = userStats?.level || 1;
  const currentXp = userStats?.xp || 0;
  const xpNeeded = getXpForNextLevel(currentLevel);
  const tier = getTierFromLevel(currentLevel);
  const xpPercent = Math.min(100, Math.round((currentXp / xpNeeded) * 100));

  const handleClaim = (questId) => {
    const res = claimQuestReward(questId);
    if (!res) return;

    setQuests(res.quests);
    if (onStatsUpdate) {
      onStatsUpdate(res.userStats);
    }

    if (res.leveledUp) {
      setClaimToast(`Level Up! You reached Level ${res.userStats.level}! 🎉`);
    } else {
      setClaimToast(`Claimed +${res.xpReward} XP & +${res.gemReward} Gems! 💎`);
    }
    setTimeout(() => setClaimToast(''), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl relative max-h-[90vh]">
        {/* Floating Claim Toast */}
        {claimToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg z-50 animate-bounce text-center whitespace-nowrap">
            {claimToast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brandOrange/10 border border-brandOrange/30 flex items-center justify-center">
              <Target className="text-brandOrange" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Quests & Pass</h3>
              <p className="text-[11px] text-gray-400">Resets daily at 00:00 UTC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level & XP Progression Card */}
        <div className="bg-bgDark/80 border border-borderDark rounded-2xl p-3.5 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tier.badge}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Level {currentLevel}</span>
                  <span className={`text-[10px] font-bold ${tier.color}`}>({tier.name})</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">
                  {currentXp} / {xpNeeded} XP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              <Gem size={13} className="text-cyan-400" />
              <span className="text-xs font-mono font-bold text-cyan-300">{userStats?.gems || 0}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full bg-borderDark/60 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brandOrange to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Quests List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[310px] pr-0.5">
          {quests.map((q) => {
            const isCompleted = q.progress >= q.target;
            const progressPercent = Math.min(100, Math.round((q.progress / q.target) * 100));

            return (
              <div
                key={q.id}
                className={`p-3 rounded-2xl border transition flex flex-col gap-2 ${
                  q.claimed
                    ? 'bg-bgDark/40 border-borderDark/40 opacity-70'
                    : isCompleted
                    ? 'bg-gradient-to-r from-green-500/10 via-cardDark to-cardDark border-green-500/40 shadow-sm'
                    : 'bg-bgDark/60 border-borderDark/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl mt-0.5">{q.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-100">{q.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{q.desc}</p>
                    </div>
                  </div>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-brandOrange">+{q.xpReward} XP</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-0.5">
                      <Gem size={10} />
                      <span>{q.gemReward}</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar & Action */}
                <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-borderDark/40">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-borderDark/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-brandOrange'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {q.progress}/{q.target}
                    </span>
                  </div>

                  <div>
                    {q.claimed ? (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-semibold">
                        <CheckCircle2 size={12} className="text-gray-500" />
                        <span>Claimed</span>
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaim(q.id)}
                        className="bg-green-500 hover:bg-green-400 active:scale-95 text-black text-[11px] font-bold px-3 py-1 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>Claim</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer mt-1"
        >
          Close
        </button>
      </div>
    </div>
  );
}
