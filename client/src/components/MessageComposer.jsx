import React, { useState } from 'react';
import { Send, Square, Sparkles, Zap } from 'lucide-react';

export default function MessageComposer({ onSendMessage, isProcessing = false, onStop }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim(), isProcessing);
    setInput('');
  };

  return (
    <footer className="p-4 bg-[#0C101A]/90 backdrop-blur-xl border-t border-slate-800/80 shrink-0">
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
            placeholder={
              isProcessing
                ? "💡 Intervene mid-discussion: type here to steer Aria & Nexus, or click Stop..."
                : "Ask a question, propose a task, or continue the 3-way discussion..."
            }
            className={`w-full bg-slate-900/90 border rounded-2xl py-3.5 pl-4 pr-36 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none shadow-inner ${
              isProcessing 
                ? 'border-amber-500/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40' 
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }`}
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {isProcessing ? (
              <>
                <button
                  type="button"
                  onClick={onStop}
                  title="Stop generation"
                  className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-1.5 rounded-xl transition cursor-pointer font-medium"
                >
                  <Square className="h-3 w-3 fill-rose-300" />
                  <span>Stop</span>
                </button>

                {input.trim() && (
                  <button
                    type="submit"
                    title="Intervene mid-discussion"
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs px-3 py-1.5 rounded-xl font-medium shadow-md shadow-amber-500/20 transition cursor-pointer animate-pulse"
                  >
                    <span>Intervene</span>
                    <Zap className="h-3 w-3 fill-white" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-3.5 py-1.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95"
              >
                <span>Send</span>
                <Send className="h-3 w-3" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-slate-500 font-mono">
          <span>Shift + Enter for new line • Enter to send</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            {isProcessing ? 'Aria & Nexus collaborating (Intervene enabled)...' : '3-Way Room Active (User + Aria + Nexus)'}
          </span>
        </div>
      </div>
    </footer>
  );
}