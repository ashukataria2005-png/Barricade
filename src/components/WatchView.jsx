import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Bot,
  Zap,
  Shield,
  Trophy
} from 'lucide-react';

export default function WatchView({ onBack }) {
  // Turn: 'red' | 'blue'
  const [turn, setTurn] = useState('red');
  const [redPos, setRedPos] = useState({ r: 8, c: 4 });
  const [bluePos, setBluePos] = useState({ r: 0, c: 4 });
  const [walls, setWalls] = useState([
    { r: 4, c: 3, orientation: 'h' },
    { r: 3, c: 5, orientation: 'v' },
  ]);
  const [redWalls, setRedWalls] = useState(9);
  const [blueWalls, setBlueWalls] = useState(9);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 or 2
  const [spectatorCount] = useState(842);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(8);

  // Helper BFS Reachability & Shortest Path
  const isWallBetween = (r1, c1, r2, c2, wallList) => {
    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      return wallList.some(
        (w) => w.orientation === 'v' && w.c === minC && (w.r === r1 || w.r === r1 - 1)
      );
    }
    if (c1 === c2) {
      const minR = Math.min(r1, r2);
      return wallList.some(
        (w) => w.orientation === 'h' && w.r === minR && (w.c === c1 || w.c === c1 - 1)
      );
    }
    return false;
  };

  const getValidMoves = (pos, otherPos) => {
    const moves = [];
    const deltas = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];

    deltas.forEach((d) => {
      const nr = pos.r + d.r;
      const nc = pos.c + d.c;
      if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
        if (!isWallBetween(pos.r, pos.c, nr, nc, walls)) {
          if (nr === otherPos.r && nc === otherPos.c) {
            const jumpR = nr + d.r;
            const jumpC = nc + d.c;
            if (
              jumpR >= 0 &&
              jumpR < 9 &&
              jumpC >= 0 &&
              jumpC < 9 &&
              !isWallBetween(nr, nc, jumpR, jumpC, walls)
            ) {
              moves.push({ r: jumpR, c: jumpC });
            }
          } else {
            moves.push({ r: nr, c: nc });
          }
        }
      }
    });

    return moves;
  };

  const getShortestPathLength = (startPos, targetRow) => {
    const queue = [{ r: startPos.r, c: startPos.c, dist: 0 }];
    const visited = new Set();
    visited.add(`${startPos.r},${startPos.c}`);

    const deltas = [
      { r: targetRow === 8 ? 1 : -1, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: -1 },
      { r: targetRow === 8 ? -1 : 1, c: 0 },
    ];

    while (queue.length > 0) {
      const { r, c, dist } = queue.shift();
      if (r === targetRow) return dist;

      for (let d of deltas) {
        const nr = r + d.r;
        const nc = c + d.c;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !isWallBetween(r, c, nr, nc, walls)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, dist: dist + 1 });
          }
        }
      }
    }
    return Infinity;
  };

  // Automated Grandmaster turn simulation
  useEffect(() => {
    if (!isPlaying || winner) return;

    const delay = Math.round(1200 / speedMultiplier);
    const timer = setTimeout(() => {
      executeBotStep();
    }, delay);

    return () => clearTimeout(timer);
  }, [turn, isPlaying, winner, speedMultiplier, walls, redPos, bluePos]);

  const executeBotStep = () => {
    const isRed = turn === 'red';
    const currentPos = isRed ? redPos : bluePos;
    const otherPos = isRed ? bluePos : redPos;
    const targetRow = isRed ? 0 : 8;

    const validMoves = getValidMoves(currentPos, otherPos);
    if (validMoves.length === 0) return;

    // Check immediate win
    const winMove = validMoves.find((m) => m.r === targetRow);
    if (winMove) {
      if (isRed) {
        setRedPos(winMove);
        setWinner('AlphaBot');
      } else {
        setBluePos(winMove);
        setWinner('DeepWall');
      }
      return;
    }

    // Move to minimize distance to targetRow
    let bestMove = validMoves[0];
    let minDistance = Infinity;

    for (const move of validMoves) {
      const dist = getShortestPathLength(move, targetRow);
      if (dist < minDistance) {
        minDistance = dist;
        bestMove = move;
      }
    }

    if (isRed) {
      setRedPos(bestMove);
      if (bestMove.r === 0) setWinner('AlphaBot');
      else setTurn('blue');
    } else {
      setBluePos(bestMove);
      if (bestMove.r === 8) setWinner('DeepWall');
      else setTurn('red');
    }

    setMoveCount((prev) => prev + 1);
  };

  const restartMatch = () => {
    setRedPos({ r: 8, c: 4 });
    setBluePos({ r: 0, c: 4 });
    setWalls([
      { r: 4, c: 3, orientation: 'h' },
      { r: 3, c: 5, orientation: 'v' },
    ]);
    setRedWalls(9);
    setBlueWalls(9);
    setWinner(null);
    setTurn('red');
    setMoveCount(1);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* Top Bar with Live Badge & Back */}
      <div className="flex items-center justify-between px-2 py-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition cursor-pointer bg-cardDark border border-borderDark px-2.5 py-1 rounded-xl"
        >
          <ArrowLeft size={15} />
          <span>Exit TV</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-700/60 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Eye size={12} />
            <span>{spectatorCount}</span>
          </div>
        </div>
      </div>

      {/* Opponent Card (DeepWall - Blue) */}
      <div className="bg-cardDark/90 border border-borderDark/60 p-3 rounded-2xl flex items-center justify-between mt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center text-blue-400">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-200">DeepWall (AI)</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1 rounded font-bold">2390</span>
            </div>
            <span className="text-[11px] text-gray-400">Grandmaster Engine</span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'blue' ? 'bg-blue-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'}`}>
          {turn === 'blue' ? 'Thinking...' : 'Waiting'}
        </div>
      </div>

      {/* Spectator Floating Control Strip */}
      <div className="flex items-center justify-between bg-bgDark/80 border border-borderDark/60 rounded-xl px-3 py-1.5 my-1 text-xs">
        <span className="text-gray-400 font-mono text-[11px]">Move #{moveCount}</span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 bg-cardDark hover:bg-borderDark border border-borderDark px-2.5 py-1 rounded-lg text-xs text-gray-200 font-semibold cursor-pointer transition"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1))}
            className={`px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              speedMultiplier === 2
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-cardDark border-borderDark text-gray-400'
            }`}
          >
            {speedMultiplier}x Speed
          </button>

          <button
            onClick={restartMatch}
            className="p-1 hover:bg-cardDark rounded-lg text-gray-400 hover:text-white cursor-pointer"
            title="New Game"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* 9x9 Board */}
      <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isRed = redPos.r === r && redPos.c === c;
              const isBlue = bluePos.r === r && bluePos.c === c;

              return (
                <div
                  key={`watch-cell-${r}-${c}`}
                  className="relative flex items-center justify-center rounded-lg bg-[#26262a] aspect-square"
                >
                  {isRed && (
                    <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-2 ring-rose-500/40 animate-pulse" />
                  )}
                  {isBlue && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-500/40 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Walls */}
        <div className="absolute inset-3 pointer-events-none">
          {walls.map((w, idx) => {
            const leftPct = (w.c + 1) * (100 / 9);
            const topPct = (w.r + 1) * (100 / 9);

            if (w.orientation === 'h') {
              return (
                <div
                  key={`wwall-${idx}`}
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
                  key={`wwall-${idx}`}
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
      </div>

      {/* Player Card (AlphaBot - Red) */}
      <div className="bg-cardDark/90 border border-borderDark/60 p-3 rounded-2xl flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center text-rose-400">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-200">AlphaBot (AI)</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 rounded font-bold">2450</span>
            </div>
            <span className="text-[11px] text-gray-400">Deep Neural Quoridor Engine</span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${turn === 'red' ? 'bg-rose-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'}`}>
          {turn === 'red' ? 'Thinking...' : 'Waiting'}
        </div>
      </div>

      {/* Match Outcome Banner */}
      {winner && (
        <div className="bg-cardDark border border-borderDark rounded-2xl p-4 text-center my-2 shadow-2xl flex flex-col items-center gap-2">
          <Trophy className="text-amber-400" size={24} />
          <h3 className="text-base font-bold text-white">{winner} Wins the Spectator Match!</h3>
          <button
            onClick={restartMatch}
            className="bg-brandOrange hover:bg-amber-500 text-black font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer mt-1"
          >
            Watch New Match
          </button>
        </div>
      )}
    </div>
  );
}
