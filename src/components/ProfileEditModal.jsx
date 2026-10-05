import React, { useState } from 'react';
import {
  X,
  User,
  Check,
  Globe,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  AVATAR_PRESETS,
  COUNTRY_PRESETS,
  updateUserProfile,
  getTierFromLevel
} from '../utils/stats';

export default function ProfileEditModal({ isOpen, onClose, userStats, onProfileSaved }) {
  const [username, setUsername] = useState(userStats?.username || 'AshuKataria');
  const [selectedAvatar, setSelectedAvatar] = useState(userStats?.avatar || 'warrior');
  const [selectedCountry, setSelectedCountry] = useState(userStats?.country || 'India');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentCountryObj = COUNTRY_PRESETS.find((c) => c.name === selectedCountry) || COUNTRY_PRESETS[0];
  const currentAvatarObj = AVATAR_PRESETS.find((a) => a.id === selectedAvatar) || AVATAR_PRESETS[0];
  const tier = getTierFromLevel(userStats?.level || 1);

  const handleSave = (e) => {
    e?.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setErrorMsg('Username cannot be empty');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return;
    }

    const updated = updateUserProfile({
      username: trimmed,
      avatar: selectedAvatar,
      country: currentCountryObj.name,
      flag: currentCountryObj.flag,
    });

    if (onProfileSaved) {
      onProfileSaved(updated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-4 shadow-2xl relative max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <User className="text-brandOrange" size={20} />
            <div>
              <h3 className="text-base font-bold text-white">Customize Profile</h3>
              <p className="text-[11px] text-gray-400">Edit identity, avatar & nationality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Profile Preview Card */}
        <div className="bg-bgDark/80 border border-borderDark rounded-2xl p-3.5 flex items-center gap-3.5 shadow-inner">
          <div className={`w-14 h-14 rounded-2xl ${currentAvatarObj.bg} flex items-center justify-center text-3xl shadow-md border-2 border-white/20`}>
            {currentAvatarObj.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white truncate">{username || 'Player'}</span>
              <span className="text-base">{currentCountryObj.flag}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono font-bold text-brandOrange">{userStats?.elo || 1092} Elo</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className={`text-[10px] font-bold ${tier.color}`}>Level {userStats?.level || 1} {tier.name}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-3.5 overflow-y-auto max-h-[360px] pr-1">
          {/* Username Input */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
              Player Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrorMsg('');
              }}
              maxLength={18}
              className="w-full bg-bgDark border border-borderDark rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brandOrange"
              placeholder="Enter your name..."
            />
          </div>

          {/* Avatar Icon Grid */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                    selectedAvatar === av.id
                      ? `${av.bg} border-white shadow-md scale-105`
                      : 'bg-bgDark/60 border-borderDark/60 hover:border-gray-500'
                  }`}
                >
                  <span className="text-xl">{av.icon}</span>
                  <span className="text-[9px] font-semibold mt-1 text-gray-200 truncate w-full text-center">
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Country Flag Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
              Country & Nationality
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {COUNTRY_PRESETS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountry(c.name)}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs transition cursor-pointer ${
                    selectedCountry === c.name
                      ? 'bg-amber-500/20 border-brandOrange text-white font-bold'
                      : 'bg-bgDark/60 border-borderDark/60 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-sm">{c.flag}</span>
                  <span className="text-[10px] truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-2 border-t border-borderDark/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-cardDark border border-borderDark text-gray-300 py-2.5 rounded-xl text-xs font-semibold hover:bg-borderDark transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brandOrange hover:bg-amber-600 text-black py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
