import React, { useState } from 'react';
import { Network, ChevronDown, ChevronUp, Sparkles, User, Brain, ShieldCheck, Zap } from 'lucide-react';

export default function VisualMindMesh({ 
  activeAgent = null, 
  isProcessing = false, 
  currentRound = 1,
  steps = [],
  finalResult = null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Active status checks
  const isAriaActive = isProcessing && (activeAgent?.role === 'gemini' || activeAgent?.speaker === 'Aria');
  const isNexusActive = isProcessing && (activeAgent?.role === 'openrouter' || activeAgent?.speaker === 'Nexus');
  const isMindMeshActive = isProcessing && (activeAgent?.role === 'orchestrator' || activeAgent?.speaker === 'MindMesh');
  const isComplete = !isProcessing && finalResult;

  // Active communication link
  let activeLink = 'none';
  if (isAriaActive) {
    activeLink = currentRound === 1 ? 'user-aria' : 'nexus-aria';
  } else if (isNexusActive) {
    activeLink = 'aria-nexus';
  } else if (isMindMeshActive) {
    activeLink = 'convergence';
  } else if (isComplete) {
    activeLink = 'complete';
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-[#0A0E17]/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl transition-all overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-slate-800/70 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Network className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 tracking-wide uppercase">Visual MindMesh Network</h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Phase 15 Graph
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isProcessing
                ? isAriaActive
                  ? '⚡ Aria is generating architecture proposal...'
                  : isNexusActive
                  ? '🔍 Nexus is reviewing & checking quality...'
                  : isMindMeshActive
                  ? '🧠 MindMesh is synthesizing final consensus...'
                  : 'Collaborating...'
                : isComplete
                ? '✅ Consensus Blueprint Synthesized'
                : 'Standby • 4-Node Collaborative Mesh Ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className={`h-1.5 w-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isProcessing ? `Round ${currentRound || 1}` : 'Idle'}</span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isCollapsed ? "Expand Mesh View" : "Collapse Mesh View"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Visual Graph Stage */}
      {!isCollapsed && (
        <div className="relative p-6 pt-4 pb-4 select-none">
          <div className="max-w-2xl mx-auto relative h-72 sm:h-80 flex items-center justify-center">
            
            {/* SVG Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 320">
              <defs>
                <linearGradient id="grad-aria" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="grad-nexus" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
                <linearGradient id="grad-mesh" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Base static faint background grid */}
              <line x1="300" y1="270" x2="150" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="300" y1="270" x2="450" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="150" y1="150" x2="450" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="150" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="450" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="300" y1="40" x2="300" y2="270" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.4" />

              {/* ACTIVE DYNAMIC EDGES */}
              {/* User <-> Aria Line */}
              <line 
                x1="300" y1="270" x2="150" y2="150" 
                stroke={activeLink === 'user-aria' ? '#38bdf8' : '#334155'} 
                strokeWidth={activeLink === 'user-aria' ? '3' : '1.5'}
                className={activeLink === 'user-aria' ? 'animate-flow-dash' : ''}
                strokeDasharray={activeLink === 'user-aria' ? '8 4' : 'none'}
              />

              {/* Aria <-> Nexus (Debate Bridge) */}
              <line 
                x1="150" y1="150" x2="450" y2="150" 
                stroke={activeLink === 'aria-nexus' ? '#c084fc' : activeLink === 'nexus-aria' ? '#38bdf8' : '#334155'} 
                strokeWidth={activeLink === 'aria-nexus' || activeLink === 'nexus-aria' ? '3' : '1.5'}
                className={activeLink === 'aria-nexus' || activeLink === 'nexus-aria' ? 'animate-flow-dash' : ''}
                strokeDasharray={activeLink === 'aria-nexus' || activeLink === 'nexus-aria' ? '8 4' : 'none'}
              />

              {/* Aria -> MindMesh Line */}
              <line 
                x1="150" y1="150" x2="300" y2="40" 
                stroke={activeLink === 'convergence' || activeLink === 'complete' ? '#6366f1' : '#334155'} 
                strokeWidth={activeLink === 'convergence' ? '3' : '1.5'}
                className={activeLink === 'convergence' ? 'animate-flow-dash' : ''}
                strokeDasharray={activeLink === 'convergence' ? '8 4' : 'none'}
              />

              {/* Nexus -> MindMesh Line */}
              <line 
                x1="450" y1="150" x2="300" y2="40" 
                stroke={activeLink === 'convergence' || activeLink === 'complete' ? '#818cf8' : '#334155'} 
                strokeWidth={activeLink === 'convergence' ? '3' : '1.5'}
                className={activeLink === 'convergence' ? 'animate-flow-dash' : ''}
                strokeDasharray={activeLink === 'convergence' ? '8 4' : 'none'}
              />

              {/* MindMesh -> User (Final Delivery) */}
              <line 
                x1="300" y1="40" x2="300" y2="270" 
                stroke={activeLink === 'complete' ? '#10b981' : '#1e293b'} 
                strokeWidth={activeLink === 'complete' ? '2.5' : '1'}
                className={activeLink === 'complete' ? 'animate-flow-dash' : ''}
                strokeDasharray={activeLink === 'complete' ? '6 4' : 'none'}
                opacity={activeLink === 'complete' ? 1 : 0.2}
              />
            </svg>

            {/* NODE 1: TOP - MindMesh (Synthesizer / Consensus Core) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-emerald-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                isMindMeshActive 
                  ? 'border-indigo-400 ring-4 ring-indigo-500/40 shadow-indigo-500/50 scale-110' 
                  : isComplete
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-emerald-500/20'
                  : 'border-indigo-500/30 shadow-indigo-950/40 group-hover:border-indigo-400/60'
              }`}>
                <Brain className={`h-7 w-7 ${isMindMeshActive ? 'text-indigo-300 animate-pulse' : isComplete ? 'text-emerald-300' : 'text-indigo-400'}`} />
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[11px] font-bold text-slate-200 block">MindMesh</span>
                <span className="text-[9px] font-mono text-indigo-400 block -mt-0.5">Synthesizer</span>
              </div>
            </div>

            {/* NODE 2: LEFT - Aria (AI Architect) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-6 sm:left-12 flex flex-col items-center group cursor-pointer z-10">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-900/90 via-slate-900/90 to-cyan-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                isAriaActive 
                  ? 'border-cyan-400 ring-4 ring-cyan-500/40 shadow-cyan-500/50 scale-110' 
                  : 'border-blue-500/30 shadow-blue-950/40 group-hover:border-blue-400/60'
              }`}>
                <span className={`text-xl font-black ${isAriaActive ? 'text-cyan-300 animate-pulse' : 'text-blue-400'}`}>A</span>
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[11px] font-bold text-blue-300 block">Aria</span>
                <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">AI Architect</span>
              </div>
            </div>

            {/* NODE 3: RIGHT - Nexus (AI Reviewer) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-6 sm:right-12 flex flex-col items-center group cursor-pointer z-10">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-900/90 via-slate-900/90 to-pink-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                isNexusActive 
                  ? 'border-pink-400 ring-4 ring-pink-500/40 shadow-pink-500/50 scale-110' 
                  : 'border-purple-500/30 shadow-purple-950/40 group-hover:border-purple-400/60'
              }`}>
                <span className={`text-xl font-black ${isNexusActive ? 'text-pink-300 animate-pulse' : 'text-purple-400'}`}>N</span>
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[11px] font-bold text-purple-300 block">Nexus</span>
                <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">AI Reviewer</span>
              </div>
            </div>

            {/* NODE 4: BOTTOM - You (User) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:border-emerald-400 transition-all">
                <User className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[11px] font-bold text-emerald-400 block">You</span>
                <span className="text-[9px] font-mono text-slate-500 block -mt-0.5">Controller</span>
              </div>
            </div>

            {/* Center Status / Active Channel Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 shadow-xl backdrop-blur-md flex items-center gap-1.5">
                {isProcessing ? (
                  <>
                    <Zap className="h-3 w-3 text-amber-400 animate-bounce" />
                    <span className="text-amber-300">
                      {isAriaActive ? 'Aria ➔ Synthesizing Proposal' : isNexusActive ? 'Aria ➔ Nexus Review' : 'Mesh Converging'}
                    </span>
                  </>
                ) : isComplete ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Consensus Locked</span>
                  </>
                ) : (
                  <span>Mesh Idle</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
