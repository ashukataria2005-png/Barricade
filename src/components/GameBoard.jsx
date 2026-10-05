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
  History,
  Undo2,
  Sliders,
  Sparkles,
  MoreVertical,
  BookOpen
} from 'lucide-react';
import { getStoredStats, recordMatchOutcome, checkQuestsOnMatchEnd } from '../utils/stats';
import { getStoredTheme } from '../utils/themes';
import { getStoredSettings } from '../utils/settings';
import { hapticMove, hapticWall, hapticError, hapticVictory } from '../utils/haptics';
import { checkMatchAchievements } from '../utils/achievements';
import { t } from '../utils/i18n';
import ChatModal from './ChatModal';
import HowToPlayModal from './HowToPlayModal';

// ───────────────── PROCEDURAL WEB AUDIO SYNTHESIZER ─────────────────
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    return null;
  }
  return audioCtx;
};

const playMoveSound = (ctx, vol = 0.8) => {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

  gain.gain.setValueAtTime(0.35 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.055);
};

const playWallSound = (ctx, vol = 0.8) => {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.11);

  gain.gain.setValueAtTime(0.45 * vol, now);
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
    noiseGain.gain.setValueAtTime(0.4 * vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

const playInvalidSound = (ctx, vol = 0.8) => {
  const now = ctx.currentTime;
  [0, 0.075].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now + delay);
    osc.frequency.setValueAtTime(100, now + delay + 0.045);

    gain.gain.setValueAtTime(0.18 * vol, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.055);
  });
};

const playWinSound = (ctx, vol = 0.8) => {
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.085;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.25 * vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
};

const playLossSound = (ctx, vol = 0.8) => {
  const now = ctx.currentTime;
  const notes = [440, 392, 349.23, 293.66];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.11;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.22 * vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
};

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export default function GameBoard({
  gameMinutes = 3,
  gameMode = 'ranked',
  theme,
  onBack,
  onStatsUpdate,
  onAnalyze,
  onOpenSettings,
  multiplayerSession,
  multiplayerRole = 'host',
  myColor = 'red',
  opponentName,
  tournamentMatch,
  equippedCosmetics,
  lang = 'en',
  startingWalls = 10,
  incrementSeconds = 0,
}) {
  const activeTheme = theme || getStoredTheme();
  const initialSeconds = (gameMinutes || 3) * 60;

  // Turn: 'red' | 'blue'
  const [turn, setTurn] = useState('red');

  // Positions: 0 to 8
  const [redPos, setRedPos] = useState({ r: 8, c: 4 });
  const [bluePos, setBluePos] = useState({ r: 0, c: 4 });

  // Walls left
  const [redWalls, setRedWalls] = useState(startingWalls);
  const [blueWalls, setBlueWalls] = useState(startingWalls);

  // Placed walls
  const [walls, setWalls] = useState([]);

  // Orientations
  const [blueOrientation, setBlueOrientation] = useState('h');
  const [redOrientation, setRedOrientation] = useState('h');

  // Dynamic Wall Selection state: null (Default Pawn Move mode) | 'h' | 'v'
  const [selectedWallMode, setSelectedWallMode] = useState(null);

  // 3-Dot Action Menu Bottom Sheet & Rules Modal
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

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

  // AI Difficulty Level: 'easy' | 'medium' | 'hard'
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  // Move Undo History Stack (for local & practice games)
  const [undoStack, setUndoStack] = useState([]);

  // Full Game Review Snapshots
  const [gameSnapshots, setGameSnapshots] = useState([
    {
      moveIdx: 0,
      player: null,
      type: 'start',
      notation: 'Start',
      redPos: { r: 8, c: 4 },
      bluePos: { r: 0, c: 4 },
      walls: [],
      redWalls: startingWalls,
      blueWalls: startingWalls,
    },
  ]);

  // AI thinking state
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Cosmetic skin style helpers
  const getPawnCosmeticStyle = (color) => {
    const skin = equippedCosmetics?.pawn || 'pawn_default';
    if (skin === 'pawn_fire') {
      return color === 'red'
        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 border-amber-300 ring-2 ring-orange-500/80 shadow-[0_0_14px_rgba(249,115,22,0.9)] animate-pulse'
        : 'bg-gradient-to-br from-orange-400 to-rose-600 border-amber-300 ring-2 ring-rose-500/80 shadow-[0_0_14px_rgba(244,63,94,0.9)]';
    }
    if (skin === 'pawn_neon') {
      return color === 'red'
        ? 'bg-gradient-to-br from-cyan-300 via-cyan-500 to-blue-600 border-cyan-200 ring-2 ring-cyan-400/90 shadow-[0_0_16px_rgba(6,182,212,0.9)] animate-pulse'
        : 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 ring-2 ring-blue-400/90 shadow-[0_0_16px_rgba(59,130,246,0.9)]';
    }
    if (skin === 'pawn_gold') {
      return 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-yellow-200 ring-2 ring-yellow-400/90 shadow-[0_0_16px_rgba(251,191,36,0.9)]';
    }
    return color === 'red' ? activeTheme.redPawn : activeTheme.bluePawn;
  };

  const getWallCosmeticStyle = (orientation) => {
    const skin = equippedCosmetics?.wall || 'wall_default';
    if (skin === 'wall_obsidian') {
      return orientation === 'h'
        ? 'bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 border-zinc-700 shadow-md ring-1 ring-zinc-700/50'
        : 'bg-gradient-to-b from-zinc-950 via-slate-900 to-zinc-950 border-zinc-700 shadow-md ring-1 ring-zinc-700/50';
    }
    if (skin === 'wall_carbon') {
      return orientation === 'h'
        ? 'bg-gradient-to-r from-slate-800 via-zinc-800 to-slate-900 border-slate-600 shadow-md'
        : 'bg-gradient-to-b from-slate-800 via-zinc-800 to-slate-900 border-slate-600 shadow-md';
    }
    if (skin === 'wall_gold') {
      return orientation === 'h'
        ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.7)]'
        : 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.7)]';
    }
    return orientation === 'h'
      ? `bg-gradient-to-r ${activeTheme.wallGradient} border ${activeTheme.wallBorder}`
      : `bg-gradient-to-b ${activeTheme.wallGradient} border ${activeTheme.wallBorder}`;
  };

  // Double tap confirmation states
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  // Match stats refs for achievements
  const matchStartTimeRef = useRef(Date.now());
  const wallsPlacedInMatchRef = useRef(0);

  // Push snapshot to undo stack
  const pushUndoSnapshot = () => {
    if (gameMode !== 'local' && gameMode !== 'ai') return;
    setUndoStack((prev) => [
      ...prev,
      {
        turn,
        redPos: { ...redPos },
        bluePos: { ...bluePos },
        walls: [...walls],
        redWalls,
        blueWalls,
        moveHistory: [...moveHistory],
      },
    ]);
  };

  // Undo Move handler
  const handleUndo = () => {
    if (undoStack.length === 0 || gameResult || isAiThinking) return;

    const targetSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setTurn(targetSnapshot.turn);
    setRedPos(targetSnapshot.redPos);
    setBluePos(targetSnapshot.bluePos);
    setWalls(targetSnapshot.walls);
    setRedWalls(targetSnapshot.redWalls);
    setBlueWalls(targetSnapshot.blueWalls);
    setMoveHistory(targetSnapshot.moveHistory);
    setGameSnapshots((prev) =>
      prev.slice(0, gameMode === 'ai' ? Math.max(1, prev.length - 2) : Math.max(1, prev.length - 1))
    );
    setSelectedWallMode(null);
    playAudio('move');
  };

  // Real-Time P2P WebRTC Multiplayer Synchronization
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !multiplayerSession) return;

    const conn = multiplayerSession.getConnection?.();
    if (!conn) return;

    const handleRemoteData = (data) => {
      if (!data) return;

      if (data.type === 'MOVE') {
        const { r, c, player } = data;
        if (player === 'red') {
          setRedPos({ r, c });
          playAudio('move');
          const notation = `${COLS[c]}${9 - r}`;
          setMoveHistory((prev) => [...prev, { player: 'red', type: 'pawn', notation }]);
          setGameSnapshots((prev) => [
            ...prev,
            {
              moveIdx: prev.length,
              player: 'red',
              type: 'pawn',
              notation,
              redPos: { r, c },
              bluePos: { ...bluePos },
              walls: [...walls],
              redWalls,
              blueWalls,
            },
          ]);
          if (r === 0) {
            triggerGameEnd({
              winner: 'red',
              reason: myColor === 'red' ? 'You reached the goal first!' : 'Opponent reached the goal first',
              isYouWin: myColor === 'red',
              eloDelta: myColor === 'red' ? 12 : -11,
            });
          } else {
            setTurn('blue');
          }
        } else if (player === 'blue') {
          setBluePos({ r, c });
          playAudio('move');
          const notation = `${COLS[c]}${9 - r}`;
          setMoveHistory((prev) => [...prev, { player: 'blue', type: 'pawn', notation }]);
          setGameSnapshots((prev) => [
            ...prev,
            {
              moveIdx: prev.length,
              player: 'blue',
              type: 'pawn',
              notation,
              redPos: { ...redPos },
              bluePos: { r, c },
              walls: [...walls],
              redWalls,
              blueWalls,
            },
          ]);
          if (r === 8) {
            triggerGameEnd({
              winner: 'blue',
              reason: myColor === 'blue' ? 'You reached the goal first!' : 'Opponent reached the goal first',
              isYouWin: myColor === 'blue',
              eloDelta: myColor === 'blue' ? 12 : -11,
            });
          } else {
            setTurn('red');
          }
        }
      } else if (data.type === 'WALL') {
        const { r, c, orientation, player } = data;
        const newWall = { r, c, orientation };
        setWalls((prev) => [...prev, newWall]);
        if (player === 'red') setRedWalls((prev) => prev - 1);
        else setBlueWalls((prev) => prev - 1);
        playAudio('wall');
        const notation = `${orientation}${COLS[c]}${8 - r}`;
        setMoveHistory((prev) => [...prev, { player, type: 'wall', notation }]);
        setGameSnapshots((prev) => [
          ...prev,
          {
            moveIdx: prev.length,
            player,
            type: 'wall',
            notation,
            redPos: { ...redPos },
            bluePos: { ...bluePos },
            walls: [...walls, newWall],
            redWalls: player === 'red' ? redWalls - 1 : redWalls,
            blueWalls: player === 'blue' ? blueWalls - 1 : blueWalls,
          },
        ]);
        setTurn(player === 'red' ? 'blue' : 'red');
      } else if (data.type === 'CHAT') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages((prev) => [...prev, { sender: 'opponent', text: data.text, time: timeStr }]);
        setFloatingBubble({ sender: 'opponent', text: data.text });
        setTimeout(() => setFloatingBubble((curr) => (curr?.text === data.text ? null : curr)), 3000);
        playAudio('move');
      } else if (data.type === 'RESIGN') {
        triggerGameEnd({
          winner: myColor,
          reason: 'Opponent resigned the match',
          isYouWin: true,
          eloDelta: +12,
        });
      } else if (data.type === 'REMATCH_REQUEST') {
        setWarningMsg('Opponent requested a rematch! Restarting match...');
        multiplayerSession?.sendAction({ type: 'REMATCH_ACCEPT' });
        setTimeout(() => restartGame(), 1000);
      } else if (data.type === 'REMATCH_ACCEPT') {
        setWarningMsg('Rematch accepted! Starting fresh match...');
        setTimeout(() => restartGame(), 800);
      }
    };

    conn.on('data', handleRemoteData);
    return () => {
      conn.off?.('data', handleRemoteData);
    };
  }, [gameMode, multiplayerSession, redPos, bluePos, walls, redWalls, blueWalls, myColor]);

  // Resume AudioContext on first user interaction for iOS Safari / Chrome autoplay policy
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch (e) {}
    };

    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('click', unlockAudio, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Audio & Haptics dispatcher
  const playAudio = (type) => {
    const settings = getStoredSettings();

    // Trigger haptics alongside audio events
    if (type === 'move') hapticMove();
    else if (type === 'wall') hapticWall();
    else if (type === 'invalid') hapticError();
    else if (type === 'win') hapticVictory();
    else if (type === 'loss') hapticError();

    if (isMuted || !settings.sfxEnabled) return;

    try {
      const vol = (settings.volume ?? 80) / 100;
      const ctx = getAudioContext();
      if (!ctx) return;

      const executeSound = () => {
        if (type === 'move') playMoveSound(ctx, vol);
        else if (type === 'wall') playWallSound(ctx, vol);
        else if (type === 'invalid') playInvalidSound(ctx, vol);
        else if (type === 'win') playWinSound(ctx, vol);
        else if (type === 'loss') playLossSound(ctx, vol);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => executeSound()).catch(() => executeSound());
      } else {
        executeSound();
      }
    } catch (e) {}
  };

  // Chat sender
  const handleSendMessage = (text) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'me', text, time: timeStr };
    setChatMessages((prev) => [...prev, newMsg]);
    setFloatingBubble({ sender: 'me', text });
    setTimeout(() => setFloatingBubble((curr) => (curr?.text === text ? null : curr)), 3000);

    if (gameMode === 'ai') {
      setTimeout(() => {
        const botResponses = [
          'Well played! 🤝',
          'Good move! 🧱',
          'Thanks! 🤖',
          'Impressive strategy! 🔥',
          'Thinking... 🤔',
          'Game on! ⚡',
        ];
        const replyText = botResponses[Math.floor(Math.random() * botResponses.length)];
        const botReply = { sender: 'opponent', text: replyText, time: timeStr };
        setChatMessages((prev) => [...prev, botReply]);
        setFloatingBubble({ sender: 'opponent', text: replyText });
        setTimeout(() => setFloatingBubble((curr) => (curr?.text === replyText ? null : curr)), 3000);
        playAudio('move');
      }, 900);
    } else if (gameMode === 'multiplayer') {
      multiplayerSession?.sendAction({
        type: 'CHAT',
        text,
        sender: myColor,
      });
    }
  };

  // Outcome trigger helper with automatic LocalStorage update
  const triggerGameEnd = (result) => {
    setGameResult(result);
    const opponent =
      tournamentMatch
        ? `${tournamentMatch.opponentName} (${tournamentMatch.opponentElo})`
        : gameMode === 'ai'
        ? `StockBot [${aiDifficulty.toUpperCase()}]`
        : gameMode === 'friend'
        ? 'Friend (Room)'
        : 'kamal47 (1188)';

    const updated = recordMatchOutcome({
      isWin: result.isYouWin,
      opponent,
      eloDelta: result.eloDelta,
      movesCount: moveHistory.length + 1,
      snapshots: gameSnapshots,
      moveHistory,
    });
    setUserStats(updated);
    if (onStatsUpdate) onStatsUpdate(updated);

    // Evaluate match achievements & notify
    const durationSeconds = Math.round((Date.now() - matchStartTimeRef.current) / 1000);
    checkMatchAchievements(
      {
        isWin: result.isYouWin,
        durationSeconds,
        wallsPlacedInMatch: wallsPlacedInMatchRef.current,
        gameMode,
        aiDifficulty,
        currentStreak: updated.streak,
      },
      (achievement) => {
        setWarningMsg(`🏆 Achievement Unlocked: ${achievement.title}!`);
      }
    );

    // Track daily quests progression
    checkQuestsOnMatchEnd({
      isWin: result.isYouWin,
      wallsPlaced: wallsPlacedInMatchRef.current,
      durationSecs: durationSeconds,
    });

    // Notify tournament system if active
    if (tournamentMatch?.onMatchFinished) {
      tournamentMatch.onMatchFinished(result.isYouWin);
    }
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
  }, [turn, gameResult, gameMode, aiDifficulty]);

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

  // 🤖 SMART AI DECISION ENGINE WITH DIFFICULTY MODES
  const executeAiTurn = () => {
    if (gameResult) return;

    const redPath = getShortestPath(redPos, 0, walls);
    const bluePath = getShortestPath(bluePos, 8, walls);
    const redDist = redPath ? redPath.length - 1 : Infinity;
    const blueDist = bluePath ? bluePath.length - 1 : Infinity;

    let bestWall = null;
    let maxGain = 0;

    // Difficulty settings
    const shouldConsiderWall =
      aiDifficulty === 'hard'
        ? blueWalls > 0 && (redDist <= 4 || (blueDist > redDist && blueWalls > 1))
        : aiDifficulty === 'medium'
        ? blueWalls > 0 && (redDist <= 4 || (blueDist > redDist && blueWalls > 2))
        : blueWalls > 0 && Math.random() < 0.15;

    const wallProbability =
      aiDifficulty === 'hard'
        ? redDist <= 3 ? 0.95 : 0.70
        : aiDifficulty === 'medium'
        ? redDist <= 2 ? 0.90 : 0.40
        : 0.20;

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
      const newWalls = [...walls, bestWall];
      setWalls(newWalls);
      const newBlueWalls = blueWalls - 1;
      setBlueWalls(newBlueWalls);
      playAudio('wall');

      const notation = `${bestWall.orientation}${COLS[bestWall.c]}${8 - bestWall.r}`;
      setMoveHistory((prev) => [...prev, { player: 'blue', type: 'wall', notation }]);
      setGameSnapshots((prev) => [
        ...prev,
        {
          moveIdx: prev.length,
          player: 'blue',
          type: 'wall',
          notation,
          redPos: { ...redPos },
          bluePos: { ...bluePos },
          walls: newWalls,
          redWalls,
          blueWalls: newBlueWalls,
        },
      ]);

      if (incrementSeconds > 0) {
        setBlueTime((prev) => prev + incrementSeconds);
      }
      setTurn('red');
      return;
    }

    // Pawn Move
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
          reason: `StockBot [${aiDifficulty.toUpperCase()}] reached the goal first`,
          isYouWin: false,
          eloDelta: -10,
        });
        return;
      }

      let bestMove = validMoves[0];
      let minDistance = Infinity;

      // In Easy mode, 35% chance to make random legal step
      if (aiDifficulty === 'easy' && Math.random() < 0.35) {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      } else {
        for (const move of validMoves) {
          const dist = getShortestPathLength(move, 8, walls);
          if (dist < minDistance) {
            minDistance = dist;
            bestMove = move;
          }
        }
      }

      setBluePos(bestMove);
      playAudio('move');
      const notation = `${COLS[bestMove.c]}${9 - bestMove.r}`;
      setMoveHistory((prev) => [...prev, { player: 'blue', type: 'pawn', notation }]);
      setGameSnapshots((prev) => [
        ...prev,
        {
          moveIdx: prev.length,
          player: 'blue',
          type: 'pawn',
          notation,
          redPos: { ...redPos },
          bluePos: bestMove,
          walls: [...walls],
          redWalls,
          blueWalls,
        },
      ]);

      if (bestMove.r === 8) {
        triggerGameEnd({
          winner: 'blue',
          reason: `StockBot [${aiDifficulty.toUpperCase()}] reached the goal first`,
          isYouWin: false,
          eloDelta: -10,
        });
      } else {
        if (incrementSeconds > 0) {
          setBlueTime((prev) => prev + incrementSeconds);
        }
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
  }, [turn, gameMode, gameResult, walls, redPos, bluePos, blueWalls, aiDifficulty]);

  const handleCellClick = (r, c) => {
    // If a wall is selected, pawn moves are disabled
    if (selectedWallMode !== null) return;
    if (gameResult) return;
    if (gameMode === 'ai' && turn === 'blue') return;
    if (gameMode === 'multiplayer' && turn !== myColor) return;

    const currentPos = turn === 'red' ? redPos : bluePos;
    const otherPos = turn === 'red' ? bluePos : redPos;
    const validMoves = getValidMoves(currentPos, otherPos);

    if (validMoves.some((m) => m.r === r && m.c === c)) {
      pushUndoSnapshot();
      playAudio('move');
      const notation = `${COLS[c]}${9 - r}`;
      setMoveHistory((prev) => [...prev, { player: turn, type: 'pawn', notation }]);

      if (turn === 'red') {
        const newRed = { r, c };
        setRedPos(newRed);
        setGameSnapshots((prev) => [
          ...prev,
          {
            moveIdx: prev.length,
            player: 'red',
            type: 'pawn',
            notation,
            redPos: newRed,
            bluePos: { ...bluePos },
            walls: [...walls],
            redWalls,
            blueWalls,
          },
        ]);

        if (r === 0) {
          triggerGameEnd({
            winner: 'red',
            reason: gameMode === 'ai' ? `You defeated StockBot [${aiDifficulty.toUpperCase()}]!` : 'You reached the goal first',
            isYouWin: true,
            eloDelta: +12,
          });
        } else {
          if (incrementSeconds > 0) {
            setRedTime((prev) => prev + incrementSeconds);
          }
          setTurn('blue');
        }
      } else {
        const newBlue = { r, c };
        setBluePos(newBlue);
        setGameSnapshots((prev) => [
          ...prev,
          {
            moveIdx: prev.length,
            player: 'blue',
            type: 'pawn',
            notation,
            redPos: { ...redPos },
            bluePos: newBlue,
            walls: [...walls],
            redWalls,
            blueWalls,
          },
        ]);

        if (r === 8) {
          triggerGameEnd({
            winner: 'blue',
            reason: 'Player 2 reached the goal first',
            isYouWin: false,
            eloDelta: -11,
          });
        } else {
          if (incrementSeconds > 0) {
            setBlueTime((prev) => prev + incrementSeconds);
          }
          setTurn('red');
        }
      }

      if (gameMode === 'multiplayer') {
        multiplayerSession?.sendAction({
          type: 'MOVE',
          r,
          c,
          player: myColor,
        });
      }
    }
  };

  const handlePlaceWall = (r, c) => {
    if (gameResult) return;
    if (gameMode === 'ai' && turn === 'blue') return;
    if (gameMode === 'multiplayer' && turn !== myColor) return;

    const isRed = turn === 'red';
    const remaining = isRed ? redWalls : blueWalls;
    const activeOrientation = selectedWallMode || (isRed ? redOrientation : blueOrientation);

    if (!selectedWallMode && gameMode !== 'ai') {
      setWarningMsg('Select a wall (Horizontal or Vertical) first!');
      return;
    }

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

    pushUndoSnapshot();
    wallsPlacedInMatchRef.current += 1;
    setWalls(testWalls);
    playAudio('wall');

    const notation = `${activeOrientation}${COLS[c]}${8 - r}`;
    setMoveHistory((prev) => [...prev, { player: turn, type: 'wall', notation }]);
    setGameSnapshots((prev) => [
      ...prev,
      {
        moveIdx: prev.length,
        player: turn,
        type: 'wall',
        notation,
        redPos: { ...redPos },
        bluePos: { ...bluePos },
        walls: testWalls,
        redWalls: isRed ? redWalls - 1 : redWalls,
        blueWalls: isRed ? blueWalls : blueWalls - 1,
      },
    ]);

    if (gameMode === 'multiplayer') {
      multiplayerSession?.sendAction({
        type: 'WALL',
        r,
        c,
        orientation: activeOrientation,
        player: myColor,
      });
    }

    if (incrementSeconds > 0) {
      if (isRed) {
        setRedTime((prev) => prev + incrementSeconds);
      } else {
        setBlueTime((prev) => prev + incrementSeconds);
      }
    }

    if (isRed) {
      setRedWalls((prev) => prev - 1);
      setTurn('blue');
    } else {
      setBlueWalls((prev) => prev - 1);
      setTurn('red');
    }

    // Auto-Reset Wall Mode back to pawn move mode for next turn
    setSelectedWallMode(null);
  };

  const handleResignClick = () => {
    if (!confirmResign) {
      setConfirmResign(true);
    } else {
      if (gameMode === 'multiplayer') {
        multiplayerSession?.sendAction({
          type: 'RESIGN',
          player: myColor,
        });
      }
      triggerGameEnd({
        winner: myColor === 'red' ? 'blue' : 'red',
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

  const handleLogoClick = () => {
    if (gameResult) {
      onBack();
    } else if (window.confirm('Do you want to leave the active match and return to the home lobby?')) {
      onBack();
    }
  };

  // 🎮 DESKTOP KEYBOARD CONTROLS (Arrow keys, WASD, Space/R, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input, chat is open, or game ended
      if (isChatOpen || gameResult) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      // Turn gating
      if (gameMode === 'ai' && turn === 'blue') return;
      if (gameMode === 'multiplayer' && turn !== myColor) return;

      const key = e.key;
      const current = turn === 'red' ? redPos : bluePos;
      const other = turn === 'red' ? bluePos : redPos;
      const valid = getValidMoves(current, other);

      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        e.preventDefault();
        const move = valid.filter((m) => m.r < current.r).sort((a, b) => a.r - b.r)[0];
        if (move) handleCellClick(move.r, move.c);
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        e.preventDefault();
        const move = valid.filter((m) => m.r > current.r).sort((a, b) => b.r - a.r)[0];
        if (move) handleCellClick(move.r, move.c);
      } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        const move = valid.filter((m) => m.c < current.c).sort((a, b) => a.c - b.c)[0];
        if (move) handleCellClick(move.r, move.c);
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        const move = valid.filter((m) => m.c > current.c).sort((a, b) => b.c - a.c)[0];
        if (move) handleCellClick(move.r, move.c);
      } else if (key === ' ' || key === 'r' || key === 'R') {
        e.preventDefault();
        if (turn === 'red') {
          setRedOrientation((prev) => (prev === 'h' ? 'v' : 'h'));
        } else {
          setBlueOrientation((prev) => (prev === 'h' ? 'v' : 'h'));
        }
        playAudio('move');
      } else if (key === 'Escape') {
        e.preventDefault();
        handleBackClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isChatOpen,
    gameResult,
    gameMode,
    turn,
    myColor,
    redPos,
    bluePos,
    walls,
    redWalls,
    blueWalls,
    confirmBack,
  ]);

  const restartGame = () => {
    const freshSeconds = (gameMinutes || 3) * 60;
    matchStartTimeRef.current = Date.now();
    wallsPlacedInMatchRef.current = 0;
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
    setUndoStack([]);
    setGameSnapshots([
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
    ]);
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
      {/* ───────────────── TOP BAR (Header & Opponent Deck) ───────────────── */}
      <div className="flex flex-col gap-1.5">
        {/* Navigation & Quick Controls Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackClick}
              className={`p-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                confirmBack
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse px-2.5'
                  : 'bg-cardDark/80 hover:bg-borderDark border-borderDark/60 text-gray-400 hover:text-white'
              }`}
              title="Return to lobby"
            >
              <ArrowLeft size={16} />
              {confirmBack && <span>Leave?</span>}
            </button>
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-1.5 cursor-pointer group select-none"
              title="Return to Home Lobby"
            >
              <span className="text-base font-black text-brandOrange tracking-wide group-hover:brightness-110 transition">
                Barricade
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* In-Game Chat Toggle */}
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="p-1.5 rounded-xl border text-xs font-semibold bg-cardDark/80 text-gray-300 hover:text-white border-borderDark/60 hover:bg-borderDark transition cursor-pointer relative"
              title="Open Chat"
            >
              <MessageSquare size={16} />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brandOrange" />
              )}
            </button>

            {/* Undo Button (For Local & AI Practice) */}
            {(gameMode === 'local' || gameMode === 'ai') && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0 || isAiThinking || !!gameResult}
                className="p-1.5 rounded-xl border text-xs font-semibold bg-cardDark/80 border-borderDark/60 text-gray-300 hover:text-white hover:bg-borderDark transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                title="Undo Move"
              >
                <Undo2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Opponent Profile & Timer Deck Card */}
        <div
          className={`p-2.5 rounded-2xl border transition-all duration-200 ${
            turn === 'blue'
              ? 'bg-blue-950/30 border-blue-500/70 shadow-lg shadow-blue-950/40'
              : 'bg-cardDark/90 border-borderDark/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* Opponent Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {gameMode === 'ai' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-500/20">
                    <Bot size={16} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-200 truncate">StockBot</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            aiDifficulty === 'easy'
                              ? 'medium'
                              : aiDifficulty === 'medium'
                              ? 'hard'
                              : 'easy';
                          setAiDifficulty(next);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border uppercase transition cursor-pointer shrink-0 ${
                          aiDifficulty === 'easy'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : aiDifficulty === 'medium'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                            : 'bg-rose-950 text-rose-300 border-rose-700'
                        }`}
                        title="Toggle difficulty (Easy / Med / Hard)"
                      >
                        {aiDifficulty}
                      </button>
                    </div>
                    {isAiThinking ? (
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-blue-400 font-semibold block">🧱 {blueWalls}/10</span>
                    )}
                  </div>
                </>
              ) : gameMode === 'multiplayer' ? (
                <>
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 ${
                      myColor === 'red' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-rose-500 shadow-rose-500/50'
                    } shadow-md animate-pulse`}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-200 truncate">
                        {opponentName || (myColor === 'red' ? 'Friend (Blue)' : 'Host (Red)')}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 border border-green-500/40 uppercase shrink-0">
                        Live
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-semibold block">
                      🧱 {myColor === 'red' ? blueWalls : redWalls}/10
                    </span>
                  </div>
                </>
              ) : tournamentMatch ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md shadow-amber-500/50 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-200 truncate">{tournamentMatch.opponentName}</span>
                      <span className="text-[10px] font-mono font-bold text-brandOrange shrink-0">{tournamentMatch.opponentElo}</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-semibold block">🧱 {blueWalls}/10</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-xs font-bold text-gray-200 truncate block">
                      {gameMode === 'local' ? 'Player 2 (Blue)' : 'kamal47 (1188) 🇮🇳'}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold block">🧱 {blueWalls}/10</span>
                  </div>
                </>
              )}
            </div>

            {/* Timer */}
            <div
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shrink-0 transition-all ${
                turn === 'blue'
                  ? 'bg-blue-600 text-white animate-pulse shadow-md shadow-blue-600/30'
                  : 'bg-bgDark text-gray-400'
              }`}
            >
              {formatClock(blueTime)}
            </div>
          </div>

          {/* Local Mode Player 2 Wall Controls */}
          {gameMode === 'local' && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-borderDark/40">
              <button
                type="button"
                onClick={() => {
                  if (turn !== 'blue') return;
                  setSelectedWallMode((prev) => (prev === 'h' ? null : 'h'));
                }}
                disabled={turn !== 'blue' || blueWalls <= 0}
                className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                  selectedWallMode === 'h' && turn === 'blue'
                    ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                    : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
                } ${turn !== 'blue' || blueWalls <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Shield size={12} />
                <span>Horizontal Wall {selectedWallMode === 'h' && turn === 'blue' ? '(Active)' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (turn !== 'blue') return;
                  setSelectedWallMode((prev) => (prev === 'v' ? null : 'v'));
                }}
                disabled={turn !== 'blue' || blueWalls <= 0}
                className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                  selectedWallMode === 'v' && turn === 'blue'
                    ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                    : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
                } ${turn !== 'blue' || blueWalls <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Shield className="rotate-90" size={12} />
                <span>Vertical Wall {selectedWallMode === 'v' && turn === 'blue' ? '(Active)' : ''}</span>
              </button>
            </div>
          )}
        </div>
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

      {/* Multiplayer Live Turn Status Ribbon */}
      {gameMode === 'multiplayer' && !gameResult && (
        <div
          className={`text-center py-1.5 px-3 rounded-xl text-xs font-bold my-1 transition-all ${
            turn === myColor
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm animate-pulse'
              : 'bg-cardDark/90 text-gray-400 border border-borderDark/60'
          }`}
        >
          {turn === myColor
            ? t('your_turn', lang)
            : t('waiting_opponent', lang)}
        </div>
      )}

      {/* Warning Notification */}
      {warningMsg && (
        <div className="text-center text-xs font-semibold text-rose-300 bg-rose-950/90 border border-rose-700/80 py-1.5 px-3 rounded-xl my-1 animate-bounce shadow-md">
          {warningMsg}
        </div>
      )}

      {/* ───────────────── 9x9 BOARD (THEMED) ───────────────── */}
      <div
        style={{ backgroundColor: activeTheme.boardBg }}
        className="relative p-3 rounded-2xl border border-borderDark/80 my-auto shadow-2xl overflow-hidden aspect-square flex items-center justify-center transition-colors duration-300"
      >
        <div className="grid grid-cols-9 grid-rows-9 gap-1.5 sm:gap-2 w-full h-full">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const isRed = redPos.r === r && redPos.c === c;
              const isBlue = bluePos.r === r && bluePos.c === c;
              const isValid = validMoves.some((m) => m.r === r && m.c === c);
              const isAiTurn = gameMode === 'ai' && turn === 'blue';
              const isMyTurn = gameMode !== 'multiplayer' || turn === myColor;
              const isPawnMoveMode = selectedWallMode === null;
              const isCellInteractive = isMyTurn && !isAiTurn && !gameResult && isPawnMoveMode;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{ backgroundColor: activeTheme.cellBg }}
                  className={`relative flex items-center justify-center rounded-lg transition-all aspect-square touch-manipulation ${
                    !isCellInteractive ? 'cursor-default' : 'cursor-pointer hover:brightness-110'
                  } ${
                    isValid && isCellInteractive
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black/50 shadow-sm'
                      : ''
                  }`}
                >
                  {isRed && (
                    <div className={`w-6 h-6 rounded-full border-2 shadow-lg ${getPawnCosmeticStyle('red')}`} />
                  )}
                  {isBlue && (
                    <div className={`w-6 h-6 rounded-full border-2 shadow-lg ${getPawnCosmeticStyle('blue')}`} />
                  )}
                  {isValid && !isRed && !isBlue && isCellInteractive && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Barricades (Themed Gradients) */}
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
                  className={`absolute rounded-full shadow-lg z-20 ${getWallCosmeticStyle('h')}`}
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
                  className={`absolute rounded-full shadow-lg z-20 ${getWallCosmeticStyle('v')}`}
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
              const isMyTurn = gameMode !== 'multiplayer' || turn === myColor;
              const isSensorActive = isMyTurn && !isAiTurn && !gameResult && selectedWallMode !== null;

              return (
                <div
                  key={`sensor-${r}-${c}`}
                  onClick={() => handlePlaceWall(r, c)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full z-30 transition-all touch-manipulation group flex items-center justify-center ${
                    !isSensorActive
                      ? 'pointer-events-none'
                      : 'pointer-events-auto cursor-pointer hover:bg-amber-400/30 active:bg-amber-400/50 active:scale-95'
                  }`}
                >
                  {isSensorActive && (
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 group-hover:bg-amber-400 transition-all ring-2 ring-amber-400/60 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────── BOTTOM BAR (You) ───────────────── */}
      <div
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 ${
          turn === myColor
            ? myColor === 'blue'
              ? 'bg-blue-950/30 border-blue-500/70 shadow-lg shadow-blue-950/40'
              : 'bg-rose-950/30 border-rose-500/70 shadow-lg shadow-rose-950/40'
            : 'bg-cardDark/80 border-borderDark/40'
        }`}
      >
        {/* Wall Selection Toggles + 3-Dot Menu Row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Horizontal Wall Toggle */}
          <button
            type="button"
            onClick={() => {
              if (turn !== myColor && gameMode !== 'local') return;
              const remaining = myColor === 'blue' ? blueWalls : redWalls;
              if (remaining <= 0) {
                setWarningMsg('No barricades remaining!');
                return;
              }
              setSelectedWallMode((prev) => (prev === 'h' ? null : 'h'));
            }}
            disabled={(turn !== myColor && gameMode !== 'local') || (myColor === 'blue' ? blueWalls <= 0 : redWalls <= 0)}
            className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              selectedWallMode === 'h'
                ? 'bg-amber-500 text-black border-amber-400 ring-2 ring-amber-400/60 shadow-md font-black scale-[1.02]'
                : 'bg-bgDark/70 border-borderDark/70 text-gray-300 hover:text-white hover:bg-borderDark/60'
            } ${(turn !== myColor && gameMode !== 'local') || (myColor === 'blue' ? blueWalls <= 0 : redWalls <= 0) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title="Toggle Horizontal Wall mode"
          >
            <Shield size={13} className={selectedWallMode === 'h' ? 'text-black' : 'text-amber-400'} />
            <span className="truncate">Horizontal {selectedWallMode === 'h' ? '✓' : ''}</span>
          </button>

          {/* Vertical Wall Toggle */}
          <button
            type="button"
            onClick={() => {
              if (turn !== myColor && gameMode !== 'local') return;
              const remaining = myColor === 'blue' ? blueWalls : redWalls;
              if (remaining <= 0) {
                setWarningMsg('No barricades remaining!');
                return;
              }
              setSelectedWallMode((prev) => (prev === 'v' ? null : 'v'));
            }}
            disabled={(turn !== myColor && gameMode !== 'local') || (myColor === 'blue' ? blueWalls <= 0 : redWalls <= 0)}
            className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
              selectedWallMode === 'v'
                ? 'bg-amber-500 text-black border-amber-400 ring-2 ring-amber-400/60 shadow-md font-black scale-[1.02]'
                : 'bg-bgDark/70 border-borderDark/70 text-gray-300 hover:text-white hover:bg-borderDark/60'
            } ${(turn !== myColor && gameMode !== 'local') || (myColor === 'blue' ? blueWalls <= 0 : redWalls <= 0) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title="Toggle Vertical Wall mode"
          >
            <Shield className={`rotate-90 ${selectedWallMode === 'v' ? 'text-black' : 'text-amber-400'}`} size={13} />
            <span className="truncate">Vertical {selectedWallMode === 'v' ? '✓' : ''}</span>
          </button>

          {/* 3-Dot More / Actions Menu Button */}
          <button
            type="button"
            onClick={() => setShowActionMenu(true)}
            className="p-2 sm:p-2.5 rounded-xl border border-borderDark/70 bg-bgDark/70 hover:bg-borderDark text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
            title="Match Actions & Settings"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Player Profile & Clock Row */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                myColor === 'blue' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-rose-500 shadow-rose-500/50'
              } shadow-md`}
            />
            <span className="text-xs sm:text-sm font-bold text-gray-200 truncate">
              {userStats.username || 'You'} ({myColor === 'blue' ? 'Blue' : 'Red'})
            </span>
            <span
              className={`text-[11px] font-semibold shrink-0 ${
                myColor === 'blue' ? 'text-blue-400' : 'text-rose-400'
              }`}
            >
              🧱 {myColor === 'blue' ? blueWalls : redWalls}/10
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition-all ${
              turn === myColor
                ? myColor === 'blue'
                  ? 'bg-blue-600 text-white animate-pulse shadow-md shadow-blue-600/30'
                  : 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                : 'bg-bgDark text-gray-400'
            }`}
          >
            {formatClock(myColor === 'blue' ? blueTime : redTime)}
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
              onClick={() => {
                if (gameMode === 'multiplayer') {
                  multiplayerSession?.sendAction({ type: 'REMATCH_REQUEST' });
                  setWarningMsg('Rematch request sent! Waiting for opponent...');
                } else {
                  restartGame();
                }
              }}
              className="w-full bg-[#22c55e] hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-green-500/20 cursor-pointer mb-3"
            >
              {gameMode === 'multiplayer'
                ? 'Request Rematch'
                : gameResult.isYouWin
                ? 'Rematch'
                : gameMode === 'ai'
                ? 'Play Again'
                : 'New ranked game'}
            </button>

            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <button
                type="button"
                onClick={() => {
                  if (onAnalyze) {
                    onAnalyze({
                      opponent:
                        gameMode === 'ai'
                          ? `StockBot [${aiDifficulty.toUpperCase()}]`
                          : gameMode === 'friend'
                          ? 'Friend (Room)'
                          : 'kamal47 (1188)',
                      result: gameResult.isYouWin ? 'win' : 'loss',
                      eloChange: gameResult.eloDelta >= 0 ? `+${gameResult.eloDelta}` : `${gameResult.eloDelta}`,
                      date: 'Just now',
                      movesCount: moveHistory.length,
                      snapshots: gameSnapshots,
                      moveHistory,
                    });
                  }
                }}
                className="bg-brandOrange hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
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
            ? `StockBot [${aiDifficulty.toUpperCase()}]`
            : gameMode === 'friend'
            ? 'Friend'
            : 'kamal47'
        }
        onSendMessage={handleSendMessage}
        messages={chatMessages}
      />

      {/* ───────────────── 3-DOT ACTION MENU BOTTOM SHEET ───────────────── */}
      {showActionMenu && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-3 animate-in fade-in duration-150"
          onClick={() => setShowActionMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1c1c1e] border border-borderDark/80 rounded-3xl p-4 shadow-2xl flex flex-col gap-2 select-none animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-borderDark/50 px-1">
              <h3 className="text-sm font-bold text-gray-200">Match Menu</h3>
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 py-1">
              {/* Sound / Volume Toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="flex items-center justify-between p-3 rounded-2xl bg-cardDark/60 hover:bg-borderDark/60 border border-borderDark/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-green-500/20 text-green-400'}`}>
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-200">{isMuted ? 'Sound Muted' : 'Sound On'}</div>
                    <div className="text-[10px] text-gray-400">Toggle in-game audio effects</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isMuted ? 'bg-rose-950 text-rose-300' : 'bg-green-950 text-green-300'}`}>
                  {isMuted ? 'MUTED' : 'ACTIVE'}
                </span>
              </button>

              {/* Haptics & Settings Drawer */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  onOpenSettings?.();
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-cardDark/60 hover:bg-borderDark/60 border border-borderDark/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-brandOrange">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-200">Settings & Haptics</div>
                    <div className="text-[10px] text-gray-400">Volume slider & vibration options</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </button>

              {/* Help & Rules */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  setShowRulesModal(true);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-cardDark/60 hover:bg-borderDark/60 border border-borderDark/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-200">How to Play & Rules</div>
                    <div className="text-[10px] text-gray-400">Pawn moves and barricade guidelines</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </button>

              {/* Resign Match */}
              <button
                type="button"
                onClick={() => {
                  handleResignClick();
                  if (confirmResign) setShowActionMenu(false);
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer text-left ${
                  confirmResign
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                    : 'bg-cardDark/60 hover:bg-rose-950/30 border-borderDark/40 hover:border-rose-800/60 text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <Flag size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-400">
                      {confirmResign ? 'Confirm Resign?' : 'Resign Match'}
                    </div>
                    <div className="text-[10px] text-gray-400">Concede and forfeit this match</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-400">
                  {confirmResign ? 'Tap to Confirm' : 'Resign'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowActionMenu(false)}
              className="w-full py-2.5 rounded-xl bg-cardDark hover:bg-borderDark border border-borderDark text-gray-400 hover:text-white text-xs font-semibold transition cursor-pointer mt-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Interactive Rules Modal */}
      <HowToPlayModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}