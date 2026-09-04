import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, CornerDownRight, CheckCircle2 } from 'lucide-react';

export default function CollaborationTimeline({ rounds = [] }) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-400">
        <CornerDownRight className="h-3.5 w-3.5 text-indigo-400" />
        <span>Live Multi-AI Dialogue Log</span>
      </div>

      <div className="space-y-3">
        {rounds.map((item, index) => {
          const isGemini = item.role?.toLowerCase() === 'gemini';
          const isOpenRouter = item.role?.toLowerCase() === 'openrouter';

          return (
            <div 
              key={index}
              className={`rounded-2xl border p-4 backdrop-blur-md transition-all ${
                isGemini 
                  ? 'bg-blue-950/10 border-blue-500/20 shadow-lg shadow-blue-500/5' 
                  : isOpenRouter
                  ? 'bg-purple-950/10 border-purple-500/20 shadow-lg shadow-purple-500/5'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isGemini 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{item.title || item.type}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.role}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Round {item.round}</span>
              </div>

              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}