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
  Check
} from 'lucide-react';
import GameBoard from './components/GameBoard';

export default function App() {
  const [activeTab, setActiveTab] = useState('play');
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingSeconds, setFindingSeconds] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

  // Time controls: 1 min, 3 min, 5 min, 10 min
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const timeDropdownRef = useRef(null);

  // Game active state
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState('ranked'); // 'ranked' | 'local' | 'ai'

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

      // Live 1-second interval timer
      timer = setInterval(() => {
        setFindingSeconds((prev) => prev + 1);
      }, 1000);

      // Simulate realistic opponent match after ~3.5 seconds
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
    setGameMode(mode);
    setInGame(true);
  };

  return (
    <div className="min-h-screen bg-bgDark text-white flex justify-center">
      <div className="w-full max-w-md bg-bgDark min-h-screen flex flex-col justify-between pb-20 relative select-none">
        
        {/* Top Header */}
        {!inGame && (
          <header className="flex items-center justify-between px-4 py-3 bg-bgDark border-b border-borderDark/40">
            <h1 className="text-2xl font-black text-brandOrange tracking-wide">
              Barricade
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-cardDark px-2 py-1 rounded-full border border-borderDark text-xs">
                <Gem className="text-cyan-400" size={14} />
              </div>
              <div className="flex items-center gap-1.5 bg-cardDark px-2.5 py-1 rounded-full border border-borderDark text-xs font-semibold">
                <span className="text-gray-200">AshuKataria</span>
                <span className="text-brandOrange font-bold">1092</span>
              </div>
              <div className="flex items-center gap-1 bg-cardDark px-2 py-1 rounded-full border border-borderDark text-xs font-bold text-amber-500">
                <Flame className="fill-amber-500 text-amber-500" size={14} />
                <span>1</span>
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {inGame ? (
            <GameBoard
              gameMinutes={selectedMinutes}
              gameMode={gameMode}
              onBack={() => setInGame(false)}
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

                      {/* Dropdown Menu */}
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
                      onClick={() => setShowFindingModal(true)}
                      className="flex items-center justify-center gap-2 bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Users className="text-gray-300" size={16} />
                      <span className="text-sm font-medium">Play with Friends</span>
                    </button>
                  </div>

                  {/* King of the Hill Announcement */}
                  <div className="bg-cardDark border border-borderDark/60 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-brandOrange animate-pulse" />
                        <span className="text-xs font-bold text-brandOrange">New: King of the Hill</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">4 players race to the crown in the centre</p>
                    </div>
                    <X className="text-gray-500 cursor-pointer" size={16} />
                  </div>

                  {/* Modes Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('puzzles')}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Puzzle className="text-teal-400 mb-1" size={20} />
                      <span className="text-xs font-medium">Puzzles</span>
                    </button>
                    <button
                      onClick={() => handleStartGame('local')}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:border-brandOrange transition cursor-pointer"
                    >
                      <Users className="text-blue-400 mb-1" size={20} />
                      <span className="text-xs font-medium">Local</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('more')}
                      className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <Tv className="text-purple-400 mb-1" size={20} />
                      <span className="text-xs font-medium">Watch</span>
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
                      <button className="text-brandOrange font-semibold text-[11px] hover:underline cursor-pointer">Join with code</button>
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

                    <button
                      onClick={() => handleStartGame('ranked')}
                      className="w-full flex items-center justify-center gap-1.5 border border-borderDark bg-cardDark/50 hover:bg-cardDark py-2.5 rounded-xl text-xs font-semibold text-gray-200 transition mt-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Create Room</span>
                    </button>
                  </div>
                </div>
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
                      { rank: 10, name: 'AshuKataria', rating: 1092, games: 34 },
                    ].map((p) => (
                      <div key={p.rank} className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-bold text-gray-400">{p.rank}</span>
                          <span className="text-sm font-semibold text-gray-200">{p.name}</span>
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

              {activeTab === 'puzzles' && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold">Daily Puzzles</h2>
                  <p className="text-xs text-gray-400 -mt-2">Find the fastest path to the goal</p>
                  <div className="bg-cardDark border border-borderDark/60 rounded-2xl p-5 flex flex-col items-center text-center mt-3 gap-3">
                    <Puzzle className="text-brandOrange" size={36} />
                    <h3 className="font-bold text-base">Puzzle #142</h3>
                    <p className="text-xs text-gray-400 max-w-xs">
                      Win in 2 moves: Place 1 wall to deflect opponent and leap into the end-zone.
                    </p>
                    <button
                      onClick={() => handleStartGame('local')}
                      className="bg-brandOrange hover:bg-amber-600 text-black font-bold px-6 py-2 rounded-xl text-xs transition cursor-pointer mt-2"
                    >
                      Solve Now
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">AshuKataria</h2>
                      <p className="text-[11px] text-gray-400">Joined Oct 4, 2026 · India 🇮🇳</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-brandOrange tracking-wider">Bronze</span>
                      <div className="text-2xl font-black text-brandOrange">1092</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 bg-cardDark border border-borderDark/60 p-3 rounded-xl text-center">
                    <div><div className="text-xs text-gray-400">Games</div><div className="text-sm font-bold mt-0.5">34</div></div>
                    <div><div className="text-xs text-gray-400">Wins</div><div className="text-sm font-bold text-green-400 mt-0.5">18</div></div>
                    <div><div className="text-xs text-gray-400">Losses</div><div className="text-sm font-bold text-red-400 mt-0.5">16</div></div>
                    <div><div className="text-xs text-gray-400">Win Rate</div><div className="text-sm font-bold mt-0.5">53%</div></div>
                  </div>
                </div>
              )}

              {activeTab === 'more' && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold mb-2">More Options</h2>
                  {['Friends', 'Messages', 'Barricade TV', 'How to play', 'Settings', 'Language'].map((item) => (
                    <button
                      key={item}
                      className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-3.5 rounded-xl text-sm font-medium hover:bg-borderDark/40 transition cursor-pointer"
                    >
                      <span>{item}</span>
                      <ChevronRight className="text-gray-500" size={16} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Dynamic Live Finding Ranked Opponent Modal */}
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
                /* Continuously running live timer */
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
        {!inGame && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#18181b] border-t border-borderDark/60 flex items-center justify-around py-2.5 z-40">
            <button
              onClick={() => setActiveTab('play')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'play' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={18} />
              <span>Play</span>
            </button>
            <button
              onClick={() => setActiveTab('puzzles')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'puzzles' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Puzzle size={18} />
              <span>Puzzles</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'leaderboard' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'profile' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('more')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                activeTab === 'more' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Menu size={18} />
              <span>More</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}