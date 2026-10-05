import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Flag,
  RotateCcw,
  Trophy,
  Crown,
  Bot,
  Users,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

export default function KingOfTheHillBoard({ onBack }) {
  // 4 Player turn cycle: 'red' -> 'blue' -> 'green' -> 'yellow'
  const [turn, setTurn] = useState('red');

  // Pawn positions: Crown is at (4, 4)
  const [pawns, setPawns] = useState({
    red: { r: 8, c: 4 },
    blue: { r: 0, c: 4 },
    green: { r: 4, c: 0 },
    yellow: { r: 4, c: 8 },
  });

  // Walls remaining (5 per player)
  const [wallsLeft, setWallsLeft] = useState({
    red: 5,
    blue: 5,
    green: 5,
    yellow: 5,
  });

  const [walls, setWalls] = useState([]);
  const [orientation, setOrientation] = useState('h');
  const [winner, setWinner] = useState(null);
  const [confirmBack, setConfirmBack] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  const TURN_ORDER = ['red', 'blue', 'green', 'yellow'];

  const PLAYER_DETAILS = {
    red: { name: 'You (Red)', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
    blue: { name: 'StockBot (Blue)', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    green: { name: 'AlphaGreen (Green)', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
    yellow: { name: 'HyperYellow (Yellow)', color: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400' },
  };

  // Sound synthesis
  const playSound = (freq, duration = 0.05, type = 'triangle') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Wall collision check
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

  // BFS Reachability to center (4, 4)
  const hasPathToCrown = (startPos, wallList) => {
    const queue = [{ r: startPos.r, c: startPos.c }];
    const visited = new Set();
    visited.add(`${startPos.r},${startPos.c}`);

    const deltas = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.r === 4 && curr.c === 4) return true;

      for (let d of deltas) {
        const nr = curr.r + d.r;
        const nc = curr.c + d.c;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !isWallBetween(curr.r, curr.c, nr, nc, wallList)) {
            visited.add(key);
            queue.push({ r: nr, c: nc });
          }
        }
      }
    }
    return false;
  };

  // Shortest path to crown (4, 4)
  const getDistanceToCrown = (pos, wallList) => {
    const queue = [{ r: pos.r, c: pos.c, dist: 0 }];
    const visited = new Set();
    visited.add(`${pos.r},${pos.c}`);

    const deltas = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

    while (queue.length > 0) {
      const { r, c, dist } = queue.shift();
      if (r === 4 && c === 4) return dist;

      for (let d of deltas) {
        const nr = r + d.r;
        const nc = c + d.c;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !isWallBetween(r, c, nr, nc, wallList)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, dist: dist + 1 });
          }
        }
      }
    }
    return Infinity;
  };

  const getValidMovesForPlayer = (playerKey) => {
    const pos = pawns[playerKey];
    const moves = [];
    const deltas = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

    const otherPositions = Object.entries(pawns)
      .filter(([k]) => k !== playerKey)
      .map(([, v]) => v);

    deltas.forEach((d) => {
      const nr = pos.r + d.r;
      const nc = pos.c + d.c;

      if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
        if (!isWallBetween(pos.r, pos.c, nr, nc, walls)) {
          const isOccupied = otherPositions.some((p) => p.r === nr && p.c === nc);
          if (isOccupied) {
            // Jump
            const jx = nr + d.r;
            const jy = nc + d.c;
            if (
              jx >= 0 &&
              jx < 9 &&
              jy >= 0 &&
              jy < 9 &&
              !isWallBetween(nr, nc, jx, jy, walls) &&
              !otherPositions.some((p) => p.r === jx && p.c === jy)
            ) {
              moves.push({ r: jx, c: jy });
            }
          } else {
            moves.push({ r: nr, c: nc });
          }
        }
      }
    });

    return moves;
  };

  const nextTurn = (currentTurn) => {
    const idx = TURN_ORDER.indexOf(currentTurn);
    return TURN_ORDER[(idx + 1) % TURN_ORDER.length];
  };

  // AI Turn Handling for Blue, Green, Yellow
  useEffect(() => {
    if (winner || turn === 'red') {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    const timer = setTimeout(() => {
      executeBotStep(turn);
      setIsBotThinking(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [turn, winner, pawns, walls]);

  const executeBotStep = (activeBot) => {
    const validMoves = getValidMovesForPlayer(activeBot);
    if (validMoves.length === 0) {
      setTurn(nextTurn(activeBot));
      return;
    }

    // Direct Crown Win
    const crownWin = validMoves.find((m) => m.r === 4 && m.c === 4);
    if (crownWin) {
      setPawns((prev) => ({ ...prev, [activeBot]: crownWin }));
      setWinner(activeBot);
      playSound(880, 0.4, 'sine');
      return;
    }

    // Pick move that gets closest to (4, 4)
    let bestMove = validMoves[0];
    let minDist = Infinity;

    for (const move of validMoves) {
      const dist = getDistanceToCrown(move, walls);
      if (dist < minDist) {
        minDist = dist;
        bestMove = move;
      }
    }

    setPawns((prev) => ({ ...prev, [activeBot]: bestMove }));
    playSound(440, 0.05, 'triangle');

    if (bestMove.r === 4 && bestMove.c === 4) {
      setWinner(activeBot);
      playSound(880, 0.4, 'sine');
    } else {
      setTurn(nextTurn(activeBot));
    }
  };

  const handleCellClick = (r, c) => {
    if (winner || turn !== 'red') return;

    const validMoves = getValidMovesForPlayer('red');
    if (validMoves.some((m) => m.r === r && m.c === c)) {
      setPawns((prev) => ({ ...prev, red: { r, c } }));
      playSound(440, 0.05, 'triangle');

      if (r === 4 && c === 4) {
        setWinner('red');
        playSound(880, 0.4, 'sine');
      } else {
        setTurn(nextTurn('red'));
      }
    }
  };

  const handlePlaceWall = (r, c) => {
    if (winner || turn !== 'red') return;

    if (wallsLeft.red <= 0) {
      setWarningMsg('No barricades remaining!');
      setTimeout(() => setWarningMsg(''), 2000);
      return;
    }

    const overlap = walls.some((w) => {
      if (w.r === r && w.c === c) return true;
      if (orientation === 'h') {
        if (w.orientation === 'h' && w.r === r && Math.abs(w.c - c) <= 1) return true;
      } else {
        if (w.orientation === 'v' && w.c === c && Math.abs(w.r - r) <= 1) return true;
      }
      return false;
    });

    if (overlap) {
      setWarningMsg('Wall overlaps another barricade!');
      setTimeout(() => setWarningMsg(''), 2000);
      return;
    }

    const testWalls = [...walls, { r, c, orientation }];

    // Ensure all 4 players can still reach the Crown (4, 4)
    const allHavePath = Object.values(pawns).every((p) => hasPathToCrown(p, testWalls));

    if (!allHavePath) {
      setWarningMsg('Cannot block access to the Crown!');
      setTimeout(() => setWarningMsg(''), 2000);
      return;
    }

    setWalls(testWalls);
    setWallsLeft((prev) => ({ ...prev, red: prev.red - 1 }));
    playSound(180, 0.1, 'sine');
    setTurn(nextTurn('red'));
  };

  const restartGame = () => {
    setPawns({
      red: { r: 8, c: 4 },
      blue: { r: 0, c: 4 },
      green: { r: 4, c: 0 },
      yellow: { r: 4, c: 8 },
    });
    setWallsLeft({ red: 5, blue: 5, green: 5, yellow: 5 });
    setWalls([]);
    setWinner(null);
    setTurn('red');
  };

  const validMoves = turn === 'red' ? getValidMovesForPlayer('red') : [];

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* Top Header */}
      <div className="bg-cardDark border border-borderDark/60 p-3 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirmBack) onBack();
              else {
                setConfirmBack(true);
                setTimeout(() => setConfirmBack(false), 2500);
              }
            }}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              confirmBack ? 'bg-rose-950 text-rose-300 border-rose-700' : 'hover:bg-borderDark border-transparent text-gray-400'
            }`}
          >
            {confirmBack ? 'Exit?' : <ArrowLeft size={18} />}
          </button>

          <div className="flex items-center gap-1.5">
            <Crown className="text-amber-400 fill-amber-400" size={18} />
            <h2 className="text-sm font-black text-amber-400">King of the Hill</h2>
          </div>
        </div>

        {/* Turn Pill & Mute */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-bgDark border border-borderDark px-2.5 py-1 rounded-xl text-xs font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${PLAYER_DETAILS[turn].color} ${turn !== 'red' && 'animate-ping'}`} />
            <span className={PLAYER_DETAILS[turn].text}>
              {turn === 'red' ? 'Your Turn' : `${PLAYER_DETAILS[turn].name.split(' ')[0]}...`}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-borderDark/60 rounded-lg text-gray-400 cursor-pointer"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* 4 Player Status Bar */}
      <div className="grid grid-cols-4 gap-2 my-1">
        {TURN_ORDER.map((pk) => {
          const isTurn = turn === pk;
          const p = PLAYER_DETAILS[pk];
          const dist = getDistanceToCrown(pawns[pk], walls);

          return (
            <div
              key={pk}
              className={`p-2 rounded-xl border text-center transition-all ${
                isTurn ? `${p.border} bg-cardDark shadow-md` : 'border-borderDark/40 bg-cardDark/40 opacity-70'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${p.color}`} />
                <span className="text-[10px] font-bold text-gray-200 truncate">{pk.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{dist} steps</div>
            </div>
          );
        })}
      </div>

      {warningMsg && (
        <div className="text-center text-xs font-semibold text-rose-300 bg-rose-950/90 border border-rose-700/80 py-1 px-3 rounded-xl my-0.5 animate-bounce">
          {warningMsg}
        </div>
      )}

      {/* 9x9 Board with Crown Center */}
      <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isCenter = r === 4 && c === 4;
              const isRed = pawns.red.r === r && pawns.red.c === c;
              const isBlue = pawns.blue.r === r && pawns.blue.c === c;
              const isGreen = pawns.green.r === r && pawns.green.c === c;
              const isYellow = pawns.yellow.r === r && pawns.yellow.c === c;
              const isValid = validMoves.some((m) => m.r === r && m.c === c);

              return (
                <div
                  key={`koth-cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center rounded-lg transition-all aspect-square touch-manipulation cursor-pointer ${
                    isCenter
                      ? 'bg-amber-500/25 border-2 border-amber-400 shadow-lg shadow-amber-500/30'
                      : isValid
                      ? 'bg-amber-500/20 border-2 border-amber-400'
                      : 'bg-[#26262a] hover:bg-[#303036]'
                  }`}
                >
                  {isCenter && (
                    <Crown className="text-amber-400 fill-amber-400 animate-pulse" size={16} />
                  )}

                  {isRed && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-md z-10" />
                  )}
                  {isBlue && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />
                  )}
                  {isGreen && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md z-10" />
                  )}
                  {isYellow && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-md z-10" />
                  )}

                  {isValid && !isRed && !isBlue && !isGreen && !isYellow && !isCenter && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
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
                  key={`koth-wall-${idx}`}
                  style={{
                    left: `${w.c * (100 / 9)}%`,
                    top: `calc(${topPct}% - 4px)`,
                    width: `${200 / 9}%`,
                    height: '8px',
                  }}
                  className="absolute bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg border border-amber-300 z-20"
                />
              );
            } else {
              return (
                <div
                  key={`koth-wall-${idx}`}
                  style={{
                    left: `calc(${leftPct}% - 4px)`,
                    top: `${w.r * (100 / 9)}%`,
                    width: '8px',
                    height: `${200 / 9}%`,
                  }}
                  className="absolute bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-lg border border-amber-300 z-20"
                />
              );
            }
          })}
        </div>

        {/* Wall Sensors */}
        <div className="absolute inset-3 pointer-events-none">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const leftPct = (c + 1) * (100 / 9);
              const topPct = (r + 1) * (100 / 9);

              return (
                <div
                  key={`koth-sensor-${r}-${c}`}
                  onClick={() => handlePlaceWall(r, c)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute w-9 h-9 rounded-full pointer-events-auto cursor-pointer z-30 transition-all hover:bg-amber-400/25 active:scale-95 group flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/0 group-hover:bg-amber-400/80 transition-all" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Red Wall Controls */}
      <div className="bg-cardDark border border-borderDark/60 p-3 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOrientation('h')}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              orientation === 'h' ? 'bg-rose-500 text-white border-rose-400' : 'bg-bgDark text-gray-400'
            }`}
          >
            <Shield size={13} />
            <span>Horizontal</span>
          </button>
          <button
            onClick={() => setOrientation('v')}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              orientation === 'v' ? 'bg-rose-500 text-white border-rose-400' : 'bg-bgDark text-gray-400'
            }`}
          >
            <Shield className="rotate-90" size={13} />
            <span>Vertical</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 uppercase font-bold">Barricades</span>
          <div className="text-sm font-bold text-rose-400">{wallsLeft.red} / 5</div>
        </div>
      </div>

      {/* Victory Modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
            <Crown className="text-amber-400 fill-amber-400 mb-2 animate-bounce" size={42} />
            <h2 className="text-2xl font-black text-white">King of the Hill!</h2>
            <p className="text-xs text-gray-400 mt-1 mb-4 font-medium">
              <strong className={PLAYER_DETAILS[winner].text}>{PLAYER_DETAILS[winner].name}</strong> reached the Crown first!
            </p>

            <button
              onClick={restartGame}
              className="w-full bg-[#22c55e] hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer mb-2"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
