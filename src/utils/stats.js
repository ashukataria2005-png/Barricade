const STATS_KEY = 'barricade_user_stats';
const QUESTS_KEY = 'barricade_quests';

export const AVATAR_PRESETS = [
  { id: 'warrior', label: 'Warrior', icon: '⚔️', bg: 'bg-amber-500' },
  { id: 'cyber', label: 'Cyber', icon: '⚡', bg: 'bg-cyan-500' },
  { id: 'crown', label: 'Royalty', icon: '👑', bg: 'bg-yellow-500' },
  { id: 'bot', label: 'StockBot', icon: '🤖', bg: 'bg-purple-500' },
  { id: 'ninja', label: 'Ninja', icon: '🥷', bg: 'bg-zinc-700' },
  { id: 'wizard', label: 'Grandmaster', icon: '🧙‍♂️', bg: 'bg-indigo-600' },
  { id: 'dragon', label: 'Dragon', icon: '🐉', bg: 'bg-rose-500' },
  { id: 'lion', label: 'Lionheart', icon: '🦁', bg: 'bg-orange-500' },
  { id: 'falcon', label: 'Falcon', icon: '🦅', bg: 'bg-emerald-600' },
  { id: 'tiger', label: 'Tiger', icon: '🐯', bg: 'bg-amber-600' },
  { id: 'skull', label: 'Ghost', icon: '💀', bg: 'bg-slate-700' },
  { id: 'gem', label: 'Diamond', icon: '💎', bg: 'bg-sky-500' },
];

export const COUNTRY_PRESETS = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
];

export const DEFAULT_STATS = {
  username: 'AshuKataria',
  avatar: 'warrior',
  country: 'India',
  flag: '🇮🇳',
  elo: 1092,
  puzzleRating: 1200,
  xp: 340,
  level: 3,
  gems: 150,
  setsWon: 0,
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

export const getTierFromLevel = (level) => {
  if (level >= 20) return { name: 'Diamond Grandmaster', color: 'text-cyan-400', badge: '💎', border: 'border-cyan-400/60' };
  if (level >= 10) return { name: 'Gold Champion', color: 'text-amber-400', badge: '🥇', border: 'border-amber-400/60' };
  if (level >= 5) return { name: 'Silver Tactician', color: 'text-gray-300', badge: '🥈', border: 'border-gray-400/60' };
  return { name: 'Bronze Challenger', color: 'text-amber-600', badge: '🥉', border: 'border-amber-700/60' };
};

export const getXpForNextLevel = (level) => {
  return level * 150;
};

export const getStoredStats = () => {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
      return DEFAULT_STATS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      gems: parsed.gems ?? 150,
      setsWon: parsed.setsWon ?? 0,
    };
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

export const addGems = (amount) => {
  const current = getStoredStats();
  const newGems = Math.max(0, (current.gems || 0) + amount);
  const updated = { ...current, gems: newGems };
  saveStoredStats(updated);
  return updated;
};

export const deductGems = (amount) => {
  const current = getStoredStats();
  const currentGems = current.gems || 0;
  if (currentGems < amount) return false;
  const updated = { ...current, gems: currentGems - amount };
  saveStoredStats(updated);
  return updated;
};

// Aliases for backwards compatibility
export const addCoins = addGems;
export const deductCoins = deductGems;

export const addXPAndGems = (xpAmount = 0, gemsAmount = 0) => {
  const current = getStoredStats();
  let newXp = (current.xp || 0) + xpAmount;
  let newLevel = current.level || 1;
  const newGems = (current.gems || 0) + gemsAmount;

  let xpNeeded = getXpForNextLevel(newLevel);
  let leveledUp = false;

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel += 1;
    leveledUp = true;
    xpNeeded = getXpForNextLevel(newLevel);
  }

  const updated = {
    ...current,
    xp: newXp,
    level: newLevel,
    gems: newGems,
  };
  saveStoredStats(updated);
  return { updated, leveledUp, currentLevel: newLevel };
};

export const updateUserProfile = ({ username, avatar, country, flag }) => {
  const current = getStoredStats();
  const updated = {
    ...current,
    ...(username !== undefined ? { username: username.trim() || current.username } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
    ...(country !== undefined ? { country } : {}),
    ...(flag !== undefined ? { flag } : {}),
  };
  saveStoredStats(updated);
  return updated;
};

export const recordMatchOutcome = ({
  isWin,
  opponent = 'kamal47',
  eloDelta = 12,
  movesCount = 10,
  snapshots = [],
  moveHistory = [],
}) => {
  const current = getStoredStats();
  const newElo = Math.max(100, current.elo + eloDelta);
  const newWins = isWin ? current.wins + 1 : current.wins;
  const newLosses = !isWin ? current.losses + 1 : current.losses;
  const newStreak = isWin ? current.streak + 1 : 0;
  const newGames = current.games + 1;

  // Add match XP: Win gets 60 XP, Loss gets 25 XP
  const xpGained = isWin ? 60 : 25;
  const gemsGained = isWin ? 5 : 1;
  let newXp = (current.xp || 0) + xpGained;
  let newLevel = current.level || 1;
  let xpNeeded = getXpForNextLevel(newLevel);

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel += 1;
    xpNeeded = getXpForNextLevel(newLevel);
  }

  const historyItem = {
    opponent,
    result: isWin ? 'win' : 'loss',
    eloChange: eloDelta >= 0 ? `+${eloDelta}` : `${eloDelta}`,
    date: 'Just now',
    movesCount,
    snapshots: snapshots.length > 0 ? snapshots : undefined,
    moveHistory: moveHistory.length > 0 ? moveHistory : undefined,
  };

  const updated = {
    ...current,
    elo: newElo,
    games: newGames,
    wins: newWins,
    losses: newLosses,
    streak: newStreak,
    xp: newXp,
    level: newLevel,
    gems: (current.gems || 0) + gemsGained,
    history: [historyItem, ...(current.history || []).slice(0, 19)],
  };

  saveStoredStats(updated);
  return updated;
};

export const recordPuzzleSolved = (ratingGain = 15) => {
  const current = getStoredStats();
  const { updated } = addXPAndGems(40, 5);
  const final = {
    ...updated,
    puzzleRating: (current.puzzleRating || 1200) + ratingGain,
  };
  saveStoredStats(final);
  return final;
};

// ───────────────── DAILY QUESTS SYSTEM ─────────────────

const INITIAL_QUESTS = [
  {
    id: 'daily_win',
    title: 'First Victory of the Day',
    desc: 'Win 1 match in any game mode',
    icon: '🏆',
    target: 1,
    progress: 0,
    xpReward: 100,
    gemReward: 25,
    claimed: false,
  },
  {
    id: 'daily_walls',
    title: 'Wall Strategist',
    desc: 'Place 8 barricades across matches',
    icon: '🧱',
    target: 8,
    progress: 0,
    xpReward: 75,
    gemReward: 15,
    claimed: false,
  },
  {
    id: 'daily_speed',
    title: 'Speed Runner',
    desc: 'Complete a match in under 3 minutes',
    icon: '⚡',
    target: 1,
    progress: 0,
    xpReward: 100,
    gemReward: 20,
    claimed: false,
  },
];

export const getDailyQuests = () => {
  if (typeof window === 'undefined') return INITIAL_QUESTS;
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(QUESTS_KEY);
    if (!raw) {
      const initData = { date: today, quests: INITIAL_QUESTS };
      localStorage.setItem(QUESTS_KEY, JSON.stringify(initData));
      return INITIAL_QUESTS;
    }

    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      // New day -> Reset quests
      const resetData = { date: today, quests: INITIAL_QUESTS };
      localStorage.setItem(QUESTS_KEY, JSON.stringify(resetData));
      return INITIAL_QUESTS;
    }
    return parsed.quests || INITIAL_QUESTS;
  } catch (e) {
    return INITIAL_QUESTS;
  }
};

export const saveDailyQuests = (quests) => {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toDateString();
    localStorage.setItem(QUESTS_KEY, JSON.stringify({ date: today, quests }));
  } catch (e) {}
};

export const checkQuestsOnMatchEnd = ({ isWin, wallsPlaced = 0, durationSecs = 0 }) => {
  const quests = getDailyQuests();
  let updated = false;

  const newQuests = quests.map((q) => {
    let newProg = q.progress;
    if (q.id === 'daily_win' && isWin) {
      newProg = Math.min(q.target, q.progress + 1);
    } else if (q.id === 'daily_walls') {
      newProg = Math.min(q.target, q.progress + wallsPlaced);
    } else if (q.id === 'daily_speed' && durationSecs > 0 && durationSecs < 180) {
      newProg = Math.min(q.target, q.progress + 1);
    }

    if (newProg !== q.progress) {
      updated = true;
      return { ...q, progress: newProg };
    }
    return q;
  });

  if (updated) {
    saveDailyQuests(newQuests);
  }
  return newQuests;
};

export const claimQuestReward = (questId) => {
  const quests = getDailyQuests();
  const targetQuest = quests.find((q) => q.id === questId);
  if (!targetQuest || targetQuest.claimed || targetQuest.progress < targetQuest.target) {
    return null;
  }

  const updatedQuests = quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );
  saveDailyQuests(updatedQuests);

  const { updated: updatedUserStats, leveledUp } = addXPAndGems(
    targetQuest.xpReward,
    targetQuest.gemReward
  );

  return {
    quests: updatedQuests,
    userStats: updatedUserStats,
    xpReward: targetQuest.xpReward,
    gemReward: targetQuest.gemReward,
    leveledUp,
  };
};

// ───────────────── IN-GAME COSMETICS & STORE SYSTEM ─────────────────

const COSMETICS_KEY = 'barricade_unlocked_cosmetics';

export const COSMETICS_CATALOG = {
  pawn: [
    { id: 'pawn_default', name: 'Classic Wood', price: 0, icon: '🪵', desc: 'Handcrafted solid oak' },
    { id: 'pawn_fire', name: 'Fire Spark', price: 100, icon: '🔥', desc: 'Blazing flame aura and trail' },
    { id: 'pawn_neon', name: 'Neon Pulse', price: 150, icon: '⚡', desc: 'Cyan electric energy ring' },
    { id: 'pawn_gold', name: 'Royal Gold', price: 250, icon: '👑', desc: 'Gleaming golden luster' },
  ],
  wall: [
    { id: 'wall_default', name: 'Classic Oak', price: 0, icon: '🪵', desc: 'Standard solid timber' },
    { id: 'wall_obsidian', name: 'Obsidian Dark', price: 75, icon: '⬛', desc: 'Glossy dark volcanic stone' },
    { id: 'wall_carbon', name: 'Carbon Fiber', price: 120, icon: '🏁', desc: 'High-tech composite weave' },
    { id: 'wall_gold', name: 'Golden Beam', price: 200, icon: '✨', desc: 'Radiant golden barricade' },
  ],
  frame: [
    { id: 'frame_default', name: 'Standard Circle', price: 0, icon: '⚪', desc: 'Clean minimal border' },
    { id: 'frame_cyber', name: 'Cyber Hexagon', price: 80, icon: '🔷', desc: 'Pulsing cyan tech frame' },
    { id: 'frame_flame', name: 'Flaming Aura', price: 140, icon: '🔥', desc: 'Blazing fiery border' },
    { id: 'frame_crown', name: 'Diamond Crown', price: 220, icon: '👑', desc: 'Jewel-studded regal frame' },
  ],
};

const DEFAULT_COSMETICS = {
  unlocked: ['pawn_default', 'wall_default', 'frame_default'],
  equipped: {
    pawn: 'pawn_default',
    wall: 'wall_default',
    frame: 'frame_default',
  },
};

export const getStoredCosmetics = () => {
  if (typeof window === 'undefined') return DEFAULT_COSMETICS;
  try {
    const raw = localStorage.getItem(COSMETICS_KEY);
    if (!raw) {
      localStorage.setItem(COSMETICS_KEY, JSON.stringify(DEFAULT_COSMETICS));
      return DEFAULT_COSMETICS;
    }
    return { ...DEFAULT_COSMETICS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_COSMETICS;
  }
};

export const saveStoredCosmetics = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COSMETICS_KEY, JSON.stringify(data));
  } catch (e) {}
};

export const buyCosmeticItem = (item, category) => {
  const user = getStoredStats();
  const cosmetics = getStoredCosmetics();

  if (cosmetics.unlocked.includes(item.id)) {
    return { success: true, message: 'Already owned', cosmetics, userStats: user };
  }

  if ((user.gems || 0) < item.price) {
    return { success: false, message: 'Not enough gems!', cosmetics, userStats: user };
  }

  const updatedUser = {
    ...user,
    gems: (user.gems || 0) - item.price,
  };
  saveStoredStats(updatedUser);

  const updatedCosmetics = {
    ...cosmetics,
    unlocked: [...cosmetics.unlocked, item.id],
    equipped: {
      ...cosmetics.equipped,
      [category]: item.id,
    },
  };
  saveStoredCosmetics(updatedCosmetics);

  return { success: true, message: `Purchased & Equipped ${item.name}!`, cosmetics: updatedCosmetics, userStats: updatedUser };
};

export const equipCosmeticItem = (category, itemId) => {
  const cosmetics = getStoredCosmetics();
  if (!cosmetics.unlocked.includes(itemId)) {
    return cosmetics;
  }

  const updated = {
    ...cosmetics,
    equipped: {
      ...cosmetics.equipped,
      [category]: itemId,
    },
  };
  saveStoredCosmetics(updated);
  return updated;
};
