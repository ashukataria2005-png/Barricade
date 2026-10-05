// ───────────────── ACHIEVEMENTS & TROPHY ENGINE ─────────────────

const ACHIEVEMENTS_KEY = 'barricade_achievements';
const STATS_COUNTER_KEY = 'barricade_achievements_stats';

export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Win your first ranked match',
    icon: '🏆',
    category: 'combat',
    points: 50,
  },
  {
    id: 'the_great_architect',
    title: 'The Great Architect',
    description: 'Place 20 barricades across matches',
    icon: '🧱',
    category: 'tactics',
    points: 100,
    target: 20,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Win a match in under 2 minutes',
    icon: '⚡',
    category: 'speed',
    points: 75,
  },
  {
    id: 'koth_champion',
    title: 'Crown Conqueror',
    description: 'Win a King of the Hill 4-player match',
    icon: '👑',
    category: 'special',
    points: 150,
  },
  {
    id: 'tactical_mind',
    title: 'Tactical Mind',
    description: 'Solve all 3 daily puzzles',
    icon: '🧩',
    category: 'puzzles',
    points: 100,
  },
  {
    id: 'on_fire',
    title: 'On Fire',
    description: 'Reach a 3-game win streak',
    icon: '🔥',
    category: 'streak',
    points: 120,
    target: 3,
  },
  {
    id: 'grandmaster_mind',
    title: 'Grandmaster Mind',
    description: 'Defeat StockBot on Hard difficulty',
    icon: '🤖',
    category: 'ai',
    points: 100,
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Challenge a friend or send a direct message',
    icon: '💬',
    category: 'social',
    points: 50,
  },
];

export const getAchievementsState = () => {
  if (typeof window === 'undefined') {
    return { unlocked: {}, stats: { totalWalls: 0, puzzleCount: 0 } };
  }
  try {
    const rawUnlocked = localStorage.getItem(ACHIEVEMENTS_KEY);
    const rawStats = localStorage.getItem(STATS_COUNTER_KEY);
    const unlocked = rawUnlocked ? JSON.parse(rawUnlocked) : {};
    const stats = rawStats ? JSON.parse(rawStats) : { totalWalls: 0, puzzleCount: 0 };
    return { unlocked, stats };
  } catch (e) {
    return { unlocked: {}, stats: { totalWalls: 0, puzzleCount: 0 } };
  }
};

export const getAchievementsList = () => {
  const { unlocked, stats } = getAchievementsState();
  return INITIAL_ACHIEVEMENTS.map((item) => {
    const isUnlocked = !!unlocked[item.id];
    let progress = isUnlocked ? item.target || 1 : 0;

    if (!isUnlocked) {
      if (item.id === 'the_great_architect') {
        progress = Math.min(item.target, stats.totalWalls || 0);
      } else if (item.id === 'on_fire') {
        progress = Math.min(item.target, stats.streak || 0);
      } else if (item.id === 'tactical_mind') {
        progress = Math.min(3, stats.puzzleCount || 0);
      }
    }

    return {
      ...item,
      unlocked: isUnlocked,
      unlockedAt: unlocked[item.id]?.unlockedAt || null,
      progress,
    };
  });
};

export const unlockAchievement = (id, notifyCallback) => {
  if (typeof window === 'undefined') return false;
  try {
    const { unlocked, stats } = getAchievementsState();
    if (unlocked[id]) return false; // Already unlocked

    const achievement = INITIAL_ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return false;

    unlocked[id] = {
      unlockedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));

    if (notifyCallback) {
      notifyCallback(achievement);
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const updateAchievementStats = (statUpdates, notifyCallback) => {
  if (typeof window === 'undefined') return;
  try {
    const { unlocked, stats } = getAchievementsState();
    const newStats = { ...stats, ...statUpdates };
    localStorage.setItem(STATS_COUNTER_KEY, JSON.stringify(newStats));

    // Check Architect
    if (newStats.totalWalls >= 20 && !unlocked['the_great_architect']) {
      unlockAchievement('the_great_architect', notifyCallback);
    }

    // Check On Fire
    if (newStats.streak >= 3 && !unlocked['on_fire']) {
      unlockAchievement('on_fire', notifyCallback);
    }

    // Check Tactical Mind
    if (newStats.puzzleCount >= 3 && !unlocked['tactical_mind']) {
      unlockAchievement('tactical_mind', notifyCallback);
    }
  } catch (e) {}
};

export const checkMatchAchievements = ({
  isWin,
  durationSeconds,
  wallsPlacedInMatch,
  gameMode,
  aiDifficulty,
  currentStreak,
}, notifyCallback) => {
  const { unlocked, stats } = getAchievementsState();
  const currentTotalWalls = (stats.totalWalls || 0) + (wallsPlacedInMatch || 0);

  updateAchievementStats({
    totalWalls: currentTotalWalls,
    streak: isWin ? (currentStreak || 1) : 0,
  }, notifyCallback);

  if (isWin) {
    // First Blood
    if (!unlocked['first_blood']) {
      unlockAchievement('first_blood', notifyCallback);
    }

    // Speed Demon (< 120 seconds)
    if (durationSeconds > 0 && durationSeconds < 120 && !unlocked['speed_demon']) {
      unlockAchievement('speed_demon', notifyCallback);
    }

    // Grandmaster AI
    if (gameMode === 'ai' && aiDifficulty === 'hard' && !unlocked['grandmaster_mind']) {
      unlockAchievement('grandmaster_mind', notifyCallback);
    }

    // King of the Hill
    if (gameMode === 'koth' && !unlocked['koth_champion']) {
      unlockAchievement('koth_champion', notifyCallback);
    }
  }
};
