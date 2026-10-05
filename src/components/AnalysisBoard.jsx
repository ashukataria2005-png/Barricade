import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Trophy,
  History,
  Sparkles,
  User,
  Bot
} from 'lucide-react';
import { getStoredTheme } from '../utils/themes';

// Fallback generator for historic matches without full snapshots
const generateFallbackSnapshots = (movesCount = 12, isWin = true) => {
  const snapshots = [
    {
      moveIdx: 0,
      player: null,
      type: 'start',
      notation: 'Start',
      redPos: { r: 8, c: 4 },
      bluePos: { r: 0, c: 4 },
      walls: [],
      redWalls: 10,
      blueWalls: 10,
    },
  ];

  let rPos = { r: 8, c: 4 };
  let bPos = { r: 0, c: 4 };
  let rWalls = 10;
  let bWalls = 10;
  const wallsList = [];

  const count = Math.max(6, Math.min(movesCount, 24));
  for (let i = 1; i <= count; i++) {
    const isRed = i % 2 === 1;
    let type = 'pawn';
    let notation = '';

    if (isRed) {
      if (i === 5 && rWalls > 0) {
        type = 'wall';
        wallsList.push({ r: 2, c: 3, orientation: 'h' });
        rWalls--;
        notation = 'hd3';
      } else {
        rPos = { r: Math.max(0, rPos.r - 1), c: rPos.c };
        notation = `e${9 - rPos.r}`;
      }
    } else {
      if (i === 6 && bWalls > 0) {
        type = 'wall';
        wallsList.push({ r: 5, c: 4, orientation: 'v' });
        bWalls--;
        notation = 've6';
      } else {
        bPos = { r: Math.min(8, bPos.r + 1), c: bPos.c };
        notation = `e${9 - bPos.r}`;
      }
    }

    snapshots.push({
      moveIdx: i,
      player: isRed ? 'red' : 'blue',
      type,
      notation,
      redPos: { ...rPos },
      bluePos: { ...bPos },
      walls: [...wallsList],
      redWalls: rWalls,
      blueWalls: bWalls,
    });
  }

  return snapshots;
};

export default function AnalysisBoard({ matchData, theme, onBack }) {
  const activeTheme = theme || getStoredTheme();

  // Prepare snapshots
  const snapshots = React.useMemo(() => {
    if (matchData?.snapshots && matchData.snapshots.length > 1) {
      return matchData.snapshots;
    }
    const isWin = matchData?.result === 'win';
    const moves = matchData?.movesCount || 14;
    return generateFallbackSnapshots(moves, isWin);
  }, [matchData]);

  const [currentIndex, setCurrentIndex] = useState(snapshots.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const moveScrollRef = useRef(null);

  const currentSnapshot = snapshots[currentIndex] || snapshots[0];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= snapshots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPlaying, snapshots.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setIsPlaying(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
        setIsPlaying(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snapshots.length]);

  // Auto-scroll active move into view
  useEffect(() => {
    if (moveScrollRef.current) {
      const activeEl = moveScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const goToStart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const goToEnd = () => {
    setIsPlaying(false);
    setCurrentIndex(snapshots.length - 1);
  };

  const stepBack = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const stepForward = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
  };

  // Group snapshots into rounds
  const rounds = [];
  for (let i = 1; i < snapshots.length; i += 2) {
    rounds.push({
      roundNum: Math.floor((i - 1) / 2) + 1,
      red: snapshots[i],
      redIdx: i,
      blue: snapshots[i + 1] || null,
      blueIdx: i + 1,
    });
  }

  // Path distance calculations
  const redDist = currentSnapshot.redPos.r; // steps to row 0
  const blueDist = 8 - currentSnapshot.bluePos.r; // steps to row 8

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* ───────────────── TOP BAR ───────────────── */}
      <div className="bg-cardDark/90 border border-borderDark/60 rounded-2xl p-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-borderDark text-gray-400 hover:text-white hover:bg-borderDark/60 transition cursor-pointer"
            title="Exit Review"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-200">
                {matchData?.opponent || 'Opponent'}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border uppercase ${
                  matchData?.result === 'win'
                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}
              >
                {matchData?.result === 'win' ? 'Victory' : 'Defeat'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              Move {currentIndex} of {snapshots.length - 1} · {matchData?.date || 'Today'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-brandOrange font-mono">
            {matchData?.eloChange || '+12'}
          </div>
          <div className="text-[10px] text-gray-500">Game Review</div>
        </div>
      </div>

      {/* ───────────────── PLAYER 2 STATUS ───────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bgDark/60 border border-borderDark/50 rounded-xl my-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-xs" />
          <span className="font-semibold text-gray-300">
            {matchData?.opponent || 'Blue Player'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
          <span>Goal: <strong className="text-white font-mono">{blueDist}</strong> steps</span>
          <span>Walls: <strong className="text-blue-400 font-mono">{currentSnapshot.blueWalls}</strong></span>
        </div>
      </div>

      {/* ───────────────── 9x9 INTERACTIVE BOARD ───────────────── */}
      <div
        style={{ backgroundColor: activeTheme.boardBg }}
        className="relative p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center transition-colors duration-300"
      >
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 sm:gap-2 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isRed = currentSnapshot.redPos.r === r && currentSnapshot.redPos.c === c;
              const isBlue = currentSnapshot.bluePos.r === r && currentSnapshot.bluePos.c === c;
              const isRedGoal = r === 0;
              const isBlueGoal = r === 8;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  style={{ backgroundColor: activeTheme.cellBg }}
                  className={`relative flex items-center justify-center rounded-lg transition-all aspect-square ${
                    isRedGoal
                      ? 'border-b-2 border-rose-500/30'
                      : isBlueGoal
                      ? 'border-t-2 border-blue-500/30'
                      : ''
                  }`}
                >
                  {isRed && (
                    <div className={`w-6 h-6 rounded-full border-2 shadow-lg ${activeTheme.redPawn}`} />
                  )}
                  {isBlue && (
                    <div className={`w-6 h-6 rounded-full border-2 shadow-lg ${activeTheme.bluePawn}`} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Barricades */}
        <div className="absolute inset-3 pointer-events-none">
          {currentSnapshot.walls.map((w, idx) => {
            const leftPct = (w.c + 1) * (100 / 9);
            const topPct = (w.r + 1) * (100 / 9);

            if (w.orientation === 'h') {
              return (
                <div
                  key={`wall-${idx}`}
                  style={{
                    left: `${w.c * (100 / 9)}%`,
                    top: `calc(${topPct}% - 4px)`,
                    width: `${200 / 9}%`,
                    height: '8px',
                  }}
                  className={`absolute bg-gradient-to-r ${activeTheme.wallGradient} rounded-full shadow-lg border ${activeTheme.wallBorder} z-20`}
                />
              );
            } else {
              return (
                <div
                  key={`wall-${idx}`}
                  style={{
                    left: `calc(${leftPct}% - 4px)`,
                    top: `${w.r * (100 / 9)}%`,
                    width: '8px',
                    height: `${200 / 9}%`,
                  }}
                  className={`absolute bg-gradient-to-b ${activeTheme.wallGradient} rounded-full shadow-lg border ${activeTheme.wallBorder} z-20`}
                />
              );
            }
          })}
        </div>
      </div>

      {/* ───────────────── PLAYER 1 (YOU) STATUS ───────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bgDark/60 border border-borderDark/50 rounded-xl my-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
          <span className="font-semibold text-gray-300">You (Red)</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
          <span>Goal: <strong className="text-white font-mono">{redDist}</strong> steps</span>
          <span>Walls: <strong className="text-rose-400 font-mono">{currentSnapshot.redWalls}</strong></span>
        </div>
      </div>

      {/* ───────────────── MOVE NOTATION CAROUSEL ───────────────── */}
      <div
        ref={moveScrollRef}
        className="w-full bg-[#18181b]/95 border border-borderDark/60 rounded-xl px-2 py-1.5 my-1 flex items-center gap-1.5 overflow-x-auto shadow-inner"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          data-active={currentIndex === 0}
          onClick={() => {
            setIsPlaying(false);
            setCurrentIndex(0);
          }}
          className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
            currentIndex === 0
              ? 'bg-brandOrange text-black font-bold shadow-sm'
              : 'text-gray-400 hover:bg-cardDark hover:text-white'
          }`}
        >
          Start
        </button>

        {rounds.map((round) => (
          <div key={round.roundNum} className="flex items-center gap-1 shrink-0 bg-cardDark/60 px-1.5 py-0.5 rounded-lg border border-borderDark/40">
            <span className="text-[10px] text-gray-500 font-mono">{round.roundNum}.</span>
            <button
              type="button"
              data-active={currentIndex === round.redIdx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(round.redIdx);
              }}
              className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                currentIndex === round.redIdx
                  ? 'bg-amber-400 text-black shadow-xs'
                  : round.red.type === 'wall'
                  ? 'text-amber-400 hover:bg-cardDark'
                  : 'text-rose-400 hover:bg-cardDark'
              }`}
            >
              {round.red.notation}
            </button>

            {round.blue && (
              <button
                type="button"
                data-active={currentIndex === round.blueIdx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(round.blueIdx);
                }}
                className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                  currentIndex === round.blueIdx
                    ? 'bg-amber-400 text-black shadow-xs'
                    : round.blue.type === 'wall'
                    ? 'text-amber-400 hover:bg-cardDark'
                    : 'text-blue-400 hover:bg-cardDark'
                }`}
              >
                {round.blue.notation}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ───────────────── STEP CONTROLLER BAR ───────────────── */}
      <div className="bg-cardDark border border-borderDark/60 rounded-2xl p-2 flex items-center justify-between gap-1 shadow-lg">
        <button
          type="button"
          onClick={goToStart}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-borderDark/50 disabled:opacity-30 text-gray-300 hover:text-white transition cursor-pointer"
          title="Go to Start (Home)"
        >
          <ChevronsLeft size={18} />
        </button>

        <button
          type="button"
          onClick={stepBack}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-borderDark/50 disabled:opacity-30 text-gray-300 hover:text-white transition cursor-pointer"
          title="Previous Move (Left Arrow)"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-bold transition cursor-pointer shadow-md ${
            isPlaying
              ? 'bg-amber-500 text-black'
              : 'bg-brandOrange hover:bg-amber-600 text-black'
          }`}
          title={isPlaying ? 'Pause' : 'Auto Play (Space)'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-black" />}
        </button>

        <button
          type="button"
          onClick={stepForward}
          disabled={currentIndex >= snapshots.length - 1}
          className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-borderDark/50 disabled:opacity-30 text-gray-300 hover:text-white transition cursor-pointer"
          title="Next Move (Right Arrow)"
        >
          <ChevronRight size={20} />
        </button>

        <button
          type="button"
          onClick={goToEnd}
          disabled={currentIndex >= snapshots.length - 1}
          className="flex-1 flex items-center justify-center py-2.5 rounded-xl hover:bg-borderDark/50 disabled:opacity-30 text-gray-300 hover:text-white transition cursor-pointer"
          title="Go to End (End)"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
