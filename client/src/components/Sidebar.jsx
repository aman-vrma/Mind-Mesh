import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Cpu, 
  History, 
  ShieldCheck, 
  Settings2,
  Zap
} from 'lucide-react';

export default function Sidebar({ sessions = [], activeSessionId, onSelectSession, onNewSession, isOpen }) {
  return (
    <aside className={`w-72 bg-[#0C101A]/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0 fixed md:relative z-20 h-full`}>
      {/* New Session Button */}
      <div className="p-4 border-b border-slate-800/60">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/15 border border-indigo-400/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Mesh Session</span>
        </button>
      </div>

      {/* Session History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <History className="h-3.5 w-3.5" />
          <span>Recent Workspaces</span>
        </div>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-600">
            No previous sessions
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                activeSessionId === session.id
                  ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 opacity-70 group-hover:text-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{session.title || 'Untitled Session'}</p>
                <span className="text-[10px] text-slate-600 font-mono">{session.timestamp}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Provider Connectivity Bar */}
      <div className="p-3.5 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-400" /> Active Mesh Engines</span>
          <span className="text-emerald-400 font-mono text-[10px]">2 Connected</span>
        </div>
        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-slate-800/60 text-slate-300">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span> Gemini Flash</span>
            <span className="text-[10px] text-slate-500">Architect</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-slate-800/60 text-slate-300">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span> OpenRouter Free</span>
            <span className="text-[10px] text-slate-500">Reviewer</span>
          </div>
        </div>
      </div>
    </aside>
  );
}