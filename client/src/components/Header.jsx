import React from 'react';
import { Layers, Activity, Sparkles } from 'lucide-react';

export default function Header({ status = 'idle' }) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0C101A]/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/20">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-100">MindMesh</h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">v1.0 MVP</span>
          </div>
          <p className="text-[11px] text-slate-500">Autonomous Dual-Mind Cognitive Synthesizer</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
          <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Status:</span>
          <span className={status === 'processing' ? 'text-amber-400' : 'text-emerald-400'}>
            {status === 'processing' ? 'Mesh Collaborating' : 'Mesh Ready'}
          </span>
        </div>
      </div>
    </header>
  );
}