import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Smile, Bot } from 'lucide-react';

const PRESET_REACTIONS = [
  'Good game! 🤝',
  'Well played! 👏',
  'Nice wall! 🧱',
  'Oops! 😅',
  'Rematch? 🔄',
  'Thinking... 🤔'
];

export default function ChatModal({
  isOpen,
  onClose,
  gameMode = 'ranked',
  opponentName = 'kamal47',
  onSendMessage,
  messages = []
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-cardDark border border-borderDark rounded-3xl p-4 flex flex-col h-[460px] shadow-2xl relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-brandOrange" size={18} />
            <div>
              <h3 className="text-sm font-bold text-white">In-Game Chat</h3>
              <p className="text-[10px] text-gray-400">Match vs {opponentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-borderDark/60 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages transcript */}
        <div className="flex-1 overflow-y-auto py-3 px-1 flex flex-col gap-2.5">
          {messages.length === 0 ? (
            <div className="my-auto text-center text-xs text-gray-500 italic">
              Say hello or tap a quick reaction below!
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.sender === 'me';
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <span className="text-[10px] text-gray-500 px-1 mb-0.5">
                    {isMe ? 'You' : opponentName}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs font-medium shadow-sm ${
                      isMe
                        ? 'bg-brandOrange text-black rounded-tr-xs font-semibold'
                        : 'bg-[#28282c] text-gray-200 border border-borderDark/60 rounded-tl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset quick reaction pills */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-borderDark/40">
          {PRESET_REACTIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSend(preset)}
              className="shrink-0 bg-bgDark/80 hover:bg-borderDark border border-borderDark text-gray-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center gap-2 pt-2 border-t border-borderDark/60"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={100}
            className="flex-1 bg-bgDark border border-borderDark/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandOrange"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-brandOrange hover:bg-amber-600 disabled:opacity-40 text-black p-2 rounded-xl transition cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
