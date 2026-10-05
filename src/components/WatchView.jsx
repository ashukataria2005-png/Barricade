import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Bot,
  Zap,
  Shield,
  Trophy,
  Coins,
  ChevronRight,
  Flame,
  Volume2
} from 'lucide-react';
import { getStoredStats, addCoins, deductCoins } from '../utils/stats';
import { getStoredTheme } from '../utils/themes';

const BOT_CHAMPIONS_RED = [
  { name: 'AlphaBot', rating: 2480, engine: 'Deep Neural Quoridor' },
  { name: 'StockTitan', rating: 2520, engine: 'Alpha-Beta Minimax 18-Ply' },
  { name: 'QuantumPawn', rating: 2490, engine: 'Heuristic BFS Matrix v4' },
];

const BOT_CHAMPIONS_BLUE = [
  { name: 'DeepWall', rating: 2415, engine: 'Monte Carlo Tree Search' },
  { name: 'NeuralBlade', rating: 2465, engine: 'Transformer Board Evaluator' },
  { name: 'MechaBlock', rating: 2440, engine: 'Reinforcement Learning GM' },
];

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export default function WatchView({ onBack, theme, equippedCosmetics, onStatsUpdate }) {
  const activeTheme = theme || getStoredTheme();

  // Match bot participants
  const [redBot, setRedBot] = useState(BOT_CHAMPIONS_RED[0]);
  const [blueBot, setBlueBot] = useState(BOT_CHAMPIONS_BLUE[0]);

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

  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1, 2, or 4
  const [spectatorCount, setSpectatorCount] = useState(884);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(2);
  const [moveHistory, setMoveHistory] = useState([
    { player: 'red', text: 'e2' },
    { player: 'blue', text: 'e8' },
  ]);

  // Prediction Mini-Game state
  const [userWallet, setUserWallet] = useState(() => getStoredStats());
  const [prediction, setPrediction] = useState(null); // 'red' | 'blue'
  const [predictionResult, setPredictionResult] = useState(null); // 'won' | 'lost'

  // Floating Emoji Reactions state
  const [reactions, setReactions] = useState([]);
  const reactionIdRef = useRef(1);

  // Procedural Celebratory Sound
  const playCelebrationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.32);
      });
    } catch (e) {}
  };

  // Realistic Viewer Fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpectatorCount((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
        return Math.max(820, Math.min(1050, prev + delta));
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Spawn Floating Emoji Reaction
  const spawnReaction = (emoji) => {
    const id = reactionIdRef.current++;
    const randomLeft = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    const newReaction = { id, emoji, left: randomLeft };
    setReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  // Simulated Crowd Reactions
  useEffect(() => {
    if (!isPlaying) return;
    const crowdEmojis = ['🔥', '👏', '🧱', '😱', '👑'];
    const interval = setInterval(() => {
      const randomEmoji = crowdEmojis[Math.floor(Math.random() * crowdEmojis.length)];
      spawnReaction(randomEmoji);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

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

  // Automated Grandmaster Turn Simulation
  useEffect(() => {
    if (!isPlaying || winner) return;

    const delay = Math.round(1200 / speedMultiplier);
    const timer = setTimeout(() => {
      executeBotStep();
    }, delay);

    return () => clearTimeout(timer);
  }, [turn, isPlaying, winner, speedMultiplier, walls, redPos, bluePos]);

  // Check Prediction when match completes
  useEffect(() => {
    if (winner && prediction && !predictionResult) {
      const winningColor = winner === redBot.name ? 'red' : 'blue';
      if (prediction === winningColor) {
        setPredictionResult('won');
        const updated = addCoins(50);
        setUserWallet(updated);
        onStatsUpdate?.(updated);
        playCelebrationChime();
        spawnReaction('🎉');
        spawnReaction('👑');
      } else {
        setPredictionResult('lost');
      }
    }
  }, [winner, prediction, predictionResult, redBot.name]);

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
      const notation = `${COLS[winMove.c]}${9 - winMove.r}`;
      setMoveHistory((prev) => [...prev.slice(-8), { player: turn, text: notation }]);
      if (isRed) {
        setRedPos(winMove);
        setWinner(redBot.name);
      } else {
        setBluePos(winMove);
        setWinner(blueBot.name);
      }
      return;
    }

    // Occasional clutch tactical wall placement (18% probability if walls remain)
    const wallsLeft = isRed ? redWalls : blueWalls;
    if (wallsLeft > 0 && Math.random() < 0.18) {
      const otherTargetRow = isRed ? 8 : 0;
      const targetOpponent = isRed ? bluePos : redPos;
      const testOrientation = Math.random() < 0.5 ? 'h' : 'v';
      const testR = Math.max(1, Math.min(7, targetOpponent.r + (isRed ? -1 : 0)));
      const testC = Math.max(1, Math.min(7, targetOpponent.c));

      const overlaps = walls.some((w) => w.r === testR && w.c === testC);
      if (!overlaps) {
        const newWall = { r: testR, c: testC, orientation: testOrientation };
        const testWalls = [...walls, newWall];

        // Ensure both players still have a path
        const redPath = getShortestPathLength(redPos, 0);
        const bluePath = getShortestPathLength(bluePos, 8);
        if (redPath !== Infinity && bluePath !== Infinity) {
          setWalls(testWalls);
          if (isRed) setRedWalls((w) => w - 1);
          else setBlueWalls((w) => w - 1);

          const notation = `🧱 ${COLS[testC]}${9 - testR} (${testOrientation})`;
          setMoveHistory((prev) => [...prev.slice(-8), { player: turn, text: notation }]);
          setTurn(isRed ? 'blue' : 'red');
          setMoveCount((prev) => prev + 1);
          spawnReaction('🧱');
          return;
        }
      }
    }

    // Step closest to targetRow
    let bestMove = validMoves[0];
    let minDistance = Infinity;

    for (const move of validMoves) {
      const dist = getShortestPathLength(move, targetRow);
      if (dist < minDistance) {
        minDistance = dist;
        bestMove = move;
      }
    }

    const notation = `${COLS[bestMove.c]}${9 - bestMove.r}`;
    setMoveHistory((prev) => [...prev.slice(-8), { player: turn, text: notation }]);

    if (isRed) {
      setRedPos(bestMove);
      if (bestMove.r === 0) setWinner(redBot.name);
      else setTurn('blue');
    } else {
      setBluePos(bestMove);
      if (bestMove.r === 8) setWinner(blueBot.name);
      else setTurn('red');
    }

    setMoveCount((prev) => prev + 1);
  };

  // Prediction Handler
  const handlePredict = (color) => {
    if (prediction) return;
    const currentCoins = userWallet.coins ?? 250;
    if (currentCoins < 25) {
      alert('You need at least 25 coins to place a prediction bet!');
      return;
    }
    const updated = deductCoins(25);
    if (updated) {
      setUserWallet(updated);
      onStatsUpdate?.(updated);
      setPrediction(color);
      spawnReaction('🔥');
    }
  };

  // Setup Next Match with random bot champions
  const nextMatch = () => {
    const randomRed = BOT_CHAMPIONS_RED[Math.floor(Math.random() * BOT_CHAMPIONS_RED.length)];
    const randomBlue = BOT_CHAMPIONS_BLUE[Math.floor(Math.random() * BOT_CHAMPIONS_BLUE.length)];

    setRedBot(randomRed);
    setBlueBot(randomBlue);
    setRedPos({ r: 8, c: 4 });
    setBluePos({ r: 0, c: 4 });
    setWalls([
      { r: Math.floor(Math.random() * 3) + 3, c: Math.floor(Math.random() * 4) + 2, orientation: 'h' },
      { r: Math.floor(Math.random() * 3) + 3, c: Math.floor(Math.random() * 4) + 2, orientation: 'v' },
    ]);
    setRedWalls(9);
    setBlueWalls(9);
    setWinner(null);
    setTurn('red');
    setMoveCount(1);
    setMoveHistory([]);
    setPrediction(null);
    setPredictionResult(null);
    setIsPlaying(true);
  };

  // Cosmetic styles
  const getPawnStyle = (color) => {
    const skin = equippedCosmetics?.pawn || 'pawn_default';
    if (skin === 'pawn_fire') {
      return color === 'red'
        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 border-amber-300 ring-2 ring-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.9)] animate-pulse'
        : 'bg-gradient-to-br from-orange-400 to-rose-600 border-amber-300 ring-2 ring-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.9)]';
    }
    if (skin === 'pawn_neon') {
      return color === 'red'
        ? 'bg-gradient-to-br from-cyan-300 via-cyan-500 to-blue-600 border-cyan-200 ring-2 ring-cyan-400/90 shadow-[0_0_14px_rgba(6,182,212,0.9)] animate-pulse'
        : 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 ring-2 ring-blue-400/90 shadow-[0_0_14px_rgba(59,130,246,0.9)]';
    }
    if (skin === 'pawn_gold') {
      return 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-yellow-200 ring-2 ring-yellow-400/90 shadow-[0_0_14px_rgba(251,191,36,0.9)]';
    }
    return color === 'red' ? activeTheme.redPawn : activeTheme.bluePawn;
  };

  const getWallStyle = (orientation) => {
    const skin = equippedCosmetics?.wall || 'wall_default';
    if (skin === 'wall_obsidian') {
      return 'bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 border border-zinc-700 shadow-md ring-1 ring-zinc-700/50';
    }
    if (skin === 'wall_carbon') {
      return 'bg-gradient-to-r from-slate-800 via-zinc-800 to-slate-900 border border-slate-600 shadow-md';
    }
    if (skin === 'wall_gold') {
      return 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.8)]';
    }
    return `bg-gradient-to-r ${activeTheme.wallGradient} border ${activeTheme.wallBorder}`;
  };

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-2 py-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition cursor-pointer bg-cardDark border border-borderDark px-2.5 py-1 rounded-xl"
        >
          <ArrowLeft size={15} />
          <span>Exit TV</span>
        </button>

        <div className="flex items-center gap-2">
          {/* User Wallet Balance */}
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300">
            <Coins size={12} className="text-amber-400" />
            <span className="font-mono">{userWallet.coins ?? 250}</span>
          </div>

          {/* Live Badge */}
          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-700/60 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Eye size={12} />
            <span className="font-mono">{spectatorCount}</span>
          </div>
        </div>
      </div>

      {/* Opponent Card (Blue Bot) */}
      <div className="bg-cardDark/90 border border-borderDark/60 p-2.5 rounded-2xl flex items-center justify-between mt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center text-blue-400">
            <Bot size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-200">{blueBot.name}</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1 rounded font-bold font-mono">
                {blueBot.rating}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block">{blueBot.engine}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400">🧱 {blueWalls}</span>
          <div
            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
              turn === 'blue' && !winner ? 'bg-blue-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'
            }`}
          >
            {winner ? (winner === blueBot.name ? 'Winner 👑' : 'Defeated') : turn === 'blue' ? 'Thinking...' : 'Waiting'}
          </div>
        </div>
      </div>

      {/* Spectator Playback Controls Strip */}
      <div className="flex items-center justify-between bg-bgDark/80 border border-borderDark/60 rounded-xl px-3 py-1.5 my-1 text-xs">
        <span className="text-gray-400 font-mono text-[11px]">Move #{moveCount}</span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 bg-cardDark hover:bg-borderDark border border-borderDark px-2 py-1 rounded-lg text-xs text-gray-200 font-semibold cursor-pointer transition"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Speed Selector: 1x, 2x, 4x */}
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeedMultiplier(spd)}
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold border transition cursor-pointer ${
                speedMultiplier === spd
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-cardDark border-borderDark text-gray-400'
              }`}
            >
              {spd}x
            </button>
          ))}

          <button
            onClick={nextMatch}
            className="p-1 hover:bg-cardDark rounded-lg text-gray-400 hover:text-white cursor-pointer ml-1"
            title="Next Match"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 9x9 Board with Floating Reactions Container */}
      <div className="relative bg-[#161618] p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
        {/* Floating Emoji Particles */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-6 text-2xl animate-in fade-in slide-out-to-top-36 duration-1000 ease-out transition-all"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* 9x9 Grid Tiles */}
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
                    <div
                      className={`w-6 h-6 rounded-full border-2 shadow-lg transition-transform ${getPawnStyle(
                        'red'
                      )}`}
                    />
                  )}
                  {isBlue && (
                    <div
                      className={`w-6 h-6 rounded-full border-2 shadow-lg transition-transform ${getPawnStyle(
                        'blue'
                      )}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Placed Walls */}
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
                  className={`absolute rounded-full shadow-lg z-20 ${getWallStyle('h')}`}
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
                  className={`absolute rounded-full shadow-lg z-20 ${getWallStyle('v')}`}
                />
              );
            }
          })}
        </div>
      </div>

      {/* Move History Live Feed Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 bg-cardDark/50 border border-borderDark/40 rounded-xl my-1 text-[11px] font-mono scrollbar-none">
        <span className="text-gray-500 font-bold shrink-0">Moves:</span>
        {moveHistory.slice(-6).map((m, i) => (
          <span
            key={i}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
              m.player === 'red' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {m.text}
          </span>
        ))}
      </div>

      {/* Opponent Card (Red Bot) */}
      <div className="bg-cardDark/90 border border-borderDark/60 p-2.5 rounded-2xl flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center text-rose-400">
            <Bot size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-200">{redBot.name}</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 rounded font-bold font-mono">
                {redBot.rating}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block">{redBot.engine}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400">🧱 {redWalls}</span>
          <div
            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
              turn === 'red' && !winner ? 'bg-rose-600 text-white animate-pulse' : 'bg-bgDark text-gray-500'
            }`}
          >
            {winner ? (winner === redBot.name ? 'Winner 👑' : 'Defeated') : turn === 'red' ? 'Thinking...' : 'Waiting'}
          </div>
        </div>
      </div>

      {/* Floating Spectator Emoji Reactions Dock */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">React:</span>
          {['🔥', '👏', '🧱', '😱', '👑'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => spawnReaction(emoji)}
              className="text-base p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer bg-cardDark/80 hover:bg-borderDark border border-borderDark/60 rounded-lg"
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          onClick={nextMatch}
          className="text-[11px] text-brandOrange hover:underline font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Next Match</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Bot Match Prediction Wager Strip */}
      {!winner && !prediction && moveCount <= 10 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-cardDark to-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl flex flex-col gap-1.5 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-200 flex items-center gap-1.5">
              <span>🎯</span> Predict Winner (Bet 25 🪙 · Win 50 🪙)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Wallet: {userWallet.coins ?? 250} 🪙</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              onClick={() => handlePredict('red')}
              className="py-1.5 px-2 rounded-xl bg-rose-500/20 border border-rose-500/50 hover:bg-rose-500/30 text-rose-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔴</span>
              <span>{redBot.name}</span>
            </button>
            <button
              onClick={() => handlePredict('blue')}
              className="py-1.5 px-2 rounded-xl bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 text-blue-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔵</span>
              <span>{blueBot.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Prediction Locked Badge */}
      {!winner && prediction && (
        <div className="bg-cardDark border border-amber-500/40 p-2 rounded-xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Predicted:{' '}
              <strong className="text-white">
                {prediction === 'red' ? redBot.name : blueBot.name}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-bold text-green-400 font-mono">+50 🪙 on Win</span>
        </div>
      )}

      {/* Match Outcome & Prediction Reward Modal/Banner */}
      {winner && (
        <div className="bg-cardDark border border-borderDark rounded-2xl p-3.5 text-center shadow-2xl flex flex-col items-center gap-1.5 animate-in zoom-in-95">
          <Trophy className="text-amber-400" size={22} />
          <h3 className="text-sm font-bold text-white">
            {winner} Wins the Arena Match!
          </h3>

          {prediction && (
            <div
              className={`p-2 rounded-xl text-xs font-bold w-full my-0.5 ${
                predictionResult === 'won'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {predictionResult === 'won'
                ? '🎉 Prediction Correct! You won +50 Coins!'
                : `Prediction incorrect! Better luck in the next match.`}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={nextMatch}
              className="bg-brandOrange hover:bg-amber-500 text-black font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer"
            >
              Watch Next Match
            </button>
            <button
              onClick={onBack}
              className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Exit Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
