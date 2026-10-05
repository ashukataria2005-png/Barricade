import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Swords,
  ChevronLeft,
  Check,
  CheckCheck,
  User,
  Sparkles
} from 'lucide-react';
import { unlockAchievement } from '../utils/achievements';

const MESSAGES_KEY = 'barricade_direct_messages';

const INITIAL_THREADS = [
  {
    id: 'kamal47',
    name: 'kamal47',
    avatar: 'bg-emerald-500',
    rating: 1188,
    status: 'online',
    unreadCount: 1,
    messages: [
      { id: '1', sender: 'them', text: 'Hey Ashu! Great game yesterday.', time: '10:14 AM' },
      { id: '2', sender: 'me', text: 'Thanks! That double barricade was tricky.', time: '10:15 AM' },
      { id: '3', sender: 'them', text: 'Ready for a 3+0 rematch right now?', time: '10:16 AM' },
    ],
  },
  {
    id: 'The_dog',
    name: 'The_dog',
    avatar: 'bg-rose-500',
    rating: 2301,
    status: 'online',
    unreadCount: 0,
    messages: [
      { id: '1', sender: 'them', text: 'Your opening on d4 was solid. Keep practicing!', time: 'Yesterday' },
      { id: '2', sender: 'me', text: 'Appreciate the tip GM 🙏', time: 'Yesterday' },
    ],
  },
  {
    id: 'AlphaGamer',
    name: 'AlphaGamer',
    avatar: 'bg-purple-500',
    rating: 1450,
    status: 'offline',
    unreadCount: 0,
    messages: [
      { id: '1', sender: 'them', text: 'Did you solve puzzle #3 today? The zigzag path was crazy.', time: 'Oct 3' },
    ],
  },
];

export const getStoredThreads = () => {
  if (typeof window === 'undefined') return INITIAL_THREADS;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_THREADS));
      return INITIAL_THREADS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_THREADS;
  }
};

export const saveStoredThreads = (threads) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(threads));
  } catch (e) {}
};

export default function MessagesModal({ isOpen, onClose, onLaunchChallenge, onJoinRoom }) {
  const [threads, setThreads] = useState(() => getStoredThreads());
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeThreadId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThreadId, threads, isTyping]);

  if (!isOpen) return null;

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    // Mark as read
    const updated = threads.map((t) =>
      t.id === threadId ? { ...t, unreadCount: 0 } : t
    );
    setThreads(updated);
    saveStoredThreads(updated);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !activeThreadId) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      time: timeStr,
    };

    const updated = threads.map((t) => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    setThreads(updated);
    saveStoredThreads(updated);
    setInputText('');

    // Social butterfly achievement
    unlockAchievement('social_butterfly');

    // Simulate friend response after a short delay
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botReplies = [
          'Awesome! Let’s jump into a match! 🚀',
          'Good plan. Let me know when you create the room! 🧱',
          'Haha nice move! ♟️',
          'Count me in! 🔥',
        ];
        const replyText = botReplies[Math.floor(Math.random() * botReplies.length)];
        const replyMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'them',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const withReply = updated.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, replyMsg] }
            : t
        );
        setThreads(withReply);
        saveStoredThreads(withReply);
      }, 1500);
    }, 800);
  };

  const handleSendChallengeInvite = () => {
    if (!activeThreadId) return;
    const roomCode = `BAR-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const inviteMsg = {
      id: Date.now().toString(),
      sender: 'me',
      isInvite: true,
      roomCode,
      text: `⚔️ Sent match challenge! Room Code: ${roomCode}`,
      time: timeStr,
    };

    const updated = threads.map((t) =>
      t.id === activeThreadId
        ? { ...t, messages: [...t.messages, inviteMsg] }
        : t
    );
    setThreads(updated);
    saveStoredThreads(updated);

    unlockAchievement('social_butterfly');

    // If host wants to launch room immediately
    if (onLaunchChallenge) {
      setTimeout(() => {
        onClose();
        onLaunchChallenge(roomCode, activeThread?.name || 'Friend');
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-5 flex flex-col gap-3 shadow-2xl relative h-[560px]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark/60">
          {activeThread ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveThreadId(null)}
                className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div className={`w-8 h-8 rounded-full ${activeThread.avatar} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                {activeThread.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">{activeThread.name}</h4>
                  <span className="text-[10px] font-mono text-brandOrange font-bold">{activeThread.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeThread.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="capitalize">{activeThread.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brandOrange/10 border border-brandOrange/30 flex items-center justify-center">
                <MessageSquare className="text-brandOrange" size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Messages</h3>
                <p className="text-[11px] text-gray-400">Inbox & game invitations</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            {activeThread && (
              <button
                onClick={handleSendChallengeInvite}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 px-2 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-xs active:scale-95"
                title="Send match challenge"
              >
                <Swords size={12} />
                <span>Invite</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Mode: Thread List vs Chat Timeline */}
        {!activeThread ? (
          /* THREAD LIST */
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {threads.map((t) => {
              const lastMsg = t.messages[t.messages.length - 1];
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className="bg-bgDark/70 hover:bg-bgDark border border-borderDark/60 hover:border-gray-500 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-full ${t.avatar} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-cardDark ${
                          t.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-200">{t.name}</span>
                        <span className="text-[10px] font-mono text-brandOrange font-bold">{t.rating}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate max-w-[170px] mt-0.5">
                        {lastMsg ? (lastMsg.sender === 'me' ? `You: ${lastMsg.text}` : lastMsg.text) : 'No messages yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-gray-500">{lastMsg?.time || ''}</span>
                    {t.unreadCount > 0 && (
                      <span className="bg-brandOrange text-black text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ACTIVE CHAT TIMELINE */
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Timeline */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 my-1">
              {activeThread.messages.map((m) => {
                const isMe = m.sender === 'me';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {m.isInvite ? (
                      /* Special Match Invite Card Bubble */
                      <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-brandOrange/50 rounded-2xl p-3 max-w-[85%] text-left shadow-md">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brandOrange mb-1">
                          <Swords size={14} />
                          <span>1v1 Match Challenge</span>
                        </div>
                        <p className="text-xs text-gray-200">
                          {isMe ? 'You challenged them to a match!' : `${activeThread.name} challenged you!`}
                        </p>
                        <div className="mt-2 bg-black/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                          <span>Room: {m.roomCode}</span>
                          {!isMe && onJoinRoom && (
                            <button
                              onClick={() => {
                                onClose();
                                onJoinRoom(m.roomCode);
                              }}
                              className="bg-brandOrange hover:bg-amber-600 text-black text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Join
                            </button>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 block mt-1.5 text-right">{m.time}</span>
                      </div>
                    ) : (
                      /* Regular Text Bubble */
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-brandOrange text-black font-medium rounded-br-xs'
                            : 'bg-bgDark/90 text-gray-200 border border-borderDark/60 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed">{m.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 ${
                            isMe ? 'text-black/60 font-semibold' : 'text-gray-400'
                          }`}
                        >
                          {m.time}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-bgDark/80 border border-borderDark/60 py-1.5 px-3 rounded-2xl w-fit text-[11px] text-gray-400 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-brandOrange animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brandOrange animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brandOrange animate-bounce delay-300" />
                  <span className="ml-1 text-[10px]">{activeThread.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-borderDark/60">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeThread.name}...`}
                className="flex-1 bg-bgDark border border-borderDark/80 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brandOrange"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-brandOrange hover:bg-amber-600 disabled:opacity-40 text-black p-2 rounded-xl transition cursor-pointer shadow-sm"
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
