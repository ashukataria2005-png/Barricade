import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Bot,
  Cpu,
  Volume2,
  VolumeX,
  History
} from 'lucide-react';
import { getStoredStats, recordMatchOutcome } from '../utils/stats';
import ChatModal from './ChatModal';

// ───────────────── PROCEDURAL WEB AUDIO SYNTHESIZER ─────────────────
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const playMoveSound = (ctx) => {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.055);
};

const playWallSound = (ctx) => {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.11);

  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

const playInvalidSound = (ctx) => {
  const now = ctx.currentTime;
  [0, 0.075].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now + delay);
    osc.frequency.setValueAtTime(100, now + delay + 0.045);

    gain.gain.setValueAtTime(0.18, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.055);
  });
};

const playWinSound = (ctx) => {
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.085;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.25, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
};

const playLossSound = (ctx) => {
  const now = ctx.currentTime;
  const notes = [440, 392, 349.23, 293.66];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.11;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.22, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
};

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export default function GameBoard({ gameMinutes = 3, gameMode = 'ranked', onBack, onStatsUpdate }) {
  const initialSeconds = (gameMinutes || 3) * 60;

  // Turn: 'red' | 'blue'
  const [turn, setTurn] = useState('red');

  // Positions: 0 to 8
  const [redPos, setRedPos] = useState({ r: 8, c: 4 });
  const [bluePos, setBluePos] = useState({ r: 0, c: 4 });

  // Walls left
  const [redWalls, setRedWalls] = useState(10);
  const [blueWalls, setBlueWalls] = useState(10);

  // Placed walls
  const [walls, setWalls] = useState([]);

  // Orientations
  const [blueOrientation, setBlueOrientation] = useState('h');
  const [redOrientation, setRedOrientation] = useState('h');

  // Timers initialized strictly to gameMinutes
  const [blueTime, setBlueTime] = useState(initialSeconds);
  const [redTime, setRedTime] = useState(initialSeconds);

  // Result state
  const [gameResult, setGameResult] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Move history notation state
  const [moveHistory, setMoveHistory] = useState([]);
  const notationScrollRef = useRef(null);

  // Persistent User stats
  const [userStats, setUserStats] = useState(() => getStoredStats());

  // In-Game Chat state & reactions
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [floatingBubble, setFloatingBubble] = useState(null);

  const handleSendMessage = (text) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'me', text, time: timeStr };
    setChatMessages((prev) => [...prev, newMsg]);
    setFloatingBubble({ sender: 'me', text });
    setTimeout(() => setFloatingBubble((curr) => (curr?.text === text ? null : curr)), 3000);

    // AI opponent reply simulation
    if (gameMode === 'ai') {
      setTimeout(() => {
        const botResponses = [
          'Well played! 🤝',
          'Good move! 🧱',
          'Thanks! 🤖',
          'Impressive strategy! 🔥',
          'Thinking... 🤔',
          'Game on! ⚡'
        ];
        const replyText = botResponses[Math.floor(Math.random() * botResponses.length)];
        const botReply = { sender: 'opponent', text: replyText, time: timeStr };
        setChatMessages((prev) => [...prev, botReply]);
        setFloatingBubble({ sender: 'opponent', text: replyText });
        setTimeout(() => setFloatingBubble((curr) => (curr?.text === replyText ? null : curr)), 3000);
        playAudio('move');
      }, 900);
    }
  };

  // AI thinking state
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Double tap confirmation states
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  // Audio dispatcher
  const playAudio = (type) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (type === 'move') playMoveSound(ctx);
      else if (type === 'wall') playWallSound(ctx);
      else if (type === 'invalid') playInvalidSound(ctx);
      else if (type === 'win') playWinSound(ctx);
      else if (type === 'loss') playLossSound(ctx);
    } catch (e) {}
  };

  // Outcome trigger helper with automatic LocalStorage update
  const triggerGameEnd = (result) => {
    setGameResult(result);
    const opponent =
      gameMode === 'ai'
        ? 'StockBot (AI)'
        : gameMode === 'friend'
        ? 'Friend (Room)'
        : 'kamal47 (1188)';

    const updated = recordMatchOutcome({
      isWin: result.isYouWin,
      opponent,
      eloDelta: result.eloDelta,
      movesCount: moveHistory.length + 1,
    });
    setUserStats(updated);
    if (onStatsUpdate) onStatsUpdate(updated);
  };

  // Play result sound when game ends
  useEffect(() => {
    if (!gameResult) return;
    if (gameResult.isYouWin) {
      playAudio('win');
    } else {
      playAudio('loss');
    }
  }, [gameResult]);

  // Keep timers synchronized when gameMinutes prop updates
  useEffect(() => {
    const secs = (gameMinutes || 3) * 60;
    setBlueTime(secs);
    setRedTime(secs);
  }, [gameMinutes]);

  // Auto-scroll move notation ribbon to latest move
  useEffect(() => {
    if (notationScrollRef.current) {
      notationScrollRef.current.scrollLeft = notationScrollRef.current.scrollWidth;
    }
  }, [moveHistory]);

  // Turn-based live countdown clocks
  useEffect(() => {
    if (gameResult) return;
    const interval = setInterval(() => {
      if (turn === 'red') {
        setRedTime((prev) => {
          if (prev <= 1) {
            triggerGameEnd({
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
            triggerGameEnd({
              winner: 'red',
              reason: gameMode === 'ai' ? 'StockBot timed out' : 'Blue player timed out',
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
  }, [turn, gameResult, gameMode]);

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
      playAudio('invalid');
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

  const getShortestPath = (startPos, targetRow, wallList) => {
    const queue = [{ r: startPos.r, c: startPos.c, path: [{ r: startPos.r, c: startPos.c }] }];
    const visited = new Set();
    visited.add(`${startPos.r},${startPos.c}`);

    const deltas = [
      { r: targetRow === 8 ? 1 : -1, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: -1 },
      { r: targetRow === 8 ? -1 : 1, c: 0 },
    ];

    while (queue.length > 0) {
      const { r, c, path } = queue.shift();
      if (r === targetRow) return path;

      for (let d of deltas) {
        const nr = r + d.r;
        const nc = c + d.c;
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            if (!isWallBetween(r, c, nr, nc, wallList)) {
              visited.add(key);
              queue.push({ r: nr, c: nc, path: [...path, { r: nr, c: nc }] });
            }
          }
        }
      }
    }
    return null;
  };

  const getShortestPathLength = (startPos, targetRow, wallList) => {
    const path = getShortestPath(startPos, targetRow, wallList);
    return path ? path.length - 1 : Infinity;
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

  // 🤖 SMART AI DECISION ENGINE
  const executeAiTurn = () => {
    if (gameResult) return;

    const redPath = getShortestPath(redPos, 0, walls);
    const bluePath = getShortestPath(bluePos, 8, walls);
    const redDist = redPath ? redPath.length - 1 : Infinity;
    const blueDist = bluePath ? bluePath.length - 1 : Infinity;

    let bestWall = null;
    let maxGain = 0;

    const shouldConsiderWall = blueWalls > 0 && (redDist <= 4 || (blueDist > redDist && blueWalls > 2));
    const wallProbability = redDist <= 2 ? 0.90 : 0.40;

    if (shouldConsiderWall && Math.random() < wallProbability) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          for (let orientation of ['h', 'v']) {
            const overlap = walls.some((w) => {
              if (w.r === r && w.c === c) return true;
              if (orientation === 'h') {
                if (w.orientation === 'h' && w.r === r && Math.abs(w.c - c) <= 1) return true;
              } else {
                if (w.orientation === 'v' && w.c === c && Math.abs(w.r - r) <= 1) return true;
              }
              return false;
            });

            if (!overlap) {
              const testWalls = [...walls, { r, c, orientation }];
              if (hasPathToGoal(redPos, 0, testWalls) && hasPathToGoal(bluePos, 8, testWalls)) {
                const newRedDist = getShortestPathLength(redPos, 0, testWalls);
                const newBlueDist = getShortestPathLength(bluePos, 8, testWalls);

                const redIncrease = newRedDist - redDist;
                const blueIncrease = newBlueDist - blueDist;
                const gain = redIncrease - blueIncrease;

                if (redIncrease > 0 && gain > maxGain) {
                  maxGain = gain;
                  bestWall = { r, c, orientation };
                }
              }
            }
          }
        }
      }
    }

    if (bestWall && maxGain > 0) {
      setWalls((prev) => [...prev, bestWall]);
      setBlueWalls((prev) => prev - 1);
      playAudio('wall');

      const notation = `${bestWall.orientation}${COLS[bestWall.c]}${8 - bestWall.r}`;
      setMoveHistory((prev) => [...prev, { player: 'blue', type: 'wall', notation }]);

      setTurn('red');
      return;
    }

    const validMoves = getValidMoves(bluePos, redPos);
    if (validMoves.length > 0) {
      const directWin = validMoves.find((m) => m.r === 8);
      if (directWin) {
        setBluePos(directWin);
        playAudio('move');
        const notation = `${COLS[directWin.c]}${9 - directWin.r}`;
        setMoveHistory((prev) => [...prev, { player: 'blue', type: 'pawn', notation }]);

        triggerGameEnd({
          winner: 'blue',
          reason: 'StockBot reached the goal first',
          isYouWin: false,
          eloDelta: -10,
        });
        return;
      }

      let bestMove = validMoves[0];
      let minDistance = Infinity;

      for (const move of validMoves) {
        const dist = getShortestPathLength(move, 8, walls);
        if (dist < minDistance) {
          minDistance = dist;
          bestMove = move;
        }
      }

      setBluePos(bestMove);
      playAudio('move');
      const notation = `${COLS[bestMove.c]}${9 - bestMove.r}`;
      setMoveHistory((prev) => [...prev, { player: 'blue', type: 'pawn', notation }]);

      if (bestMove.r === 8) {
        triggerGameEnd({
          winner: 'blue',
          reason: 'StockBot reached the goal first',
          isYouWin: false,
          eloDelta: -10,
        });
      } else {
        setTurn('red');
      }
    }
  };

  useEffect(() => {
    if (gameMode !== 'ai' || turn !== 'blue' || gameResult) {
      setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      executeAiTurn();
      setIsAiThinking(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [turn, gameMode, gameResult, walls, redPos, bluePos, blueWalls]);

  const handleCellClick = (r, c) => {
    if (gameResult) return;
    if (gameMode === 'ai' && turn === 'blue') return;

    const currentPos = turn === 'red' ? redPos : bluePos;
    const otherPos = turn === 'red' ? bluePos : redPos;
    const validMoves = getValidMoves(currentPos, otherPos);

    if (validMoves.some((m) => m.r === r && m.c === c)) {
      playAudio('move');
      const notation = `${COLS[c]}${9 - r}`;
      setMoveHistory((prev) => [...prev, { player: turn, type: 'pawn', notation }]);

      if (turn === 'red') {
        setRedPos({ r, c });
        if (r === 0) {
          triggerGameEnd({
            winner: 'red',
            reason: gameMode === 'ai' ? 'You defeated StockBot!' : 'You reached the goal first',
            isYouWin: true,
            eloDelta: +12,
          });
        } else {
          setTurn('blue');
        }
      } else {
        setBluePos({ r, c });
        if (r === 8) {
          triggerGameEnd({
            winner: 'blue',
            reason: 'Player 2 reached the goal first',
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
    if (gameMode === 'ai' && turn === 'blue') return;

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
    playAudio('wall');

    const notation = `${activeOrientation}${COLS[c]}${8 - r}`;
    setMoveHistory((prev) => [...prev, { player: turn, type: 'wall', notation }]);

    if (isRed) {
      setRedWalls((prev) => prev - 1);
      setTurn('blue');
    } else {
      setBlueWalls((prev) => prev - 1);
      setTurn('red');
    }
  };

  const handleResignClick = () => {
    if (!confirmResign) {
      setConfirmResign(true);
    } else {
      triggerGameEnd({
        winner: 'blue',
        reason: 'You resigned',
        isYouWin: false,
        eloDelta: -11,
      });
      setConfirmResign(false);
    }
  };

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
    setIsAiThinking(false);
    setMoveHistory([]);
  };

  const currentPos = turn === 'red' ? redPos : bluePos;
  const otherPos = turn === 'red' ? bluePos : redPos;
  const validMoves = getValidMoves(currentPos, otherPos);

  const rounds = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    rounds.push({
      roundNum: Math.floor(i / 2) + 1,
      red: moveHistory[i],
      blue: moveHistory[i + 1] || null,
    });
  }

  return (
    <div className="flex flex-col h-full select-none max-w-md mx-auto justify-between py-1 relative">
      {/* ───────────────── TOP BAR (Opponent Blue / StockBot / Room) ───────────────── */}
      <div
        className={`p-3 rounded-2xl border transition-all duration-200 ${
          turn === 'blue'
            ? 'bg-blue-950/30 border-blue-500/70 shadow-lg shadow-blue-950/40'
            : 'bg-cardDark/80 border-borderDark/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
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

            <button
              type="button"
              onClick={handleResignClick}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                confirmResign
                  ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-md'
                  : 'bg-cardDark hover:bg-borderDark border-borderDark text-gray-400 hover:text-gray-200'
              }`}
            >
              <Flag size={13} />
              <span>{confirmResign ? 'Confirm?' : 'Resign'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                isMuted
                  ? 'bg-cardDark text-gray-500 border-borderDark hover:text-gray-300'
                  : 'bg-cardDark text-cyan-400 border-borderDark hover:bg-borderDark'
              }`}
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* In-Game Chat Toggle */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="p-1.5 rounded-lg border text-xs font-semibold bg-cardDark text-gray-400 hover:text-white border-borderDark hover:bg-borderDark transition cursor-pointer relative"
              title="Open Chat"
            >
              <MessageSquare size={15} />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brandOrange" />
              )}
            </button>
          </div>

          {/* Opponent Floating Speech Bubble */}
          {floatingBubble && floatingBubble.sender === 'opponent' && (
            <div className="absolute top-14 left-14 z-40 bg-cardDark text-brandOrange border border-brandOrange/80 px-2.5 py-1 rounded-2xl text-xs font-bold shadow-2xl animate-bounce">
              {floatingBubble.text}
            </div>
          )}

          {gameMode === 'ai' ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
                <Bot size={15} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-200">StockBot (AI)</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 rounded font-bold">1450</span>
                </div>
                {isAiThinking ? (
                  <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>StockBot is thinking...</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-blue-400 font-semibold">{blueWalls}/10 barricades</span>
                )}
              </div>
            </div>
          ) : gameMode === 'friend' ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
              <span className="text-sm font-bold text-gray-200">Friend (Room)</span>
              <span className="text-xs text-blue-400 font-semibold">{blueWalls}/10</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
              <span className="text-sm font-bold text-gray-200">
                {gameMode === 'local' ? 'Player 2 (Blue)' : 'kamal47 (1188) 🇮🇳'}
              </span>
              <span className="text-xs text-blue-400 font-semibold">{blueWalls}/10</span>
            </div>
          )}

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

        {gameMode === 'ai' ? (
          <div className="flex items-center justify-between bg-bgDark/60 border border-borderDark/60 rounded-xl px-3 py-1.5 mt-2.5 text-[11px] text-gray-300">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <Cpu size={13} />
              <span>Smart BFS Pathfinding Engine</span>
            </span>
            <span className="text-gray-400">
              AI Inventory: <strong className="text-white font-mono">{blueWalls}</strong>
            </span>
          </div>
        ) : (
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
        )}
      </div>

      {/* ───────────────── LIVE MOVE NOTATION RIBBON ───────────────── */}
      <div className="w-full bg-[#18181b]/90 border border-borderDark/60 rounded-xl px-3 py-1.5 my-1.5 flex items-center gap-2 overflow-hidden shadow-inner">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 select-none">
          <History size={12} className="text-brandOrange" />
          <span>Moves</span>
        </div>
        <div
          ref={notationScrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {rounds.length === 0 ? (
            <span className="text-[11px] text-gray-500 italic">Game start · Red to move</span>
          ) : (
            rounds.map((round) => (
              <div
                key={round.roundNum}
                className="flex items-center gap-1 shrink-0 bg-cardDark/90 border border-borderDark/50 px-2 py-0.5 rounded-lg text-[11px] font-mono shadow-xs"
              >
                <span className="text-gray-500 font-semibold">{round.roundNum}.</span>
                <span
                  className={`font-bold ${
                    round.red?.type === 'wall' ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {round.red?.notation}
                </span>
                {round.blue && (
                  <span
                    className={`font-bold ml-1 ${
                      round.blue?.type === 'wall' ? 'text-amber-400' : 'text-blue-400'
                    }`}
                  >
                    {round.blue?.notation}
                  </span>
                )}
              </div>
            ))
          )}
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
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 sm:gap-2 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isRed = redPos.r === r && redPos.c === c;
              const isBlue = bluePos.r === r && bluePos.c === c;
              const isValid = validMoves.some((m) => m.r === r && m.c === c);
              const isAiTurn = gameMode === 'ai' && turn === 'blue';

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center rounded-lg transition-all aspect-square touch-manipulation ${
                    isAiTurn ? 'cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isValid && !isAiTurn
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
                  {isValid && !isRed && !isBlue && !isAiTurn && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Barricades */}
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

        {/* Intersection Sensors */}
        <div className="absolute inset-3 pointer-events-none">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const leftPct = (c + 1) * (100 / 9);
              const topPct = (r + 1) * (100 / 9);
              const isAiTurn = gameMode === 'ai' && turn === 'blue';

              return (
                <div
                  key={`sensor-${r}-${c}`}
                  onClick={() => handlePlaceWall(r, c)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute w-9 h-9 sm:w-11 sm:h-11 rounded-full z-30 transition-all touch-manipulation group flex items-center justify-center ${
                    isAiTurn
                      ? 'pointer-events-none cursor-not-allowed'
                      : 'pointer-events-auto cursor-pointer hover:bg-amber-400/25 active:bg-amber-400/40 active:scale-95'
                  }`}
                >
                  {!isAiTurn && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/0 group-hover:bg-amber-400/80 transition-all" />
                  )}
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
            <span className="text-sm font-bold text-gray-200">
              {userStats.username || 'AshuKataria'} ({userStats.elo || 1092}) 🇮🇳
            </span>
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

        {/* Player Floating Speech Bubble */}
        {floatingBubble && floatingBubble.sender === 'me' && (
          <div className="absolute -top-8 right-8 z-40 bg-brandOrange text-black px-2.5 py-1 rounded-2xl text-xs font-bold shadow-2xl animate-bounce">
            {floatingBubble.text}
          </div>
        )}
      </div>

      {/* ───────────────── RESULT MODAL ───────────────── */}
      {gameResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-[#1c1c1e] border border-borderDark rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative">
            <div className="w-full flex items-center justify-between text-gray-400 mb-2">
              <button type="button" className="p-1 hover:text-white transition cursor-pointer">
                <Download size={20} />
              </button>
              <button type="button" className="p-1 hover:text-white transition cursor-pointer">
                <Share2 size={20} />
              </button>
            </div>

            <h2 className="text-2xl font-black tracking-wide text-white">
              {gameResult.isYouWin ? 'You won' : 'You lost'}
            </h2>
            <p className="text-xs text-gray-400 mt-1 mb-4 font-medium">{gameResult.reason}</p>

            <div
              className={`text-xl font-black ${
                gameResult.eloDelta > 0 ? 'text-green-400' : 'text-rose-500'
              }`}
            >
              {gameResult.eloDelta > 0 ? `+${gameResult.eloDelta}` : gameResult.eloDelta} Elo
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5 mb-4">
              {gameResult.isYouWin
                ? `${userStats.elo - gameResult.eloDelta} → ${userStats.elo}`
                : `${userStats.elo + Math.abs(gameResult.eloDelta)} → ${userStats.elo}`}
            </div>

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
                : 'Set complete — match ended.'}
            </p>

            <button
              type="button"
              onClick={restartGame}
              className="w-full bg-[#22c55e] hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-green-500/20 cursor-pointer mb-3"
            >
              {gameResult.isYouWin ? 'Rematch' : gameMode === 'ai' ? 'Play Again' : 'New ranked game'}
            </button>

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

            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] text-gray-300 font-semibold py-2.5 rounded-xl text-xs transition mb-4 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Chat</span>
            </button>

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

      {/* In-Game Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        gameMode={gameMode}
        opponentName={
          gameMode === 'ai'
            ? 'StockBot (AI)'
            : gameMode === 'friend'
            ? 'Friend'
            : 'kamal47'
        }
        onSendMessage={handleSendMessage}
        messages={chatMessages}
      />
    </div>
  );
}