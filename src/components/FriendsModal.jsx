import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Swords,
  Trash2,
  Check,
  Circle,
  Flame,
  Search
} from 'lucide-react';

const FRIENDS_KEY = 'barricade_friends';

const DEFAULT_FRIENDS = [
  { id: '1', username: 'kamal47', rating: 1188, status: 'online', avatarColor: 'bg-emerald-500' },
  { id: '2', username: 'The_dog', rating: 2301, status: 'in-game', avatarColor: 'bg-rose-500' },
  { id: '3', username: 'MikeJordan', rating: 2259, status: 'offline', avatarColor: 'bg-blue-500' },
  { id: '4', username: 'AlphaGamer', rating: 1450, status: 'online', avatarColor: 'bg-purple-500' },
];

export const getStoredFriends = () => {
  if (typeof window === 'undefined') return DEFAULT_FRIENDS;
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) {
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(DEFAULT_FRIENDS));
      return DEFAULT_FRIENDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_FRIENDS;
  }
};

export const saveStoredFriends = (friends) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {}
};

export default function FriendsModal({ isOpen, onClose, onChallengeFriend }) {
  const [friends, setFriends] = useState(() => getStoredFriends());
  const [newUsername, setNewUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedToast, setAddedToast] = useState('');

  if (!isOpen) return null;

  const handleAddFriend = (e) => {
    e.preventDefault();
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    if (friends.some((f) => f.username.toLowerCase() === trimmed.toLowerCase())) {
      setAddedToast('Friend already in list!');
      setTimeout(() => setAddedToast(''), 2500);
      return;
    }

    const colors = ['bg-amber-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500'];
    const newFriend = {
      id: Date.now().toString(),
      username: trimmed,
      rating: Math.floor(1000 + Math.random() * 500),
      status: 'online',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };

    const updated = [newFriend, ...friends];
    setFriends(updated);
    saveStoredFriends(updated);
    setNewUsername('');
    setAddedToast(`Added ${trimmed}!`);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const handleDeleteFriend = (id, e) => {
    e.stopPropagation();
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    saveStoredFriends(updated);
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3 shadow-2xl relative">
        {/* Toast */}
        {addedToast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg z-50 animate-bounce">
            {addedToast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <Users className="text-brandOrange" size={20} />
            <div>
              <h3 className="text-base font-bold text-white">Friends & Challenges</h3>
              <p className="text-[11px] text-gray-400">Play real-time 1v1 with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddFriend} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Add by username..."
              maxLength={20}
              className="w-full bg-bgDark border border-borderDark/80 rounded-xl py-2 pl-3 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brandOrange"
            />
          </div>
          <button
            type="submit"
            disabled={!newUsername.trim()}
            className="bg-brandOrange hover:bg-amber-600 disabled:opacity-40 text-black p-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
            title="Add Friend"
          >
            <UserPlus size={16} />
          </button>
        </form>

        {/* Search filter if many friends */}
        {friends.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-gray-500" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-bgDark/60 border border-borderDark/50 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}

        {/* Friends List */}
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 italic">
              No friends found. Add one above!
            </div>
          ) : (
            filteredFriends.map((f) => (
              <div
                key={f.id}
                className="bg-bgDark/80 border border-borderDark/60 p-2.5 rounded-2xl flex items-center justify-between hover:border-gray-500 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full ${f.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                      {f.username.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-cardDark ${
                        f.status === 'online'
                          ? 'bg-green-500 animate-pulse'
                          : f.status === 'in-game'
                          ? 'bg-amber-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-100">{f.username}</span>
                      <span className="text-[10px] font-mono font-bold text-brandOrange">{f.rating}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 capitalize">
                      {f.status === 'online' ? 'Online' : f.status === 'in-game' ? 'In a match' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {f.status === 'online' && (
                    <button
                      type="button"
                      onClick={() => onChallengeFriend(f)}
                      className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-xs"
                      title="Challenge to a match"
                    >
                      <Swords size={13} />
                      <span>Challenge</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteFriend(f.id, e)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                    title="Remove Friend"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer mt-1"
        >
          Close
        </button>
      </div>
    </div>
  );
}
