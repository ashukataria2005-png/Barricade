import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Puzzle,
  Trophy,
  User,
  Menu,
  Flame,
  Gem,
  Play,
  Cpu,
  Users,
  Tv,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  Check,
  Copy,
  Link2,
  Share2,
  Palette,
  BookOpen,
  Sliders,
  Swords,
  Radio,
  MessageSquare,
  Award,
  Download,
  Target,
  Crown,
  Edit3,
  ShoppingBag,
  Globe,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import GameBoard from './components/GameBoard';
import PuzzlesView from './components/PuzzlesView';
import WatchView from './components/WatchView';
import KingOfTheHillBoard from './components/KingOfTheHillBoard';
import ThemeModal from './components/ThemeModal';
import HowToPlayModal from './components/HowToPlayModal';
import SettingsModal from './components/SettingsModal';
import AnalysisBoard from './components/AnalysisBoard';
import FriendsModal from './components/FriendsModal';
import MessagesModal from './components/MessagesModal';
import AchievementsModal from './components/AchievementsModal';
import TournamentModal from './components/TournamentModal';
import QuestsModal from './components/QuestsModal';
import ProfileEditModal from './components/ProfileEditModal';
import StoreModal from './components/StoreModal';
import SandboxRulesModal from './components/SandboxRulesModal';
import { getStoredStats, getTierFromLevel, getXpForNextLevel, AVATAR_PRESETS, getStoredCosmetics } from './utils/stats';
import { getStoredTheme } from './utils/themes';
import { getStoredSettings } from './utils/settings';
import { initHost, joinRoom } from './utils/multiplayer';
import { getAchievementsList } from './utils/achievements';
import { t, getStoredLanguage, setStoredLanguage } from './utils/i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState('play');
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingSeconds, setFindingSeconds] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

  // Persistent User stats
  const [userStats, setUserStats] = useState(() => getStoredStats());

  // Board & Pawn Theme state
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme());
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Audio & Haptics Settings state
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Interactive Analysis state
  const [analyzingMatch, setAnalyzingMatch] = useState(null);

  // Profile match review bottom sheet
  const [selectedProfileMatch, setSelectedProfileMatch] = useState(null);

  // How to Play Guide Modal
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);

  // Time controls: 1 min, 3 min, 5 min, 10 min
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const timeDropdownRef = useRef(null);

  // Game active state
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState('ranked'); // 'ranked' | 'local' | 'ai' | 'friend'

  // Spectator Watch state
  const [isWatchingTv, setIsWatchingTv] = useState(false);

  // King of the Hill 4-Player state
  const [inKingOfTheHill, setInKingOfTheHill] = useState(false);

  // Room modal states
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Real-Time P2P WebRTC Multiplayer session state
  const [multiplayerSession, setMultiplayerSession] = useState(null);
  const [multiplayerRole, setMultiplayerRole] = useState('host'); // 'host' | 'guest'
  const [multiplayerStatus, setMultiplayerStatus] = useState('idle'); // 'waiting-for-player' | 'connected' | 'disconnected'
  const [multiplayerOpponent, setMultiplayerOpponent] = useState('');
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Direct Messages & Achievements state
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // In-App PWA Install Banner state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Tournament, Quests & Profile Customizer state
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [activeTournamentMatch, setActiveTournamentMatch] = useState(null);

  // In-Game Cosmetics Store & Multi-Language
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [cosmetics, setCosmetics] = useState(() => getStoredCosmetics());
  const [lang, setLang] = useState(() => getStoredLanguage());

  // Interactive Onboarding Tour state
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  // Live Online/Offline Network Status
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // Custom Sandbox Rules state
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxRules, setSandboxRules] = useState({
    startingWalls: 10,
    incrementSeconds: 0,
  });

  // Network connectivity status listener
  useEffect(() => {
    let timer;
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Timer & Matchmaking Simulation
  useEffect(() => {
    let timer;
    let matchTimeout;

    if (showFindingModal) {
      setFindingSeconds(0);
      setMatchFound(false);

      timer = setInterval(() => {
        setFindingSeconds((prev) => prev + 1);
      }, 1000);

      matchTimeout = setTimeout(() => {
        setMatchFound(true);
        setTimeout(() => {
          setShowFindingModal(false);
          setMatchFound(false);
          setGameMode('ranked');
          setInGame(true);
        }, 1100);
      }, 3500);
    } else {
      setFindingSeconds(0);
      setMatchFound(false);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(matchTimeout);
    };
  }, [showFindingModal]);

  const formatFindingTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartGame = (mode = 'ranked') => {
    setSandboxRules({ startingWalls: 10, incrementSeconds: 0 });
    setGameMode(mode);
    setInGame(true);
  };

  const handleStartCustomGame = ({ startingWalls, incrementSeconds, gameMode: selectedMode }) => {
    setSandboxRules({ startingWalls, incrementSeconds });
    setGameMode(selectedMode || 'local');
    setInGame(true);
  };

  const handleOpenCreateRoom = (customCode) => {
    const generated = customCode || ('BAR-' + Math.floor(1000 + Math.random() * 9000));
    setRoomCode(generated);
    setShowCreateRoomModal(true);
    setMultiplayerStatus('waiting-for-player');

    if (multiplayerSession) {
      multiplayerSession.close();
    }

    const session = initHost({
      roomCode: generated,
      onConnect: () => {
        setToastMsg('Friend connected! Launching match...');
        setMultiplayerRole('host');
        setMultiplayerOpponent('Friend (Blue)');
        setGameMode('multiplayer');
        setTimeout(() => {
          setShowCreateRoomModal(false);
          setInGame(true);
        }, 800);
      },
      onStatus: (status) => setMultiplayerStatus(status),
      onError: (err) => {
        console.error('Host peer error:', err);
      },
    });
    setMultiplayerSession(session);
  };

  const handleCloseCreateRoom = () => {
    if (multiplayerSession) {
      multiplayerSession.close();
      setMultiplayerSession(null);
    }
    setShowCreateRoomModal(false);
    setMultiplayerStatus('idle');
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
    }
    setToastMsg('Room code copied to clipboard!');
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleShareRoom = () => {
    const text = `Play Quoridor with me on Barricade! Enter Room Code: ${roomCode}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Barricade Match Invite',
          text,
        })
        .catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const code = inputRoomCode.trim().toUpperCase();
    if (code.length < 4) return;

    setToastMsg('Connecting to room...');
    setMultiplayerStatus('connecting');

    if (multiplayerSession) {
      multiplayerSession.close();
    }

    const session = joinRoom({
      roomCode: code,
      onConnect: () => {
        setToastMsg('Connected to host! Starting match...');
        setMultiplayerRole('guest');
        setMultiplayerOpponent('Host (Red)');
        setGameMode('multiplayer');
        setTimeout(() => {
          setShowJoinRoomModal(false);
          setInGame(true);
        }, 800);
      },
      onStatus: (status) => setMultiplayerStatus(status),
      onError: () => {
        setToastMsg('Could not find room. Check code!');
        setTimeout(() => setToastMsg(''), 3000);
        setMultiplayerStatus('idle');
      },
    });
    setMultiplayerSession(session);
  };

  const handleCloseJoinRoom = () => {
    if (multiplayerSession) {
      multiplayerSession.close();
      setMultiplayerSession(null);
    }
    setShowJoinRoomModal(false);
    setMultiplayerStatus('idle');
  };

  const handleChallengeFriend = (friend) => {
    setShowFriendsModal(false);
    handleOpenCreateRoom();
    setToastMsg(`Challenged ${friend.username}! Waiting for connection...`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setToastMsg('Barricade app installed successfully! 🎉');
        setTimeout(() => setToastMsg(''), 2500);
      }
      setDeferredPrompt(null);
    } else {
      setToastMsg('Tap browser menu (⋮ or Share) -> "Install App" / "Add to Home Screen"');
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  // Direct Messages challenge handlers
  const handleLaunchChallengeFromDM = (code, friendName) => {
    setRoomCode(code);
    setShowCreateRoomModal(true);
    setToastMsg(`Challenged ${friendName}! Waiting for connection...`);
    setTimeout(() => setToastMsg(''), 3500);

    if (multiplayerSession) {
      multiplayerSession.close();
    }

    const session = initHost({
      roomCode: code,
      onConnect: () => {
        setToastMsg(`${friendName} connected! Launching match...`);
        setMultiplayerRole('host');
        setMultiplayerOpponent(friendName);
        setGameMode('multiplayer');
        setTimeout(() => {
          setShowCreateRoomModal(false);
          setInGame(true);
        }, 800);
      },
      onStatus: (status) => setMultiplayerStatus(status),
      onError: () => {
        setToastMsg('P2P connection error. Try again.');
        setTimeout(() => setToastMsg(''), 3000);
      },
    });
    setMultiplayerSession(session);
  };

  const handleJoinRoomFromDM = (code) => {
    setInputRoomCode(code);
    setShowJoinRoomModal(true);
  };

  const handleStartTournamentMatch = (matchDetails) => {
    setActiveTournamentMatch(matchDetails);
    setGameMode('ai');
    setInGame(true);
  };

  // Language & Onboarding Tour handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourSeen = localStorage.getItem('barricade_tour_seen');
      if (!tourSeen) {
        setShowTour(true);
      }
    }
  }, []);

  const handleFinishTour = () => {
    setShowTour(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('barricade_tour_seen', 'true');
    }
  };

  const handleToggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    setStoredLanguage(next);
    setToastMsg(next === 'hi' ? 'भाषा: हिन्दी सेट की गई 🇮🇳' : 'Language set to English 🇬🇧');
    setTimeout(() => setToastMsg(''), 2500);
  };

  const winRate =
    userStats.games > 0
      ? Math.round((userStats.wins / userStats.games) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-bgDark text-white flex justify-center">
      <div className="w-full max-w-md bg-bgDark min-h-screen flex flex-col justify-between pb-20 relative select-none">
        {/* Live Network Online/Offline Reconnect Toast */}
        {(!isOnline || showOnlineToast) && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300">
            {!isOnline ? (
              <div className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-semibold shadow-lg shadow-black/60 backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>⚠️ You are offline. Local & AI modes still work!</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-lg shadow-black/60 backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>🟢 Back online! Syncing ratings...</span>
              </div>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-2xl z-50 animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* Top Header */}
        {!inGame && !isWatchingTv && !inKingOfTheHill && !analyzingMatch && (
          <header className="flex items-center justify-between px-4 py-3 bg-bgDark border-b border-borderDark/40">
            <h1 className="text-2xl font-black text-brandOrange tracking-wide">
              Barricade
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowThemeModal(true)}
                className="flex items-center gap-1.5 bg-cardDark hover:bg-borderDark/60 px-2.5 py-1 rounded-full border border-borderDark text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
                title="Board & Pawn Themes"
              >
                <Palette size={14} className="text-brandOrange" />
                <span className="hidden sm:inline text-[11px]">Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQuestsModal(true)}
                className="relative p-1.5 bg-cardDark hover:bg-borderDark/60 rounded-full border border-borderDark text-gray-300 hover:text-white transition cursor-pointer"
                title="Daily Quests & Pass"
              >
                <Target size={14} className="text-brandOrange" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </button>
              <button
                type="button"
                onClick={() => setShowMessagesModal(true)}
                className="relative p-1.5 bg-cardDark hover:bg-borderDark/60 rounded-full border border-borderDark text-gray-300 hover:text-white transition cursor-pointer"
                title="Direct Messages"
              >
                <MessageSquare size={14} className="text-brandOrange" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brandOrange animate-pulse" />
              </button>
              <div
                onClick={() => setShowStoreModal(true)}
                className="flex items-center gap-1 bg-cardDark hover:bg-borderDark px-2.5 py-1 rounded-full border border-cyan-500/40 text-xs cursor-pointer shadow-xs transition"
                title="Barricade Shop (Gems)"
              >
                <Gem className="text-cyan-400" size={13} />
                <span className="font-mono text-cyan-300 text-[11px] font-bold">{userStats.gems || 150}</span>
              </div>
              <div
                onClick={() => setShowStoreModal(true)}
                className="flex items-center gap-1 bg-cardDark hover:bg-borderDark px-2 py-1 rounded-full border border-amber-500/40 text-xs cursor-pointer shadow-xs transition"
                title="Coins Wallet"
              >
                <span className="text-xs leading-none">🪙</span>
                <span className="font-mono text-amber-300 text-[11px] font-bold">{userStats.coins ?? 250}</span>
              </div>
              <div
                onClick={() => setShowProfileEditModal(true)}
                className="flex items-center gap-1.5 bg-cardDark hover:bg-borderDark px-2.5 py-1 rounded-full border border-borderDark text-xs font-semibold transition cursor-pointer"
                title="Edit Profile"
              >
                <span>{userStats.flag || '🇮🇳'}</span>
                <span className="text-gray-200">{userStats.username || 'AshuKataria'}</span>
                <span className="text-brandOrange font-bold">{userStats.elo || 1092}</span>
              </div>
              <div className="flex items-center gap-1 bg-cardDark px-2 py-1 rounded-full border border-borderDark text-xs font-bold text-amber-500">
                <Flame className="fill-amber-500 text-amber-500" size={14} />
                <span>{userStats.streak || 1}</span>
              </div>
            </div>
          </header>
        )}

        {/* In-App PWA Install Banner */}
        {showInstallBanner && !inGame && !isWatchingTv && !inKingOfTheHill && !analyzingMatch && (
          <div className="bg-gradient-to-r from-amber-500/15 via-cardDark to-cardDark border border-brandOrange/40 rounded-2xl p-3 mx-4 mt-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brandOrange/20 border border-brandOrange/40 flex items-center justify-center text-brandOrange">
                <Download size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Install Barricade App</h4>
                <p className="text-[10px] text-gray-400">Play fullscreen with zero lag & instant P2P</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleInstallApp}
                className="bg-brandOrange hover:bg-amber-600 text-black font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm active:scale-95"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {analyzingMatch ? (
            <AnalysisBoard
              matchData={analyzingMatch}
              theme={currentTheme}
              onBack={() => setAnalyzingMatch(null)}
            />
          ) : inKingOfTheHill ? (
            <KingOfTheHillBoard
              theme={currentTheme}
              onBack={() => setInKingOfTheHill(false)}
            />
          ) : inGame ? (
            <GameBoard
              gameMinutes={selectedMinutes}
              gameMode={gameMode}
              theme={currentTheme}
              onStatsUpdate={(updated) => setUserStats(updated)}
              onBack={() => {
                if (multiplayerSession) {
                  multiplayerSession.close();
                  setMultiplayerSession(null);
                }
                if (activeTournamentMatch) {
                  setActiveTournamentMatch(null);
                  setShowTournamentModal(true);
                }
                setSandboxRules({ startingWalls: 10, incrementSeconds: 0 });
                setInGame(false);
              }}
              onAnalyze={(matchData) => setAnalyzingMatch(matchData)}
              onOpenSettings={() => setShowSettingsModal(true)}
              multiplayerSession={multiplayerSession}
              multiplayerRole={multiplayerRole}
              myColor={multiplayerRole === 'host' ? 'red' : 'blue'}
              opponentName={multiplayerOpponent}
              tournamentMatch={activeTournamentMatch}
              equippedCosmetics={cosmetics?.equipped}
              lang={lang}
              startingWalls={sandboxRules.startingWalls}
              incrementSeconds={sandboxRules.incrementSeconds}
            />
          ) : isWatchingTv ? (
            <WatchView
              theme={currentTheme}
              equippedCosmetics={cosmetics?.equipped}
              onBack={() => setIsWatchingTv(false)}
              onStatsUpdate={(updated) => setUserStats(updated)}
            />
          ) : (
            <>
              {activeTab === 'play' && (
                <div className="flex flex-col gap-4">
                  {/* Play Ranked CTA Card with integrated Time Selector */}
                  <div className="relative bg-brandGreen rounded-2xl p-4 shadow-lg flex items-center justify-between">
                    <div
                      onClick={() => setShowFindingModal(true)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <Play className="fill-white" size={20} />
                        <span>Play Ranked</span>
                      </div>
                      <p className="text-xs text-green-100 mt-0.5">Matchmaking by rating</p>
                    </div>

                    {/* Time Selector Dropdown Button */}
                    <div className="relative" ref={timeDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTimeDropdown((prev) => !prev);
                        }}
                        className="flex items-center gap-1.5 bg-black/25 hover:bg-black/40 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Clock size={13} />
                        <span>{selectedMinutes} min</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${showTimeDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showTimeDropdown && (
                        <div className="absolute right-0 top-11 bg-cardDark border border-borderDark rounded-xl shadow-2xl py-1.5 w-32 z-50 flex flex-col">
                          {[1, 3, 5, 10].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMinutes(mins);
                                setShowTimeDropdown(false);
                              }}
                              className={`px-3 py-2 text-left text-xs font-semibold hover:bg-borderDark/60 transition flex items-center justify-between cursor-pointer ${
                                selectedMinutes === mins ? 'text-brandOrange bg-borderDark/30' : 'text-gray-300'
                              }`}
                            >
                              <span>{mins} minute{mins > 1 ? 's' : ''}</span>
                              {selectedMinutes === mins && <span className="h-1.5 w-1.5 rounded-full bg-brandOrange" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStartGame('ai')}
                      className="flex items-center justify-center gap-2 bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Cpu className="text-gray-300" size={16} />
                      <span className="text-sm font-medium">vs Computer</span>
                    </button>
                    <button
                      onClick={() => setShowFriendsModal(true)}
                      className="flex items-center justify-center gap-2 bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Users className="text-gray-300" size={16} />
                      <span className="text-sm font-medium">Play with Friends</span>
                    </button>
                  </div>

                  {/* King of the Hill Announcement */}
                  <div
                    onClick={() => setInKingOfTheHill(true)}
                    className="bg-cardDark border border-borderDark/60 hover:border-brandOrange/60 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-brandOrange animate-pulse" />
                        <span className="text-xs font-bold text-brandOrange">New: King of the Hill</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">4 players race to the crown in the centre</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-bold">
                      <span>Play</span>
                      <ChevronRight size={13} />
                    </div>
                  </div>

                  {/* 8-Player Knockout Tournament Card */}
                  <div
                    onClick={() => setShowTournamentModal(true)}
                    className="bg-gradient-to-r from-amber-500/15 via-cardDark to-cardDark border border-amber-500/40 hover:border-brandOrange rounded-xl p-3 flex items-center justify-between cursor-pointer transition shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-brandOrange">
                        <Crown size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-200">8-Player Knockout Cup</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                            Bracket
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Single elimination championship tournament</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500 text-black px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs group-hover:bg-amber-400 transition">
                      <span>Enter</span>
                      <ChevronRight size={13} />
                    </div>
                  </div>

                  {/* Modes Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setActiveTab('puzzles')}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-2.5 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Puzzle className="text-teal-400 mb-1" size={18} />
                      <span className="text-[11px] font-medium">Puzzles</span>
                    </button>
                    <button
                      onClick={() => handleStartGame('local')}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-2.5 rounded-xl hover:border-brandOrange transition cursor-pointer"
                    >
                      <Users className="text-blue-400 mb-1" size={18} />
                      <span className="text-[11px] font-medium">Local</span>
                    </button>
                    <button
                      onClick={() => setShowSandboxModal(true)}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-2.5 rounded-xl hover:border-amber-400 transition cursor-pointer group"
                    >
                      <Sliders className="text-amber-400 mb-1 group-hover:rotate-45 transition-transform" size={18} />
                      <span className="text-[11px] font-medium">Sandbox</span>
                    </button>
                    <button
                      onClick={() => setIsWatchingTv(true)}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-2.5 rounded-xl hover:border-brandOrange transition cursor-pointer"
                    >
                      <Tv className="text-purple-400 mb-1" size={18} />
                      <span className="text-[11px] font-medium">Watch</span>
                    </button>
                  </div>

                  {/* Active Online Counter */}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 py-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>477 players online</span>
                    <span>•</span>
                    <span>340 in game</span>
                  </div>

                  {/* Casual Matches Lobby */}
                  <div className="bg-cardDark border border-borderDark/60 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Open Casual Games (2)</span>
                        <p className="text-[10px] text-gray-500">Unranked · won't affect your rating</p>
                      </div>
                      <button
                        onClick={() => setShowJoinRoomModal(true)}
                        className="text-brandOrange font-semibold text-[11px] hover:underline cursor-pointer"
                      >
                        Join with code
                      </button>
                    </div>

                    <div className="bg-bgDark/60 rounded-xl p-3 border border-borderDark/40 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-200">kamal47</div>
                        <div className="text-[11px] text-brandOrange font-bold mt-0.5">
                          1188 <span className="text-gray-400 font-normal">· {selectedMinutes}+0</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartGame('ranked')}
                        className="bg-brandOrange hover:bg-amber-600 text-black font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm active:scale-95"
                      >
                        Join
                      </button>
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setShowFriendsModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-brandOrange/40 bg-brandOrange/10 hover:bg-brandOrange/20 py-2.5 rounded-xl text-xs font-semibold text-brandOrange transition cursor-pointer"
                      >
                        <Users size={14} />
                        <span>Friends</span>
                      </button>
                      <button
                        onClick={handleOpenCreateRoom}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-borderDark bg-cardDark/50 hover:bg-cardDark py-2.5 rounded-xl text-xs font-semibold text-gray-200 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create Room</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'puzzles' && (
                <PuzzlesView
                  theme={currentTheme}
                  onPuzzleCompleted={(updated) => setUserStats(updated)}
                />
              )}

              {activeTab === 'leaderboard' && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold">Leaderboard</h2>
                  <p className="text-xs text-gray-400 -mt-2">Top ranked players</p>
                  <div className="flex flex-col gap-2 mt-2">
                    {[
                      { rank: 1, name: 'The_dog', rating: 2301, games: 336 },
                      { rank: 2, name: 'MikeJordan', rating: 2259, games: 527 },
                      { rank: 3, name: 'Rejected_', rating: 2225, games: 279 },
                      { rank: 4, name: 'kamal47', rating: 1188, games: 142 },
                      { rank: 10, name: userStats.username || 'AshuKataria', rating: userStats.elo || 1092, games: userStats.games || 34 },
                    ].map((p) => (
                      <div
                        key={p.rank}
                        className={`flex items-center justify-between border p-3 rounded-xl ${
                          p.rank === 10
                            ? 'bg-amber-500/10 border-brandOrange/60'
                            : 'bg-cardDark border-borderDark/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-bold text-gray-400">{p.rank}</span>
                          <span className={`text-sm font-semibold ${p.rank === 10 ? 'text-brandOrange font-bold' : 'text-gray-200'}`}>
                            {p.name} {p.rank === 10 && '(You)'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-purple-400">{p.rating}</div>
                          <div className="text-[10px] text-gray-500">{p.games} games</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="flex flex-col gap-3.5">
                  {/* User Profile Header Card */}
                  <div className="bg-cardDark border border-borderDark/60 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl ${
                        (AVATAR_PRESETS.find((a) => a.id === userStats.avatar) || AVATAR_PRESETS[0]).bg
                      } flex items-center justify-center text-2xl shadow-md border border-white/20`}>
                        {(AVATAR_PRESETS.find((a) => a.id === userStats.avatar) || AVATAR_PRESETS[0]).icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-base font-bold text-white">{userStats.username || 'AshuKataria'}</h2>
                          <span>{userStats.flag || '🇮🇳'}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Level {userStats.level || 1} · {getTierFromLevel(userStats.level || 1).name}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowProfileEditModal(true)}
                      className="flex items-center gap-1.5 bg-bgDark hover:bg-borderDark/60 border border-borderDark text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Level & XP Progression Card in Profile */}
                  <div
                    onClick={() => setShowQuestsModal(true)}
                    className="bg-bgDark/80 border border-borderDark rounded-2xl p-3 flex flex-col gap-1.5 cursor-pointer hover:border-brandOrange/60 transition shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-200">
                        <Target size={13} className="text-brandOrange" />
                        <span>Level {userStats.level || 1} XP Progress</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {userStats.xp || 0} / {getXpForNextLevel(userStats.level || 1)} XP
                      </span>
                    </div>
                    <div className="w-full bg-borderDark/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brandOrange to-amber-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((userStats.xp || 0) / getXpForNextLevel(userStats.level || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-cardDark border border-borderDark/60 p-3 rounded-xl text-center">
                    <div><div className="text-xs text-gray-400">Games</div><div className="text-sm font-bold mt-0.5">{userStats.games || 0}</div></div>
                    <div><div className="text-xs text-gray-400">Wins</div><div className="text-sm font-bold text-green-400 mt-0.5">{userStats.wins || 0}</div></div>
                    <div><div className="text-xs text-gray-400">Losses</div><div className="text-sm font-bold text-red-400 mt-0.5">{userStats.losses || 0}</div></div>
                    <div><div className="text-xs text-gray-400">Win Rate</div><div className="text-sm font-bold mt-0.5">{winRate}%</div></div>
                  </div>

                  {/* Trophies & Badges Banner Row */}
                  <div
                    onClick={() => setShowAchievementsModal(true)}
                    className="bg-gradient-to-r from-amber-500/10 via-cardDark to-cardDark border border-amber-500/30 hover:border-brandOrange p-3 rounded-xl flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-brandOrange">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-200">Trophies & Badges</div>
                        <div className="text-[10px] text-gray-400">
                          {getAchievementsList().filter((a) => a.unlocked).length} / {getAchievementsList().length} unlocked · Tap to view
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-brandOrange font-bold">
                      <span>View</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Match History */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-300">Recent Matches</h3>
                      <span className="text-[11px] text-gray-500">Tap to analyze</span>
                    </div>
                    {(userStats.history || []).slice(0, 5).map((match, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedProfileMatch(match)}
                        className="bg-cardDark border border-borderDark/50 hover:border-brandOrange/60 p-3 rounded-xl flex items-center justify-between transition cursor-pointer active:scale-[0.99] group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-200 group-hover:text-brandOrange transition">
                            {match.opponent}
                          </div>
                          <div className="text-[10px] text-gray-400">{match.date} · {match.movesCount || 12} moves</div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                match.result === 'win'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {match.result === 'win' ? 'Victory' : 'Defeat'}
                            </span>
                            <div className="text-xs font-mono font-semibold text-gray-400 mt-1">
                              {match.eloChange}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-500 group-hover:text-brandOrange transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'more' && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold mb-2">{t('more_options', lang)}</h2>
                  {[
                    { name: t('store_title', lang), icon: ShoppingBag, action: () => setShowStoreModal(true) },
                    { name: t('language', lang) + (lang === 'en' ? ' (English 🇬🇧)' : ' (हिन्दी 🇮🇳)'), icon: Globe, action: handleToggleLanguage },
                    { name: t('app_tour', lang), icon: HelpCircle, action: () => { setTourStep(1); setShowTour(true); } },
                    { name: t('tournament_title', lang), icon: Crown, action: () => setShowTournamentModal(true) },
                    { name: t('daily_quests_option', lang), icon: Target, action: () => setShowQuestsModal(true) },
                    { name: t('customize_profile', lang), icon: User, action: () => setShowProfileEditModal(true) },
                    { name: t('messages', lang), icon: MessageSquare, action: () => setShowMessagesModal(true) },
                    { name: t('trophies_badges', lang), icon: Trophy, action: () => setShowAchievementsModal(true) },
                    { name: t('friends_challenges', lang), icon: Users, action: () => setShowFriendsModal(true) },
                    { name: t('board_themes', lang), icon: Palette, action: () => setShowThemeModal(true) },
                    { name: t('sound_settings', lang), icon: Sliders, action: () => setShowSettingsModal(true) },
                    { name: 'Custom Sandbox Rules 🛠️', icon: Sliders, action: () => setShowSandboxModal(true) },
                    { name: t('how_to_play', lang), icon: BookOpen, action: () => setShowHowToPlayModal(true) },
                    { name: t('barricade_tv', lang), icon: Tv, action: () => setIsWatchingTv(true) },
                    { name: t('daily_puzzles', lang), icon: Puzzle, action: () => setActiveTab('puzzles') },
                    { name: t('install_app', lang), icon: Download, action: handleInstallApp },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={item.action}
                      className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-3.5 rounded-xl text-sm font-medium hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="text-brandOrange" size={17} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="text-gray-500" size={16} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Create Room Modal (P2P Host) */}
        {showCreateRoomModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xs bg-cardDark border border-borderDark rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative select-none">
              <Users className="text-brandOrange mb-2" size={32} />
              <h3 className="font-bold text-base text-gray-100">Host Private Room</h3>
              <p className="text-xs text-gray-400 mt-1 mb-3">Share this code with your friend to connect instantly:</p>

              <div className="w-full bg-bgDark border-2 border-brandOrange/60 rounded-2xl py-3 px-4 flex items-center justify-between mb-3 shadow-inner">
                <span className="text-xl font-mono font-black text-brandOrange tracking-widest">{roomCode}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 bg-cardDark hover:bg-borderDark border border-borderDark rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
                    title="Copy Code"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={handleShareRoom}
                    className="p-1.5 bg-cardDark hover:bg-borderDark border border-borderDark rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
                    title="Share Link"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Live WebRTC Connection Handshake Status */}
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bgDark/80 border border-borderDark/60 text-xs w-full justify-center mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-gray-300 font-semibold text-[11px]">
                  Listening for friend connection...
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleShareRoom}
                  className="w-full bg-brandOrange hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>Share Invite Code</span>
                </button>
                <button
                  onClick={handleCloseCreateRoom}
                  className="w-full bg-cardDark border border-borderDark text-gray-400 py-2 rounded-xl text-xs hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Modal (P2P Guest) */}
        {showJoinRoomModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xs bg-cardDark border border-borderDark rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative select-none">
              <Link2 className="text-brandOrange mb-2" size={32} />
              <h3 className="font-bold text-base text-gray-100">Join Private Room</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Enter the room code shared by the host:</p>

              <form onSubmit={handleJoinSubmit} className="w-full flex flex-col gap-3">
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BAR-8429"
                  maxLength={10}
                  className="w-full bg-bgDark border border-borderDark rounded-xl py-2.5 px-3 text-center text-base font-mono font-bold text-white focus:outline-none focus:border-brandOrange"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={inputRoomCode.trim().length < 4 || multiplayerStatus === 'connecting'}
                  className="w-full bg-brandOrange hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {multiplayerStatus === 'connecting' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Connecting via P2P...</span>
                    </>
                  ) : (
                    <span>Join Match</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseJoinRoom}
                  className="w-full bg-cardDark border border-borderDark text-gray-400 py-2 rounded-xl text-xs hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live Finding Ranked Opponent Modal */}
        {showFindingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xs bg-cardDark border border-borderDark rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative">
              <span className={`h-3.5 w-3.5 rounded-full mb-3 ${matchFound ? 'bg-green-500 ring-4 ring-green-500/30' : 'bg-brandOrange animate-ping'}`} />
              
              <h3 className="font-bold text-base text-gray-100">
                {matchFound ? 'Opponent found!' : 'Finding a ranked opponent...'}
              </h3>

              {matchFound ? (
                <div className="my-4 py-2 px-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-2 text-green-400 text-sm font-bold animate-pulse">
                  <Check size={16} />
                  <span>kamal47 (1188) matched</span>
                </div>
              ) : (
                <div className="text-4xl font-black my-4 font-mono text-white tracking-widest">
                  {formatFindingTime(findingSeconds)}
                </div>
              )}

              <p className="text-xs text-gray-400 mb-5">Ranked · {selectedMinutes}+0</p>

              <button
                type="button"
                onClick={() => setShowFindingModal(false)}
                className="w-full bg-red-950/60 border border-red-800/60 text-red-300 font-bold py-2.5 rounded-xl text-xs hover:bg-red-900/60 transition cursor-pointer"
              >
                Cancel search
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        {!inGame && !isWatchingTv && !inKingOfTheHill && !analyzingMatch && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#18181b] border-t border-borderDark/60 flex items-center justify-around py-2.5 z-40">
            <button
              onClick={() => setActiveTab('play')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'play' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={18} />
              <span>{t('nav_play', lang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('puzzles')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'puzzles' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Puzzle size={18} />
              <span>{t('nav_puzzles', lang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'leaderboard' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Trophy size={18} />
              <span>{t('nav_leaderboard', lang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'profile' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <User size={18} />
              <span>{t('nav_profile', lang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('more')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'more' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Menu size={18} />
              <span>{t('nav_more', lang)}</span>
            </button>
          </nav>
        )}

        {/* Board & Pawn Theme Modal */}
        <ThemeModal
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
          currentTheme={currentTheme}
          onSelectTheme={(th) => setCurrentTheme(th)}
        />

        {/* Audio & Haptics Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
        />

        {/* Interactive How to Play Guide Modal */}
        <HowToPlayModal
          isOpen={showHowToPlayModal}
          onClose={() => setShowHowToPlayModal(false)}
        />

        {/* Friends & Real-Time Challenges Modal */}
        <FriendsModal
          isOpen={showFriendsModal}
          onClose={() => setShowFriendsModal(false)}
          onChallengeFriend={handleChallengeFriend}
        />

        {/* Direct Messages Inbox Modal */}
        <MessagesModal
          isOpen={showMessagesModal}
          onClose={() => setShowMessagesModal(false)}
          onLaunchChallenge={handleLaunchChallengeFromDM}
          onJoinRoom={handleJoinRoomFromDM}
        />

        {/* Trophies & Badges Modal */}
        <AchievementsModal
          isOpen={showAchievementsModal}
          onClose={() => setShowAchievementsModal(false)}
        />

        {/* 8-Player Tournament Bracket Modal */}
        <TournamentModal
          isOpen={showTournamentModal}
          onClose={() => setShowTournamentModal(false)}
          userStats={userStats}
          onStartTournamentMatch={handleStartTournamentMatch}
          onStatsUpdate={(s) => setUserStats(s)}
        />

        {/* Daily Quests & Pass Modal */}
        <QuestsModal
          isOpen={showQuestsModal}
          onClose={() => setShowQuestsModal(false)}
          userStats={userStats}
          onStatsUpdate={(s) => setUserStats(s)}
        />

        {/* Profile Customizer Modal */}
        <ProfileEditModal
          isOpen={showProfileEditModal}
          onClose={() => setShowProfileEditModal(false)}
          userStats={userStats}
          onProfileSaved={(s) => {
            setUserStats(s);
            setToastMsg('Profile updated! ✨');
            setTimeout(() => setToastMsg(''), 2500);
          }}
        />

        {/* In-Game Store & Cosmetics Modal */}
        <StoreModal
          isOpen={showStoreModal}
          onClose={() => setShowStoreModal(false)}
          userStats={userStats}
          onStatsUpdate={(s) => setUserStats(s)}
          onCosmeticsUpdated={(c) => setCosmetics(c)}
        />

        {/* First-Time User Interactive Tour / Coach Marks */}
        {showTour && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
            <div className="w-full max-w-sm bg-cardDark border border-brandOrange/60 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-brandOrange" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Barricade Quick Tour</h3>
                    <p className="text-[10px] text-gray-400">Step {tourStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={handleFinishTour}
                  className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {tourStep === 1 && (
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-brandGreen/20 border border-brandGreen/40 flex items-center justify-center text-brandGreen mx-auto mb-1">
                    <Play size={24} className="fill-green-400" />
                  </div>
                  <h4 className="text-sm font-bold text-center text-gray-100">Quick Ranked Matchmaking</h4>
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    Pick your blitz or rapid clock (1, 3, 5, or 10 mins). Hit "Play Ranked" to match with players by skill rating!
                  </p>
                </div>
              )}

              {tourStep === 2 && (
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-brandOrange mx-auto mb-1">
                    <Crown size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-center text-gray-100">Multiple Thrilling Game Modes</h4>
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    Fight in the 8-Player Knockout Cup, race to the centre in 4-Player King of the Hill, solve daily tactical puzzles, or practice against smart AI bots.
                  </p>
                </div>
              )}

              {tourStep === 3 && (
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-1">
                    <ShoppingBag size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-center text-gray-100">Quests, Gems & Shop Cosmetics</h4>
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    Claim daily quest rewards to earn gems and XP. Unlock custom Fire & Neon pawn skins, Obsidian wall textures, and play 100% offline anytime!
                  </p>
                </div>
              )}

              {/* Tour Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-borderDark/60">
                <button
                  type="button"
                  onClick={handleFinishTour}
                  className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1.5 transition cursor-pointer"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-1.5">
                  {tourStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setTourStep((s) => s - 1)}
                      className="bg-cardDark border border-borderDark text-gray-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {tourStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setTourStep((s) => s + 1)}
                      className="bg-brandOrange hover:bg-amber-600 text-black px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishTour}
                      className="bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      Got it, Let's Play!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox & Custom Rules Modal */}
        <SandboxRulesModal
          isOpen={showSandboxModal}
          onClose={() => setShowSandboxModal(false)}
          onStartCustomGame={handleStartCustomGame}
        />

        {/* Match Detail Bottom Sheet / Modal */}
        {selectedProfileMatch && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
            <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
                <div className="flex items-center gap-2">
                  <Trophy className="text-brandOrange" size={20} />
                  <h3 className="text-base font-bold text-white">Match Overview</h3>
                </div>
                <button
                  onClick={() => setSelectedProfileMatch(null)}
                  className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-bgDark/70 border border-borderDark/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-gray-100">{selectedProfileMatch.opponent}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedProfileMatch.date} · {selectedProfileMatch.movesCount || 14} moves</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      selectedProfileMatch.result === 'win'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {selectedProfileMatch.result === 'win' ? 'Victory' : 'Defeat'}
                  </span>
                  <div className="text-sm font-bold font-mono text-brandOrange mt-1">
                    {selectedProfileMatch.eloChange} Elo
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAnalyzingMatch(selectedProfileMatch);
                    setSelectedProfileMatch(null);
                  }}
                  className="w-full bg-brandOrange hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Play size={14} className="fill-black" />
                  <span>Analyze Match (Interactive Review)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProfileMatch(null)}
                  className="w-full bg-cardDark border border-borderDark text-gray-400 py-2.5 rounded-xl text-xs hover:text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}