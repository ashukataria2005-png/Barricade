const STATS_KEY = 'barricade_user_stats';

export const DEFAULT_STATS = {
  username: 'AshuKataria',
  elo: 1092,
  puzzleRating: 1200,
  games: 34,
  wins: 18,
  losses: 16,
  streak: 1,
  history: [
    { opponent: 'kamal47 (1188)', result: 'win', eloChange: '+12', date: 'Oct 4, 2026', movesCount: 14 },
    { opponent: 'The_dog (2301)', result: 'loss', eloChange: '-11', date: 'Oct 4, 2026', movesCount: 22 },
    { opponent: 'MikeJordan (2259)', result: 'loss', eloChange: '-9', date: 'Oct 3, 2026', movesCount: 18 },
    { opponent: 'StockBot (AI)', result: 'win', eloChange: '+12', date: 'Oct 3, 2026', movesCount: 16 },
  ],
};

export const getStoredStats = () => {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
      return DEFAULT_STATS;
    }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_STATS;
  }
};

export const saveStoredStats = (stats) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
};

export const recordMatchOutcome = ({ isWin, opponent = 'kamal47', eloDelta = 12, movesCount = 10 }) => {
  const current = getStoredStats();
  const newElo = Math.max(100, current.elo + eloDelta);
  const newWins = isWin ? current.wins + 1 : current.wins;
  const newLosses = !isWin ? current.losses + 1 : current.losses;
  const newStreak = isWin ? current.streak + 1 : 0;
  const newGames = current.games + 1;

  const historyItem = {
    opponent,
    result: isWin ? 'win' : 'loss',
    eloChange: eloDelta >= 0 ? `+${eloDelta}` : `${eloDelta}`,
    date: 'Just now',
    movesCount,
  };

  const updated = {
    ...current,
    elo: newElo,
    games: newGames,
    wins: newWins,
    losses: newLosses,
    streak: newStreak,
    history: [historyItem, ...(current.history || []).slice(0, 19)],
  };

  saveStoredStats(updated);
  return updated;
};

export const recordPuzzleSolved = (ratingGain = 15) => {
  const current = getStoredStats();
  const updated = {
    ...current,
    puzzleRating: (current.puzzleRating || 1200) + ratingGain,
  };
  saveStoredStats(updated);
  return updated;
};
