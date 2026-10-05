import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Gem,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  getStoredAuthUser,
  registerUser,
  loginUser,
  logoutUser,
  getStoredStats
} from '../utils/stats';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [welcomeCelebration, setWelcomeCelebration] = useState(null);

  const authUser = getStoredAuthUser();

  if (!isOpen) return null;

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = registerUser({ username, password });
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setWelcomeCelebration({
      username: res.user.username,
      diamonds: 100,
      elo: 1200,
    });
    setSuccessToast(res.message);

    onAuthSuccess?.(res.userStats);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = loginUser({ username, password });
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessToast(res.message);
    setTimeout(() => {
      onAuthSuccess?.(res.userStats);
      onClose();
    }, 1200);
  };

  const handleLogout = () => {
    logoutUser();
    setSuccessToast('Logged out successfully.');
    setTimeout(() => {
      const stats = getStoredStats();
      onAuthSuccess?.(stats);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Toast Notification */}
        {successToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg z-50 animate-bounce text-center whitespace-nowrap">
            {successToast}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderDark/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Barricade Account</h3>
              <p className="text-[11px] text-gray-400">Sync ratings, stats & diamonds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Welcome Celebration Modal View (Post Signup) */}
        {welcomeCelebration ? (
          <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/30 animate-pulse">
              <Gem size={32} className="fill-cyan-400/40" />
            </div>

            <h3 className="text-xl font-black text-white">Welcome, {welcomeCelebration.username}!</h3>
            <p className="text-xs text-gray-300 mt-1 mb-4">Your account is ready with instant starter perks:</p>

            <div className="grid grid-cols-2 gap-2.5 w-full mb-5">
              <div className="bg-bgDark/80 border border-cyan-500/40 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-2xl font-black text-cyan-400 font-mono">+100</span>
                <span className="text-[11px] font-bold text-gray-300 mt-0.5 flex items-center gap-1">
                  <Gem size={11} className="text-cyan-400" /> Diamonds 💎
                </span>
              </div>
              <div className="bg-bgDark/80 border border-amber-500/40 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-2xl font-black text-amber-400 font-mono">1200</span>
                <span className="text-[11px] font-bold text-gray-300 mt-0.5 flex items-center gap-1">
                  <Award size={12} className="text-amber-400" /> Starting Elo
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-brandOrange hover:bg-amber-500 text-black font-bold py-3 rounded-2xl text-xs transition cursor-pointer shadow-md"
            >
              Let's Play Barricade! 🚀
            </button>
          </div>
        ) : authUser?.isLoggedIn ? (
          /* Already Logged In View */
          <div className="flex flex-col gap-3 py-1">
            <div className="bg-bgDark/80 border border-borderDark rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300 font-bold">
                  {authUser.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{authUser.username}</span>
                    <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/40 px-1.5 py-0.2 rounded-full font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">Barricade Player Account</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-cardDark hover:bg-rose-950/40 border border-borderDark hover:border-rose-700/60 text-gray-300 hover:text-rose-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut size={14} />
              <span>Log Out / Switch Account</span>
            </button>
          </div>
        ) : (
          /* Sign Up / Sign In Form */
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-bgDark/80 p-1 rounded-xl border border-borderDark/60">
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Create Account (100 💎)
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Welcome Bonus Notice for Sign Up */}
            {mode === 'signup' && (
              <div className="bg-gradient-to-r from-cyan-950/80 via-cardDark to-cyan-950/80 border border-cyan-500/40 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-gray-200">
                    Signup Bonus: <strong className="text-cyan-300 font-black">+100 Diamonds 💎</strong> & <strong className="text-amber-300">1200 Elo</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={mode === 'signup' ? handleRegister : handleLogin} className="flex flex-col gap-3">
              {errorMsg && (
                <div className="bg-rose-950/80 border border-rose-700 text-rose-300 text-xs py-1.5 px-3 rounded-xl animate-shake">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                <div className="flex items-center gap-2 bg-bgDark border border-borderDark rounded-xl px-3 py-2 focus-within:border-cyan-400 transition">
                  <User size={15} className="text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. GrandmasterAshu"
                    maxLength={16}
                    required
                    className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none w-full font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="flex items-center gap-2 bg-bgDark border border-borderDark rounded-xl px-3 py-2 focus-within:border-cyan-400 transition">
                  <Lock size={15} className="text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    minLength={4}
                    required
                    className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none w-full font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl text-xs font-black transition cursor-pointer mt-1 shadow-md active:scale-98 flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black'
                    : 'bg-brandOrange hover:bg-amber-500 text-black'
                }`}
              >
                <span>{mode === 'signup' ? 'Claim 100 💎 & Register' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
