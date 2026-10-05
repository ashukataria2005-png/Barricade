import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('play');
  const [showFindingModal, setShowFindingModal] = useState(false);

  return (
    <div className="min-h-screen bg-bgDark text-white flex justify-center">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md bg-bgDark min-h-screen flex flex-col justify-between pb-20 relative">

        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-bgDark border-b border-borderDark/40">
          <h1 className="text-2xl font-black text-brandOrange tracking-wide">
            Barricade
          </h1>
          <div className="flex items-center gap-2">
            {/* Diamonds */}
            <div className="flex items-center gap-1 bg-cardDark px-2 py-1 rounded-full border border-borderDark text-xs">
              <Gem size={14} className="text-cyan-400" />
            </div>
            {/* Username & Rating */}
            <div className="flex items-center gap-1.5 bg-cardDark px-2.5 py-1 rounded-full border border-borderDark text-xs font-semibold">
              <span className="text-gray-200">AshuKataria</span>
              <span className="text-brandOrange">1147</span>
            </div>
            {/* Daily Streak */}
            <div className="flex items-center gap-1 bg-cardDark px-2 py-1 rounded-full border border-borderDark text-xs font-bold text-amber-500">
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span>1</span>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'play' && (
            <div className="flex flex-col gap-4">
              {/* Play Ranked CTA */}
              <button
                onClick={() => setShowFindingModal(true)}
                className="w-full bg-brandGreen hover:bg-green-600 transition text-white rounded-2xl p-4 text-left shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Play size={20} className="fill-white" />
                  <span>Play Ranked</span>
                </div>
                <p className="text-xs text-green-100 mt-1">Matchmaking by rating</p>
              </button>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition">
                  <Cpu size={16} className="text-gray-300" />
                  <span className="text-sm font-medium">vs Computer</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-cardDark border border-borderDark/60 py-3 rounded-xl hover:bg-borderDark/40 transition">
                  <Users size={16} className="text-gray-300" />
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
                <X size={16} className="text-gray-500 cursor-pointer" />
              </div>

              {/* Utility Modes Grid */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl">
                  <Puzzle size={20} className="text-teal-400 mb-1" />
                  <span className="text-xs font-medium">Puzzles</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl">
                  <Users size={20} className="text-blue-400 mb-1" />
                  <span className="text-xs font-medium">Local</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-cardDark border border-borderDark/60 py-3 rounded-xl">
                  <Tv size={20} className="text-purple-400 mb-1" />
                  <span className="text-xs font-medium">Watch</span>
                </button>
              </div>

              {/* Active Online Counter */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 py-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span>477 players online</span>
                <span>•</span>
                <span>340 in game</span>
              </div>

              {/* Open Casual Games Lobby Card */}
              <div className="bg-cardDark border border-borderDark/60 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Open Casual Games (2)</span>
                    <p className="text-[10px] text-gray-500">Unranked · won't affect your rating</p>
                  </div>
                  <button className="text-brandOrange font-semibold text-[11px]">Join with code</button>
                </div>

                {/* Casual Match Row */}
                <div className="bg-bgDark/60 rounded-xl p-3 border border-borderDark/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-200">x86</div>
                    <div className="text-[11px] text-brandOrange font-bold mt-0.5">1520 <span className="text-gray-400 font-normal">· 3+0</span></div>
                  </div>
                  <button className="bg-brandOrange hover:bg-amber-600 text-black font-bold px-4 py-1.5 rounded-lg text-xs transition">
                    Join
                  </button>
                </div>

                {/* Create Room Button */}
                <button className="w-full flex items-center justify-center gap-1.5 border border-borderDark bg-cardDark/50 hover:bg-cardDark py-2.5 rounded-xl text-xs font-semibold text-gray-200 transition mt-1">
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
                  { rank: 4, name: 'Simpson', rating: 2218, games: 224 },
                  { rank: 10, name: 'UrBroAlex', rating: 2047, games: 1827 },
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

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">AshuKataria</h2>
                  <p className="text-[11px] text-gray-400">Joined Oct 4, 2026 · India</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-brandOrange tracking-wider">Bronze</span>
                  <div className="text-2xl font-black text-brandOrange">1147</div>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-4 gap-2 bg-cardDark border border-borderDark/60 p-3 rounded-xl text-center">
                <div>
                  <div className="text-xs text-gray-400">Games</div>
                  <div className="text-sm font-bold mt-0.5">15</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Wins</div>
                  <div className="text-sm font-bold text-green-400 mt-0.5">6</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Losses</div>
                  <div className="text-sm font-bold text-red-400 mt-0.5">9</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                  <div className="text-sm font-bold mt-0.5">40%</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'more' && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold mb-2">More Options</h2>
              {['Friends', 'Messages', 'Barricade TV', 'How to play', 'Settings', 'Language'].map((item) => (
                <button key={item} className="flex items-center justify-between bg-cardDark border border-borderDark/60 p-3.5 rounded-xl text-sm font-medium hover:bg-borderDark/40">
                  <span>{item}</span>
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Finding Opponent Popup */}
        {showFindingModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xs bg-cardDark border border-borderDark rounded-2xl p-5 flex flex-col items-center text-center shadow-2xl">
              <span className="h-2 w-2 rounded-full bg-brandOrange mb-3 animate-ping" />
              <h3 className="font-semibold text-sm text-gray-200">Finding a ranked opponent...</h3>
              <div className="text-3xl font-black my-2 font-mono">0:01</div>
              <p className="text-[11px] text-gray-400 mb-4">Ranked · 5+3</p>
              <button
                onClick={() => setShowFindingModal(false)}
                className="w-full bg-red-950/40 border border-red-800/40 text-red-300 font-semibold py-2 rounded-xl text-xs hover:bg-red-900/40 transition mb-3"
              >
                Cancel search
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#18181b] border-t border-borderDark/60 flex items-center justify-around py-2.5 z-40">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${activeTab === 'play' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <LayoutGrid size={18} />
            <span>Play</span>
          </button>
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${activeTab === 'puzzles' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Puzzle size={18} />
            <span>Puzzles</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${activeTab === 'leaderboard' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Trophy size={18} />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${activeTab === 'profile' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('more')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${activeTab === 'more' ? 'text-brandOrange' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Menu size={18} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}