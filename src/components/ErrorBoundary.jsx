import React from 'react';

/**
 * Global React Error Boundary for Barricade
 * Catches uncaught runtime errors anywhere in the component tree
 * and displays a sleek, game-themed fallback UI instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Barricade ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndRestart = () => {
    try {
      // Clear transient session data and temporary room codes
      sessionStorage.clear();
      localStorage.removeItem('barricade_active_room');
      localStorage.removeItem('barricade_online_match');
    } catch (e) {
      console.warn('Failed clearing transient storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
          <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-black/80 text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-4xl shadow-inner">
              🚧
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              Oops! Something barricaded the board.
            </h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              A temporary runtime issue halted the game session. Don't worry, your overall profile stats and unlocked items are preserved.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-black/50 border border-zinc-800/80 rounded-xl text-left overflow-x-auto text-xs text-rose-300/90 font-mono max-h-24">
                {this.state.error.message || this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>🔄</span> Reload Game
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndRestart}
                className="w-full py-3 px-4 bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.98] text-zinc-300 hover:text-white font-semibold rounded-xl border border-zinc-700/60 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>🧹</span> Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
