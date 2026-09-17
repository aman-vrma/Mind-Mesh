import React from 'react';
import { Layers, Check, Loader2 } from 'lucide-react';

export default function OrchestratorCore({ steps = [], isRunning = false, maxRounds = 4 }) {
  const lastStep = steps[steps.length - 1];
  const isFinal = lastStep?.agent === 'MindMesh';

  return (
    <div className="w-full bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-200">Mesh Collaboration Pipeline</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
          {isRunning && <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />}
          <span>
            {isRunning
              ? isFinal
                ? 'Finalizing...'
                : `Turn ${steps.length} (up to ${maxRounds} rounds)`
              : 'Idle State'}
          </span>
        </div>
      </div>

      {/* Progress Flow Pipeline — grows as real turns happen, no phantom future rounds */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {steps.map((step) => {
          const isFinished = step.status === 'complete';
          const isCurrent = step.status === 'active';

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : isFinished
                  ? 'bg-slate-950/40 border-emerald-500/20 text-slate-300'
                  : 'bg-slate-950/20 border-slate-800/40 text-slate-600'
              }`}
            >
              <div className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                isFinished 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : isCurrent 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {isFinished ? <Check className="h-3 w-3" /> : step.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[11px] truncate">{step.title}</p>
                <p className="text-[9px] text-slate-500 font-mono truncate">{step.agent}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}