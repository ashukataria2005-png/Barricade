import React, { useState, useEffect } from 'react';
import {
  Puzzle,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Shield,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { getStoredStats, recordPuzzleSolved } from '../utils/stats';

const PUZZLES = [
  {
    id: 1,
    title: 'Mate in 1: Leap to Victory',
    difficulty: 'Easy',
    ratingDelta: 15,
    description: 'Red is right at the threshold. Opponent Blue is directly in front. Find the straight jump move to enter the goal line!',
    redPos: { r: 1, c: 4 },
    bluePos: { r: 0, c: 4 },
    walls: [
      { r: 0, c: 2, orientation: 'v' },
      { r: 0, c: 5, orientation: 'v' },
    ],
    hint: 'Move directly onto row 0 by bypassing or jumping into the goal!',
    isSolution: (action) => action.type === 'move' && action.pos.r === 0,
  },
  {
    id: 2,
    title: 'The Great Wall: Intercept Blue',
    difficulty: 'Medium',
    ratingDelta: 15,
    description: "Blue is 1 step from row 8! Place a horizontal barricade between row 7 and row 8 to completely deflect Blue's charge.",
    redPos: { r: 5, c: 4 },
    bluePos: { r: 7, c: 4 },
    walls: [
      { r: 4, c: 2, orientation: 'h' }
    ],
    hint: 'Place a horizontal wall at row 7 intersecting col 3 or 4.',
    isSolution: (action) => action.type === 'wall' && action.orientation === 'h' && action.r === 7 && (action.c === 3 || action.c === 4),
  },
  {
    id: 3,
    title: 'Baseline Race: Sidestep & Advance',
    difficulty: 'Hard',
    ratingDelta: 15,
    description: 'Opponent has built a barricade ahead. Find the optimal sidestep to maintain shortest path advantage.',
    redPos: { r: 3, c: 4 },
    bluePos: { r: 5, c: 4 },
    walls: [
      { r: 2, c: 3, orientation: 'h' },
      { r: 2, c: 4, orientation: 'h' },
    ],
    hint: 'Move horizontally or diagonally past the wall boundary.',
    isSolution: (action) => action.type === 'move' && action.pos.r <= 3 && (action.pos.c === 2 || action.pos.c === 6 || action.pos.c === 3),
  },
];

export default function PuzzlesView({ onPuzzleCompleted }) {
  const [stats, setStats] = useState(getStoredStats());
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(null);
  const [puzzleState, setPuzzleState] = useState(null);
  const [selectedOrientation, setSelectedOrientation] = useState('h');
  const [puzzleStatus, setPuzzleStatus] = useState(null); // 'solved' | 'failed' | null
  const [solvedPuzzles, setSolvedPuzzles] = useState(new Set());

  const currentPuzzle = activePuzzleIndex !== null ? PUZZLES[activePuzzleIndex] : null;

  const startPuzzle = (index) => {
    const p = PUZZLES[index];
    setActivePuzzleIndex(index);
    setPuzzleState({
      redPos: { ...p.redPos },
      bluePos: { ...p.bluePos },
      walls: [...p.walls],
    });
    setPuzzleStatus(null);
  };

  const handleCellClick = (r, c) => {
    if (!puzzleState || puzzleStatus === 'solved') return;

    // Check move distance (must be adjacent)
    const dr = Math.abs(r - puzzleState.redPos.r);
    const dc = Math.abs(c - puzzleState.redPos.c);
    const isAdjacent = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    const isJump = (dr === 2 && dc === 0) || (dr === 0 && dc === 2);

    if (isAdjacent || isJump) {
      const action = { type: 'move', pos: { r, c } };
      if (currentPuzzle.isSolution(action)) {
        setPuzzleState((prev) => ({ ...prev, redPos: { r, c } }));
        handlePuzzleSolved();
      } else {
        setPuzzleStatus('failed');
      }
    }
  };

  const handlePlaceWall = (r, c) => {
    if (!puzzleState || puzzleStatus === 'solved') return;

    const action = { type: 'wall', r, c, orientation: selectedOrientation };
    if (currentPuzzle.isSolution(action)) {
      setPuzzleState((prev) => ({
        ...prev,
        walls: [...prev.walls, { r, c, orientation: selectedOrientation }],
      }));
      handlePuzzleSolved();
    } else {
      setPuzzleStatus('failed');
    }
  };

  const handlePuzzleSolved = () => {
    setPuzzleStatus('solved');
    setSolvedPuzzles((prev) => new Set(prev).add(activePuzzleIndex));
    const updated = recordPuzzleSolved(15);
    setStats(updated);
    if (onPuzzleCompleted) onPuzzleCompleted(updated);
  };

  const restartCurrentPuzzle = () => {
    if (activePuzzleIndex !== null) {
      startPuzzle(activePuzzleIndex);
    }
  };

  // If a puzzle is active, show the interactive puzzle board screen
  if (currentPuzzle && puzzleState) {
    return (
      <div className="flex flex-col gap-3 py-1 select-none animate-in fade-in duration-200">
        {/* Top Puzzle Nav */}
        <div className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-3 rounded-2xl">
          <button
            onClick={() => setActivePuzzleIndex(null)}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>All Puzzles</span>
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold text-gray-100">{currentPuzzle.title}</h3>
            <span className="text-[10px] text-amber-400 font-semibold">{currentPuzzle.difficulty} · +15 Rating</span>
          </div>
          <button
            onClick={restartCurrentPuzzle}
            className="p-1.5 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Reset Puzzle"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Goal Banner */}
        <div className="bg-[#18181b] border border-borderDark/80 p-3 rounded-xl flex items-center justify-between text-xs">
          <p className="text-gray-300 font-medium">{currentPuzzle.description}</p>
        </div>

        {/* Status notification */}
        {puzzleStatus === 'solved' && (
          <div className="bg-green-950/80 border border-green-500/60 p-3 rounded-xl flex items-center justify-between text-green-300 text-xs font-bold animate-bounce shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-400" size={18} />
              <span>Puzzle Solved! +15 Rating gained.</span>
            </div>
            {activePuzzleIndex < PUZZLES.length - 1 && (
              <button
                onClick={() => startPuzzle(activePuzzleIndex + 1)}
                className="bg-green-500 text-black px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-400 transition cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}

        {puzzleStatus === 'failed' && (
          <div className="bg-rose-950/80 border border-rose-600/60 p-3 rounded-xl flex items-center justify-between text-rose-300 text-xs font-bold shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-400" size={18} />
              <span>Not quite. {currentPuzzle.hint}</span>
            </div>
            <button
              onClick={restartCurrentPuzzle}
              className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-rose-500 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Wall Orientation Selector if puzzle requires walls */}
        <div className="flex items-center gap-2 bg-cardDark/60 p-1.5 rounded-xl border border-borderDark/40">
          <button
            onClick={() => setSelectedOrientation('h')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              selectedOrientation === 'h' ? 'bg-brandOrange text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={12} />
            <span>Horizontal Barricade</span>
          </button>
          <button
            onClick={() => setSelectedOrientation('v')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              selectedOrientation === 'v' ? 'bg-brandOrange text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="rotate-90" size={12} />
            <span>Vertical Barricade</span>
          </button>
        </div>

        {/* 9x9 Interactive Puzzle Board */}
        <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
          <div className="grid grid-cols-9 grid-rows-9 gap-1.5 w-full h-full">
            {Array.from({ length: 9 }).map((_, r) =>
              Array.from({ length: 9 }).map((_, c) => {
                const isRed = puzzleState.redPos.r === r && puzzleState.redPos.c === c;
                const isBlue = puzzleState.bluePos.r === r && puzzleState.bluePos.c === c;

                return (
                  <div
                    key={`pcell-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className="relative flex items-center justify-center rounded-lg cursor-pointer bg-[#26262a] hover:bg-[#323238] transition-all aspect-square touch-manipulation"
                  >
                    {isRed && (
                      <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-2 ring-rose-500/40" />
                    )}
                    {isBlue && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-500/40" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Placed Walls */}
          <div className="absolute inset-3 pointer-events-none">
            {puzzleState.walls.map((w, idx) => {
              const leftPct = (w.c + 1) * (100 / 9);
              const topPct = (w.r + 1) * (100 / 9);

              if (w.orientation === 'h') {
                return (
                  <div
                    key={`pwall-${idx}`}
                    style={{
                      left: `${w.c * (100 / 9)}%`,
                      top: `calc(${topPct}% - 4px)`,
                      width: `${200 / 9}%`,
                      height: '8px',
                    }}
                    className="absolute bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
                  />
                );
              } else {
                return (
                  <div
                    key={`pwall-${idx}`}
                    style={{
                      left: `calc(${leftPct}% - 4px)`,
                      top: `${w.r * (100 / 9)}%`,
                      width: '8px',
                      height: `${200 / 9}%`,
                    }}
                    className="absolute bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
                  />
                );
              }
            })}
          </div>

          {/* Interactive Wall Placement Intersections (8x8) */}
          <div className="absolute inset-3 pointer-events-none">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => {
                const leftPct = (c + 1) * (100 / 9);
                const topPct = (r + 1) * (100 / 9);

                return (
                  <div
                    key={`psensor-${r}-${c}`}
                    onClick={() => handlePlaceWall(r, c)}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute w-9 h-9 rounded-full pointer-events-auto cursor-pointer z-30 transition-all touch-manipulation hover:bg-amber-400/30 active:scale-95 group flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/0 group-hover:bg-amber-400/80 transition-all" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Puzzle List View
  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Puzzle className="text-brandOrange" size={22} />
            <span>Tactical Puzzles</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Solve scenarios to master Quoridor strategy</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Puzzle Elo</span>
          <div className="text-2xl font-black text-brandOrange">{stats.puzzleRating || 1200}</div>
        </div>
      </div>

      {/* Puzzles Cards */}
      <div className="flex flex-col gap-3">
        {PUZZLES.map((puzzle, idx) => {
          const isSolved = solvedPuzzles.has(idx);

          return (
            <div
              key={puzzle.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                isSolved
                  ? 'bg-cardDark/50 border-green-500/40'
                  : 'bg-cardDark border-borderDark/70 hover:border-brandOrange/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-bgDark border border-borderDark flex items-center justify-center text-xs font-bold text-gray-300">
                    {puzzle.id}
                  </span>
                  <h3 className="font-bold text-sm text-gray-100">{puzzle.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      puzzle.difficulty === 'Easy'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : puzzle.difficulty === 'Medium'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {puzzle.difficulty}
                  </span>
                  <span className="text-xs font-bold text-brandOrange">+{puzzle.ratingDelta}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">{puzzle.description}</p>

              <div className="flex items-center justify-between pt-1">
                {isSolved ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                    <CheckCircle2 size={15} />
                    <span>Completed (+15 Elo)</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 italic">Unsolved</span>
                )}

                <button
                  onClick={() => startPuzzle(idx)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSolved
                      ? 'bg-cardDark border border-borderDark text-gray-300 hover:bg-borderDark'
                      : 'bg-brandOrange text-black hover:bg-amber-500 shadow-md'
                  }`}
                >
                  <span>{isSolved ? 'Replay' : 'Solve Puzzle'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
