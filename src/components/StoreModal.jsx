import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Gem,
  Sparkles,
  Check,
  Flame,
  Zap,
  Crown,
  Layers,
  Shield,
  Circle
} from 'lucide-react';
import {
  COSMETICS_CATALOG,
  getStoredCosmetics,
  buyCosmeticItem,
  equipCosmeticItem
} from '../utils/stats';

export default function StoreModal({ isOpen, onClose, userStats, onStatsUpdate, onCosmeticsUpdated }) {
  const [activeCategory, setActiveCategory] = useState('pawn'); // 'pawn' | 'wall' | 'frame'
  const [cosmetics, setCosmetics] = useState(() => getStoredCosmetics());
  const [storeToast, setStoreToast] = useState('');

  if (!isOpen) return null;

  const handleBuy = (item) => {
    const res = buyCosmeticItem(item, activeCategory);
    setStoreToast(res.message);
    setTimeout(() => setStoreToast(''), 2500);

    if (res.success) {
      setCosmetics(res.cosmetics);
      if (onStatsUpdate) onStatsUpdate(res.userStats);
      if (onCosmeticsUpdated) onCosmeticsUpdated(res.cosmetics);
    }
  };

  const handleEquip = (itemId) => {
    const updated = equipCosmeticItem(activeCategory, itemId);
    setCosmetics(updated);
    if (onCosmeticsUpdated) onCosmeticsUpdated(updated);
    setStoreToast('Equipped item! ✨');
    setTimeout(() => setStoreToast(''), 2000);
  };

  const currentItems = COSMETICS_CATALOG[activeCategory] || [];
  const currentGems = userStats?.gems || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl relative max-h-[90vh]">
        {/* Floating Toast */}
        {storeToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg z-50 animate-bounce text-center whitespace-nowrap">
            {storeToast}
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <ShoppingBag className="text-cyan-400" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Barricade Shop</h3>
              <p className="text-[11px] text-gray-400">Pawn skins, wall textures & frames</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-bgDark border border-cyan-500/40 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-cyan-300 shadow-inner">
              <Gem size={13} className="text-cyan-400" />
              <span>{currentGems}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-bgDark/60 p-1 rounded-xl border border-borderDark/50 text-xs">
          {[
            { id: 'pawn', label: 'Pawn Skins', icon: Circle },
            { id: 'wall', label: 'Wall Textures', icon: Layers },
            { id: 'frame', label: 'Avatar Frames', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-brandOrange text-black shadow-xs font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <tab.icon size={12} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Cosmetic Items Catalog */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[350px] pr-0.5">
          {currentItems.map((item) => {
            const isOwned = cosmetics.unlocked.includes(item.id);
            const isEquipped = cosmetics.equipped[activeCategory] === item.id;
            const canAfford = currentGems >= item.price;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isEquipped
                    ? 'bg-gradient-to-r from-amber-500/15 via-cardDark to-cardDark border-brandOrange shadow-sm ring-1 ring-brandOrange/40'
                    : isOwned
                    ? 'bg-bgDark/60 border-borderDark/80 hover:border-gray-500'
                    : 'bg-bgDark/40 border-borderDark/50'
                }`}
              >
                {/* Visual Preview */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner ${
                      item.id === 'pawn_fire'
                        ? 'bg-gradient-to-br from-amber-500 to-rose-600 border-amber-400 shadow-amber-500/50'
                        : item.id === 'pawn_neon'
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 shadow-cyan-500/50'
                        : item.id === 'pawn_gold'
                        ? 'bg-gradient-to-br from-yellow-300 to-amber-600 border-yellow-200 shadow-yellow-500/50'
                        : item.id === 'wall_obsidian'
                        ? 'bg-zinc-900 border-zinc-600'
                        : item.id === 'wall_carbon'
                        ? 'bg-slate-800 border-slate-600'
                        : item.id === 'wall_gold'
                        ? 'bg-gradient-to-r from-amber-300 to-yellow-500 border-yellow-200'
                        : 'bg-borderDark/40 border-borderDark text-gray-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-100 truncate">{item.name}</h4>
                      {item.price === 0 && (
                        <span className="text-[9px] bg-green-500/20 text-green-300 border border-green-500/30 px-1 py-0.2 rounded font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">{item.desc}</p>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded-xl">
                      <Check size={12} />
                      <span>Equipped</span>
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => handleEquip(item.id)}
                      className="bg-cardDark hover:bg-borderDark border border-borderDark text-gray-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer active:scale-95"
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer active:scale-95 shadow-sm ${
                        canAfford
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                          : 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-borderDark'
                      }`}
                    >
                      <Gem size={11} className={canAfford ? 'fill-black' : 'text-gray-500'} />
                      <span>{item.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cardDark border border-borderDark hover:bg-borderDark py-2.5 rounded-xl text-xs font-semibold text-gray-300 transition cursor-pointer mt-1"
        >
          Close Shop
        </button>
      </div>
    </div>
  );
}
