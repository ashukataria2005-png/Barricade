const THEME_KEY = 'barricade_theme';

export const THEMES = {
  'dark-slate': {
    id: 'dark-slate',
    name: 'Dark Slate',
    subtitle: 'Tactical minimalist dark grid',
    boardBg: '#161618',
    cellBg: '#26262a',
    cellHover: '#303036',
    wallGradient: 'from-amber-400 via-amber-500 to-amber-600',
    wallBorder: 'border-amber-300',
    redPawn: 'bg-rose-500 border-white ring-rose-500/40',
    bluePawn: 'bg-blue-500 border-white ring-blue-500/40',
    accentColor: '#f59e0b',
  },
  'classic-wood': {
    id: 'classic-wood',
    name: 'Classic Wood',
    subtitle: 'Warm rich oak & brass barricades',
    boardBg: '#2e1c0c',
    cellBg: '#422b18',
    cellHover: '#54381f',
    wallGradient: 'from-amber-600 via-amber-700 to-amber-800',
    wallBorder: 'border-amber-500',
    redPawn: 'bg-red-600 border-amber-200 ring-red-600/40',
    bluePawn: 'bg-sky-600 border-amber-200 ring-sky-600/40',
    accentColor: '#d97706',
  },
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    subtitle: 'Synthwave violet & glowing lasers',
    boardBg: '#0d0b1a',
    cellBg: '#1a1633',
    cellHover: '#26204d',
    wallGradient: 'from-fuchsia-500 via-pink-500 to-cyan-400',
    wallBorder: 'border-cyan-300 shadow-cyan-500/50',
    redPawn: 'bg-fuchsia-500 border-cyan-300 ring-fuchsia-500/50 shadow-md shadow-fuchsia-500/50',
    bluePawn: 'bg-cyan-400 border-fuchsia-300 ring-cyan-400/50 shadow-md shadow-cyan-400/50',
    accentColor: '#06b6d4',
  },
  'emerald-green': {
    id: 'emerald-green',
    name: 'Emerald Green',
    subtitle: 'Deep forest jade & bronze accents',
    boardBg: '#0a1c12',
    cellBg: '#132e1e',
    cellHover: '#1a3d28',
    wallGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    wallBorder: 'border-emerald-300',
    redPawn: 'bg-rose-500 border-emerald-200 ring-rose-500/40',
    bluePawn: 'bg-teal-400 border-white ring-teal-400/40',
    accentColor: '#10b981',
  },
};

export const getStoredTheme = () => {
  if (typeof window === 'undefined') return THEMES['dark-slate'];
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEMES[saved]) return THEMES[saved];
    return THEMES['dark-slate'];
  } catch (e) {
    return THEMES['dark-slate'];
  }
};

export const saveStoredTheme = (themeId) => {
  if (typeof window === 'undefined') return;
  try {
    if (THEMES[themeId]) {
      localStorage.setItem(THEME_KEY, themeId);
    }
  } catch (e) {}
};
