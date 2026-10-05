import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  RotateCcw,
  Flag,
  Share2,
  Download,
  MessageSquare,
  Gem,
  ChevronRight,
  X
} from 'lucide-react';

export default function GameBoard({ gameMinutes = 3, onBack }) {
  const initialSeconds = (gameMinutes || 3) * 60;

  // Turn: 'red' | 'blue'
  const [turn, setTurn] = useState('red');

  // Positions: 0 to 8
  const [redPos, setRedPos] = useState({ r: 8, c: 4 });
  const [bluePos, setBluePos] = useState({ r: 0, c: 4 });

  // Walls left
  const [redWalls, setRedWalls] = useState(10);
  const [blueWalls, setBlueWalls] = useState(10);

  // Placed walls: array of { r, c, orientation: 'h' | 'v' }
  const [walls, setWalls] = useState([]);

  // Orientations
  const [blueOrientation, setBlueOrientation] = useState('h');
  const [redOrientation, setRedOrientation] = useState('h');

  // Timers initialized strictly to gameMinutes
  const [blueTime, setBlueTime] = useState(initialSeconds);
  const [redTime, setRedTime] = useState(initialSeconds);

  // Result state: { winner: 'red' | 'blue', reason: string, isYouWin: boolean, eloDelta: number }
  const [gameResult, setGameResult] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');

  // Double tap confirmation states
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  // Keep timers synchronized when gameMinutes prop updates
  useEffect(() => {
    const secs = (gameMinutes || 3) * 60;
    setBlueTime(secs);
    setRedTime(secs);
  }, [gameMinutes]);

  // Turn-based live countdown clocks
  useEffect(() => {
    if (gameResult) return;
    const interval = setInterval(() => {
      if (turn === 'red') {
        setRedTime((prev) => {
          if (prev <= 1) {
            setGameResult({
              winner: 'blue',
              reason: 'Red player timed out',
              isYouWin: false,
              eloDelta: -11,
            });
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlueTime((prev) => {
          if (prev <= 1) {
            setGameResult({
              winner: 'red',
              reason: 'Blue player timed out',
              isYouWin: true,
              eloDelta: +12,
            });
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [turn, gameResult]);

  const formatClock = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset double tap confirmations after 3 seconds
  useEffect(() => {
    if (confirmResign) {
      const t = setTimeout(() => setConfirmResign(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmResign]);

  useEffect(() => {
    if (confirmBack) {
      const t = setTimeout(() => setConfirmBack(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmBack]);

  // Clear warning notification automatically
  useEffect(() => {
    if (warningMsg) {
      const t = setTimeout(() => setWarningMsg(''), 2500);
      return () => clearTimeout(t);
    }
  }, [warningMsg]);

  // Wall collisions & BFS Reachability checks
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

  const hasPathToGoal = (startPos, targetRow, wallList) => {
    const queue = [{ r: startPos.r, c: startPos.c }];
    const visited = new Set();
    visited.add(`${startPos.r},${startPos.c}`);

    const deltas = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.r === targetRow) return true;

      for (let d of deltas) {
        const nr = curr.r + d.r;
        const nc = curr.c + d.c;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            if (!isWallBetween(curr.r, curr.c, nr, nc, wallList)) {
              visited.add(key);
              queue.push({ r: nr, c: nc });
            }
          }
        }
      }
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
            // Straight jump over opponent
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

  const handleCellClick = (r, c) => {
    if (gameResult) return;

    const currentPos = turn === 'red' ? redPos : bluePos;
    const otherPos = turn === 'red' ? bluePos : redPos;
    const validMoves = getValidMoves(currentPos, otherPos);

    if (validMoves.some((m) => m.r === r && m.c === c)) {
      if (turn === 'red') {
        setRedPos({ r, c });
        if (r === 0) {
          setGameResult({
            winner: 'red',
            reason: 'You reached the goal first',
            isYouWin: true,
            eloDelta: +12,
          });
        } else {
          setTurn('blue');
        }
      } else {
        setBluePos({ r, c });
        if (r === 8) {
          setGameResult({
            winner: 'blue',
            reason: 'kamal47 reached the goal first',
            isYouWin: false,
            eloDelta: -11,
          });
        } else {
          setTurn('red');
        }
      }
    }
  };

  const handlePlaceWall = (r, c) => {
    if (gameResult) return;
    const isRed = turn === 'red';
    const remaining = isRed ? redWalls : blueWalls;
    const activeOrientation = isRed ? redOrientation : blueOrientation;

    if (remaining <= 0) {
      setWarningMsg('No barricades remaining!');
      return;
    }

    const overlap = walls.some((w) => {
      if (w.r === r && w.c === c) return true;
      if (activeOrientation === 'h') {
        if (w.orientation === 'h' && w.r === r && Math.abs(w.c - c) <= 1) return true;
      } else {
        if (w.orientation === 'v' && w.c === c && Math.abs(w.r - r) <= 1) return true;
      }
      return false;
    });

    if (overlap) {
      setWarningMsg('Wall overlaps another barricade!');
      return;
    }

    const testWalls = [...walls, { r, c, orientation: activeOrientation }];

    if (!hasPathToGoal(redPos, 0, testWalls) || !hasPathToGoal(bluePos, 8, testWalls)) {
      setWarningMsg('Cannot block path completely!');
      return;
    }

    setWalls(testWalls);
    if (isRed) {
      setRedWalls((prev) => prev - 1);
      setTurn('blue');
    } else {
      setBlueWalls((prev) => prev - 1);
      setTurn('red');
    }
  };

  // Resign action with safety confirmation
  const handleResignClick = () => {
    if (!confirmResign) {
      setConfirmResign(true);
    } else {
      setGameResult({
        winner: 'blue',
        reason: 'You resigned',
        isYouWin: false,
        eloDelta: -11,
      });
      setConfirmResign(false);
    }
  };

  // Back action with safety confirmation
  const handleBackClick = () => {
    if (!confirmBack) {
      setConfirmBack(true);
    } else {
      onBack();
    }
  };

  const restartGame = () => {
    const freshSeconds = (gameMinutes || 3) * 60;
    setRedPos({ r: 8, c: 4 });
    setBluePos({ r: 0, c: 4 });
    setRedWalls(10);
    setBlueWalls(10);
    setWalls([]);
    setBlueTime(freshSeconds);
    setRedTime(freshSeconds);
    setGameResult(null);
    setTurn('red');
    setConfirmResign(false);
    setConfirmBack(false);
    setWarningMsg('');
  };

  const currentPos = turn === 'red' ? redPos : bluePos;
  const otherPos = turn === 'red' ? bluePos : redPos;
  const validMoves = getValidMoves(currentPos, otherPos);

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* ───────────────── TOP BAR (Opponent Blue) ───────────────── */}
      <div
        className={`p-3 rounded-2xl border transition-all duration-200 ${
          turn === 'blue'
            ? 'bg-blue-950/30 border-blue-500/70 shadow-lg shadow-blue-950/40'
            : 'bg-cardDark/80 border-borderDark/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Safe Back Button */}
            <button
              type="button"
              onClick={handleBackClick}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                confirmBack
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                  : 'hover:bg-borderDark border-transparent text-gray-400 hover:text-white'
              }`}
              title="Return to lobby"
            >
              {confirmBack ? 'Exit?' : <ArrowLeft size={18} />}
            </button>

            {/* Safe Resign Button */}
            <button
              type="button"
              onClick={handleResignClick}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                confirmResign
                  ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-md'
                  : 'bg-cardDark hover:bg-borderDark border-borderDark text-gray-400 hover:text-gray-200'
              }`}
            >
              <Flag size={13} />
              <span>{confirmResign ? 'Confirm Resign?' : 'Resign'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
            <span className="text-sm font-bold text-gray-200">kamal47 (1188) 🇮🇳</span>
            <span className="text-xs text-blue-400 font-semibold">{blueWalls}/10</span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              turn === 'blue'
                ? 'bg-blue-600 text-white animate-pulse shadow-md shadow-blue-600/30'
                : 'bg-bgDark text-gray-400'
            }`}
          >
            {formatClock(blueTime)}
          </div>
        </div>

        {/* Blue Wall Controls */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => setBlueOrientation('h')}
            disabled={turn !== 'blue'}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              blueOrientation === 'h'
                ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
            } ${turn !== 'blue' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Shield size={12} />
            <span>Horizontal Wall</span>
          </button>
          <button
            type="button"
            onClick={() => setBlueOrientation('v')}
            disabled={turn !== 'blue'}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              blueOrientation === 'v'
                ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
            } ${turn !== 'blue' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Shield className="rotate-90" size={12} />
            <span>Vertical Wall</span>
          </button>
        </div>
      </div>

      {/* Warning Notification */}
      {warningMsg && (
        <div className="text-center text-xs font-semibold text-rose-300 bg-rose-950/90 border border-rose-700/80 py-1.5 px-3 rounded-xl my-1 animate-bounce shadow-md">
          {warningMsg}
        </div>
      )}

      {/* ───────────────── 9x9 BOARD ───────────────── */}
      <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
        {/* Cells Grid */}
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 sm:gap-2 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isRed = redPos.r === r && redPos.c === c;
              const isBlue = bluePos.r === r && bluePos.c === c;
              const isValid = validMoves.some((m) => m.r === r && m.c === c);

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center rounded-lg cursor-pointer transition-all aspect-square touch-manipulation ${
                    isValid
                      ? 'bg-amber-500/20 border-2 border-amber-400 shadow-sm'
                      : 'bg-[#26262a] hover:bg-[#303036] active:bg-[#35353c]'
                  }`}
                >
                  {isRed && (
                    <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-2 ring-rose-500/40" />
                  )}
                  {isBlue && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-500/40" />
                  )}
                  {isValid && !isRed && !isBlue && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Continuous Solid Wooden Barricades */}
        <div className="absolute inset-3 pointer-events-none">
          {walls.map((w, idx) => {
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
                  className="absolute bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
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
                  className="absolute bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/50 border border-amber-300 z-20"
                />
              );
            }
          })}
        </div>

        {/* Invisible Placement Touch/Click Sensors (8x8 Intersection Grid) */}
        <div className="absolute inset-3 pointer-events-none">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const leftPct = (c + 1) * (100 / 9);
              const topPct = (r + 1) * (100 / 9);

              return (
                <div
                  key={`sensor-${r}-${c}`}
                  onClick={() => handlePlaceWall(r, c)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute w-9 h-9 sm:w-11 sm:h-11 rounded-full pointer-events-auto cursor-pointer z-30 transition-all touch-manipulation hover:bg-amber-400/25 active:bg-amber-400/40 active:scale-95 group flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/0 group-hover:bg-amber-400/80 transition-all" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────── BOTTOM BAR (You Red) ───────────────── */}
      <div
        className={`p-3 rounded-2xl border transition-all duration-200 ${
          turn === 'red'
            ? 'bg-rose-950/30 border-rose-500/70 shadow-lg shadow-rose-950/40'
            : 'bg-cardDark/80 border-borderDark/40'
        }`}
      >
        {/* Red Wall Controls */}
        <div className="flex items-center gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => setRedOrientation('h')}
            disabled={turn !== 'red'}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              redOrientation === 'h'
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
            } ${turn !== 'red' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Shield size={12} />
            <span>Horizontal Wall</span>
          </button>
          <button
            type="button"
            onClick={() => setRedOrientation('v')}
            disabled={turn !== 'red'}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              redOrientation === 'v'
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
            } ${turn !== 'red' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Shield className="rotate-90" size={12} />
            <span>Vertical Wall</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
            <span className="text-sm font-bold text-gray-200">AshuKataria (1092) 🇮🇳</span>
            <span className="text-xs text-rose-400 font-semibold">{redWalls}/10</span>
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              turn === 'red'
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                : 'bg-bgDark text-gray-400'
            }`}
          >
            {formatClock(redTime)}
          </div>
        </div>
      </div>

      {/* ───────────────── SCREENSHOT-MATCHING RESULT MODAL ───────────────── */}
      {gameResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-[#1c1c1e] border border-borderDark rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative">
            {/* Top Share & Download Icons */}
            <div className="w-full flex items-center justify-between text-gray-400 mb-2">
              <button type="button" className="p-1 hover:text-white transition cursor-pointer">
                <Download size={20} />
              </button>
              <button type="button" className="p-1 hover:text-white transition cursor-pointer">
                <Share2 size={20} />
              </button>
            </div>

            {/* Outcome Title */}
            <h2 className="text-2xl font-black tracking-wide text-white">
              {gameResult.isYouWin ? 'You won' : 'You lost'}
            </h2>
            <p className="text-xs text-gray-400 mt-1 mb-4 font-medium">{gameResult.reason}</p>

            {/* Elo Change Badge */}
            <div
              className={`text-xl font-black ${
                gameResult.eloDelta > 0 ? 'text-green-400' : 'text-rose-500'
              }`}
            >
              {gameResult.eloDelta > 0 ? `+${gameResult.eloDelta}` : gameResult.eloDelta} Elo
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5 mb-4">
              {gameResult.eloDelta > 0 ? '1081 → 1093' : '1092 → 1081'}
            </div>

            {/* Set Indicators */}
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400">
              <span className="text-[10px] tracking-widest text-gray-500">SET</span>
              <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 text-xs">
                ✕
              </div>
              <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 text-xs">
                ✕
              </div>
              <div className="w-5 h-5 rounded-full border border-gray-600" />
            </div>
            <p className="text-[10px] text-gray-500 mb-5">
              {gameResult.isYouWin
                ? 'Set won — excellent victory!'
                : 'Set complete — opponent won the best of 3.'}
            </p>

            {/* Primary Action Button (Green) */}
            <button
              type="button"
              onClick={restartGame}
              className="w-full bg-[#22c55e] hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-green-500/20 cursor-pointer mb-3"
            >
              {gameResult.isYouWin ? 'Rematch' : 'New ranked game'}
            </button>

            {/* Sub Action Buttons (Analyze & Back to Lobby) */}
            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <button
                type="button"
                onClick={restartGame}
                className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Analyze
              </button>
              <button
                type="button"
                onClick={onBack}
                className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>

            {/* Chat Pill */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] text-gray-300 font-semibold py-2.5 rounded-xl text-xs transition mb-4 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Chat</span>
            </button>

            {/* Barricade Premium Card */}
            <div className="w-full bg-[#16202a] border border-cyan-900/50 hover:border-cyan-500/50 transition rounded-xl p-3 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Gem className="text-cyan-400" size={16} />
                <span className="text-xs font-bold text-gray-200">Barricade Premium</span>
              </div>
              <ChevronRight className="text-amber-500" size={16} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}