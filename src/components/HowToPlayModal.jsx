import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Crown,
  Sparkles
} from 'lucide-react';

const RULES = [
  {
    step: 1,
    title: '1. The Objective',
    subtitle: 'Race to the opposite baseline',
    content:
      'The objective of Quoridor is simple: be the first player whose pawn reaches any cell on the opponent\'s opposite goal line.',
    highlight: 'Red races from bottom to top (row 9). Blue races from top to bottom (row 1).',
    diagram: 'objective',
  },
  {
    step: 2,
    title: '2. Pawn Movement & Jumping',
    subtitle: 'Step or leap over your opponent',
    content:
      'On your turn, you can move your pawn one square horizontally or vertically. When two pawns are face-to-face and no barricade is behind, you can jump directly over your opponent!',
    highlight: 'Jumping over an opponent gives you an instant 2-step speed boost.',
    diagram: 'jump',
  },
  {
    step: 3,
    title: '3. Placing Barricades',
    subtitle: 'Build mazes to delay your rival',
    content:
      'Instead of moving, you can place a 2-segment wooden barricade at any intersection. Barricades can be placed Horizontally or Vertically to divert your opponent.',
    highlight: 'Each player has 10 barricades. Use them wisely — once placed, they cannot be moved!',
    diagram: 'wall',
  },
  {
    step: 4,
    title: '4. The Golden Rule',
    subtitle: 'Never completely trap a player',
    content:
      'You are forbidden from completely blocking an opponent\'s access to their goal line. At least one open path must always exist for both players at all times.',
    highlight: 'The game\'s pathfinding engine automatically prevents illegal trapping walls.',
    diagram: 'trap',
  },
];

export default function HowToPlayModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const rule = RULES[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <BookOpen className="text-brandOrange" size={20} />
            <h3 className="text-base font-bold text-white">How to Play Barricade</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Tabs Indicator */}
        <div className="flex items-center gap-1.5 py-1">
          {RULES.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                currentStep === idx ? 'bg-brandOrange' : 'bg-borderDark'
              }`}
            />
          ))}
        </div>

        {/* Rule Card Body */}
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-bold text-brandOrange uppercase tracking-wider">
              Step {rule.step} of 4
            </span>
            <h4 className="text-base font-black text-gray-100">{rule.title}</h4>
            <p className="text-xs text-gray-400 font-medium">{rule.subtitle}</p>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">{rule.content}</p>

          <div className="bg-bgDark/80 border border-borderDark/80 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
            <Sparkles className="shrink-0 text-amber-400 mt-0.5" size={14} />
            <span>{rule.highlight}</span>
          </div>

          {/* Visual Mini-Grid Diagram */}
          <div className="bg-[#161618] border border-borderDark/80 rounded-2xl p-4 flex flex-col items-center justify-center my-1 relative overflow-hidden">
            <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-44 h-44">
              {Array.from({ length: 25 }).map((_, i) => {
                const r = Math.floor(i / 5);
                const c = i % 5;

                const isGoalRow = rule.diagram === 'objective' && r === 0;
                const isRed = (rule.diagram === 'objective' && r === 4 && c === 2) ||
                  (rule.diagram === 'jump' && r === 3 && c === 2) ||
                  (rule.diagram === 'wall' && r === 3 && c === 2) ||
                  (rule.diagram === 'trap' && r === 2 && c === 2);

                const isBlue = (rule.diagram === 'jump' && r === 2 && c === 2) ||
                  (rule.diagram === 'wall' && r === 1 && c === 2);

                const isJumpTarget = rule.diagram === 'jump' && r === 1 && c === 2;

                return (
                  <div
                    key={i}
                    className={`rounded-lg flex items-center justify-center relative ${
                      isGoalRow
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'bg-[#26262a]'
                    }`}
                  >
                    {isRed && (
                      <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-md z-10" />
                    )}
                    {isBlue && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />
                    )}
                    {isJumpTarget && (
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping z-10" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Simulated diagram wall */}
            {(rule.diagram === 'wall' || rule.diagram === 'trap') && (
              <div
                style={{ top: '48%', left: '25%', width: '45%' }}
                className="absolute h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg border border-amber-300 z-20"
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-borderDark/60">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          {currentStep < RULES.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(RULES.length - 1, prev + 1))}
              className="bg-brandOrange hover:bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md"
            >
              <span>Got it, let's play!</span>
              <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
