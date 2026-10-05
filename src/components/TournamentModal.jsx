import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Swords,
  Crown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Users,
  Play
} from 'lucide-react';
import { addXPAndGems } from '../utils/stats';

const TOURNAMENT_KEY = 'barricade_tournament_state';

const BOT_ROSTER = [
  { id: 'bot_kamal', name: 'kamal47', elo: 1188, avatar: 'bg-emerald-500' },
  { id: 'bot_alpha', name: 'AlphaGamer', elo: 1450, avatar: 'bg-purple-500' },
  { id: 'bot_vortex', name: 'VortexAI', elo: 1340, avatar: 'bg-cyan-500' },
  { id: 'bot_shadow', name: 'ShadowRider', elo: 1620, avatar: 'bg-zinc-700' },
  { id: 'bot_mike', name: 'MikeJordan', elo: 2259, avatar: 'bg-blue-600' },
  { id: 'bot_dog', name: 'The_dog', elo: 2301, avatar: 'bg-rose-600' },
  { id: 'bot_stock', name: 'StockBot', elo: 1100, avatar: 'bg-amber-600' },
];

export const createInitialTournament = (userStats) => {
  const userName = userStats?.username || 'AshuKataria';
  const userElo = userStats?.elo || 1092;

  const player = { id: 'player', name: userName, elo: userElo, isUser: true, avatar: 'bg-amber-500' };

  // Quarterfinals (4 matches)
  const qf = [
    { id: 'qf1', p1: player, p2: BOT_ROSTER[0], winner: null },
    { id: 'qf2', p1: BOT_ROSTER[1], p2: BOT_ROSTER[2], winner: null },
    { id: 'qf3', p1: BOT_ROSTER[3], p2: BOT_ROSTER[6], winner: null },
    { id: 'qf4', p1: BOT_ROSTER[4], p2: BOT_ROSTER[5], winner: null },
  ];

  // Semifinals (2 matches)
  const sf = [
    { id: 'sf1', p1: null, p2: null, winner: null },
    { id: 'sf2', p1: null, p2: null, winner: null },
  ];

  // Finals (1 match)
  const f = { id: 'final', p1: null, p2: null, winner: null };

  return {
    stage: 'quarterfinals', // 'quarterfinals' | 'semifinals' | 'finals' | 'champion' | 'eliminated'
    currentMatchIndex: 0,
    quarterfinals: qf,
    semifinals: sf,
    finals: f,
    champion: null,
    userEliminatedRound: null,
  };
};

export const getStoredTournament = (userStats) => {
  if (typeof window === 'undefined') return createInitialTournament(userStats);
  try {
    const raw = localStorage.getItem(TOURNAMENT_KEY);
    if (!raw) {
      const init = createInitialTournament(userStats);
      localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    return createInitialTournament(userStats);
  }
};

export const saveStoredTournament = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(data));
  } catch (e) {}
};

export default function TournamentModal({
  isOpen,
  onClose,
  userStats,
  onStartTournamentMatch,
  onStatsUpdate,
}) {
  const [tournament, setTournament] = useState(() => getStoredTournament(userStats));

  useEffect(() => {
    saveStoredTournament(tournament);
  }, [tournament]);

  if (!isOpen) return null;

  const handleResetTournament = () => {
    const fresh = createInitialTournament(userStats);
    setTournament(fresh);
    saveStoredTournament(fresh);
  };

  // Helper to get opponent for user's current round
  const getCurrentOpponent = () => {
    if (tournament.stage === 'quarterfinals') {
      return tournament.quarterfinals[0].p2;
    }
    if (tournament.stage === 'semifinals') {
      return tournament.semifinals[0]?.p2;
    }
    if (tournament.stage === 'finals') {
      return tournament.finals?.p2;
    }
    return null;
  };

  const handlePlayCurrentRound = () => {
    const opp = getCurrentOpponent();
    if (!opp || !onStartTournamentMatch) return;

    onClose();
    onStartTournamentMatch({
      opponentName: opp.name,
      opponentElo: opp.elo,
      roundName:
        tournament.stage === 'quarterfinals'
          ? 'Quarterfinal'
          : tournament.stage === 'semifinals'
          ? 'Semifinal'
          : 'Championship Final',
      onMatchFinished: (userWon) => {
        advanceTournamentRound(userWon);
      },
    });
  };

  const advanceTournamentRound = (userWon) => {
    const t = { ...tournament };

    if (!userWon) {
      t.stage = 'eliminated';
      t.userEliminatedRound = t.stage;
      setTournament(t);
      saveStoredTournament(t);
      return;
    }

    if (t.stage === 'quarterfinals') {
      // User won QF1
      t.quarterfinals[0].winner = t.quarterfinals[0].p1;
      // Simulate other QFs
      t.quarterfinals[1].winner = Math.random() > 0.5 ? t.quarterfinals[1].p1 : t.quarterfinals[1].p2;
      t.quarterfinals[2].winner = Math.random() > 0.5 ? t.quarterfinals[2].p1 : t.quarterfinals[2].p2;
      t.quarterfinals[3].winner = Math.random() > 0.5 ? t.quarterfinals[3].p1 : t.quarterfinals[3].p2;

      // Setup SF
      t.semifinals[0] = {
        id: 'sf1',
        p1: t.quarterfinals[0].winner,
        p2: t.quarterfinals[1].winner,
        winner: null,
      };
      t.semifinals[1] = {
        id: 'sf2',
        p1: t.quarterfinals[2].winner,
        p2: t.quarterfinals[3].winner,
        winner: null,
      };
      t.stage = 'semifinals';
      // Reward
      const { updated } = addXPAndGems(75, 10);
      if (onStatsUpdate) onStatsUpdate(updated);
    } else if (t.stage === 'semifinals') {
      // User won SF1
      t.semifinals[0].winner = t.semifinals[0].p1;
      // Simulate SF2
      t.semifinals[1].winner = Math.random() > 0.5 ? t.semifinals[1].p1 : t.semifinals[1].p2;

      // Setup Finals
      t.finals = {
        id: 'final',
        p1: t.semifinals[0].winner,
        p2: t.semifinals[1].winner,
        winner: null,
      };
      t.stage = 'finals';
      const { updated } = addXPAndGems(150, 20);
      if (onStatsUpdate) onStatsUpdate(updated);
    } else if (t.stage === 'finals') {
      // User won Finals!
      t.finals.winner = t.finals.p1;
      t.champion = t.finals.p1;
      t.stage = 'champion';
      const { updated } = addXPAndGems(300, 50);
      if (onStatsUpdate) onStatsUpdate(updated);
    }

    setTournament(t);
    saveStoredTournament(t);
  };

  const nextOpponent = getCurrentOpponent();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl relative max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="text-brandOrange" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Knockout Tournament</h3>
              <p className="text-[11px] text-gray-400">8 Players · Single Elimination</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetTournament}
              className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
              title="Reset Tournament"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stage Status Card */}
        {tournament.stage === 'champion' ? (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-lg animate-in zoom-in-95">
            <Crown size={32} className="text-yellow-400 mx-auto mb-1 animate-bounce" />
            <h4 className="text-base font-black text-amber-300">Grand Champion! 🏆</h4>
            <p className="text-xs text-gray-200 mt-0.5">
              You conquered all 3 rounds and won the Barricade Cup (+300 XP, +50 Gems)!
            </p>
            <button
              onClick={handleResetTournament}
              className="mt-3 bg-brandOrange hover:bg-amber-600 text-black font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
            >
              Play Another Tournament
            </button>
          </div>
        ) : tournament.stage === 'eliminated' ? (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-center">
            <h4 className="text-sm font-bold text-rose-300">Eliminated from Tournament</h4>
            <p className="text-xs text-gray-400 mt-1">
              Defeated in the bracket. Better luck next time!
            </p>
            <button
              onClick={handleResetTournament}
              className="mt-3 bg-cardDark border border-borderDark hover:bg-borderDark text-gray-200 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-bgDark/80 border border-borderDark rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-[10px] uppercase font-bold text-brandOrange tracking-wider">
                {tournament.stage === 'quarterfinals'
                  ? 'Round 1 / 3'
                  : tournament.stage === 'semifinals'
                  ? 'Round 2 / 3'
                  : 'Championship Round'}
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 capitalize">
                {tournament.stage} Match
              </h4>
              <p className="text-[10px] text-gray-400">
                Opponent: <span className="text-gray-200 font-bold">{nextOpponent?.name}</span> ({nextOpponent?.elo})
              </p>
            </div>

            <button
              onClick={handlePlayCurrentRound}
              className="bg-brandOrange hover:bg-amber-600 active:scale-95 text-black font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Play size={13} className="fill-black" />
              <span>Play Round</span>
            </button>
          </div>
        )}

        {/* Visual Bracket Diagram */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px] pr-0.5">
          <div className="text-[11px] font-bold text-gray-400 flex items-center justify-between px-1">
            <span>Quarterfinals</span>
            <span>Semifinals</span>
            <span>Finals</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Quarterfinals Column */}
            <div className="flex flex-col gap-2">
              {tournament.quarterfinals.map((m, i) => (
                <div
                  key={m.id}
                  className={`bg-bgDark/70 border rounded-xl p-1.5 flex flex-col gap-1 transition ${
                    i === 0 && tournament.stage === 'quarterfinals'
                      ? 'border-brandOrange shadow-sm ring-1 ring-brandOrange/40'
                      : 'border-borderDark/60'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                      m.winner?.id === m.p1?.id ? 'bg-green-500/20 text-green-300 font-bold' : 'text-gray-300'
                    }`}
                  >
                    <span className="truncate">{m.p1?.name}</span>
                    <span className="text-[9px] font-mono text-gray-500">{m.p1?.elo}</span>
                  </div>
                  <div
                    className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                      m.winner?.id === m.p2?.id ? 'bg-green-500/20 text-green-300 font-bold' : 'text-gray-400'
                    }`}
                  >
                    <span className="truncate">{m.p2?.name}</span>
                    <span className="text-[9px] font-mono text-gray-500">{m.p2?.elo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Semifinals Column */}
            <div className="flex flex-col justify-around gap-4">
              {tournament.semifinals.map((m, i) => (
                <div
                  key={m.id}
                  className={`bg-bgDark/70 border rounded-xl p-1.5 flex flex-col gap-1 transition ${
                    i === 0 && tournament.stage === 'semifinals'
                      ? 'border-brandOrange shadow-sm ring-1 ring-brandOrange/40'
                      : 'border-borderDark/60'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                      m.winner?.id === m.p1?.id && m.p1 ? 'bg-green-500/20 text-green-300 font-bold' : 'text-gray-300'
                    }`}
                  >
                    <span className="truncate">{m.p1 ? m.p1.name : 'TBD'}</span>
                    {m.p1 && <span className="text-[9px] font-mono text-gray-500">{m.p1.elo}</span>}
                  </div>
                  <div
                    className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                      m.winner?.id === m.p2?.id && m.p2 ? 'bg-green-500/20 text-green-300 font-bold' : 'text-gray-400'
                    }`}
                  >
                    <span className="truncate">{m.p2 ? m.p2.name : 'TBD'}</span>
                    {m.p2 && <span className="text-[9px] font-mono text-gray-500">{m.p2.elo}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Finals Column */}
            <div className="flex flex-col justify-center">
              <div
                className={`bg-bgDark/70 border rounded-xl p-2 flex flex-col gap-1.5 transition ${
                  tournament.stage === 'finals'
                    ? 'border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'border-borderDark/60'
                }`}
              >
                <div className="text-[9px] font-bold text-center text-amber-400 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
                  <Crown size={11} />
                  <span>Final</span>
                </div>
                <div
                  className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                    tournament.finals.winner?.id === tournament.finals.p1?.id && tournament.finals.p1
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="truncate">{tournament.finals.p1 ? tournament.finals.p1.name : 'TBD'}</span>
                  {tournament.finals.p1 && <span className="text-[9px] font-mono text-gray-500">{tournament.finals.p1.elo}</span>}
                </div>
                <div
                  className={`flex items-center justify-between px-1 py-0.5 rounded text-[10px] ${
                    tournament.finals.winner?.id === tournament.finals.p2?.id && tournament.finals.p2
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  <span className="truncate">{tournament.finals.p2 ? tournament.finals.p2.name : 'TBD'}</span>
                  {tournament.finals.p2 && <span className="text-[9px] font-mono text-gray-500">{tournament.finals.p2.elo}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer mt-1"
        >
          Close Bracket
        </button>
      </div>
    </div>
  );
}
