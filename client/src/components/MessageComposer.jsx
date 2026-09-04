import React, { useState } from 'react';
import { Send, Square, Sparkles, MessageSquare } from 'lucide-react';

export default function MessageComposer({ onSendMessage, isProcessing = false, onStop }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <footer className="p-4 bg-[#0C101A]/80 backdrop-blur-xl border-t border-slate-800/80 shrink-0">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Assign an engineering task or ask a follow-up question..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3.5 pl-4 pr-24 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {isProcessing ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs px-3 py-1.5 rounded-xl transition cursor-pointer font-medium"
              >
                <Square className="h-3 w-3 fill-rose-300" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-3.5 py-1.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95"
              >
                <span>Run</span>
                <Send className="h-3 w-3" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-slate-500 font-mono">
          <span>Shift + Enter for new line</span>
          <span>Dual AI Orchestration Loop Active</span>
        </div>
      </div>
    </footer>
  );
}