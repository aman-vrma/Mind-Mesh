import React from 'react';
import StatusIndicator from './StatusIndicator';
import { Bot, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AIAgentCard({ 
  name = 'Gemini', 
  role = 'Architect', 
  avatarColor = 'from-blue-500 to-cyan-500', 
  borderColor = 'border-blue-500/30',
  glowColor = 'shadow-blue-500/10',
  status = 'idle',
  statusMessage = 'Standby',
  content = null,
  active = false
}) {
  return (
    <div className={`flex-1 flex flex-col rounded-2xl bg-slate-900/40 backdrop-blur-xl border transition-all duration-300 overflow-hidden shadow-xl ${
      active 
        ? `${borderColor} ${glowColor} ring-1 ring-indigo-500/20` 
        : 'border-slate-800/80'
    }`}>
      {/* Agent Card Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center shadow-sm text-white font-bold text-xs`}>
            {name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">{name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {role}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{statusMessage}</p>
          </div>
        </div>

        <StatusIndicator status={status} />
      </div>

      {/* Agent Output Preview / Content */}
      <div className="flex-1 p-4 overflow-y-auto max-h-64 min-h-[160px] text-xs font-sans text-slate-300 leading-relaxed space-y-2">
        {content ? (
          <div className="prose prose-invert prose-xs max-w-none">
            <p className="whitespace-pre-line text-slate-300 line-clamp-6">{content}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 space-y-2 py-4">
            <Bot className="h-7 w-7 opacity-30 animate-pulse" />
            <p className="text-[11px]">Waiting for collaboration...</p>
          </div>
        )}
      </div>
    </div>
  );
}