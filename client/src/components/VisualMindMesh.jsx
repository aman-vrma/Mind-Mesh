import React, { useState } from 'react';
import { 
  Network, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  User, 
  Brain, 
  ShieldCheck, 
  Zap, 
  Code2, 
  ShieldAlert, 
  Search, 
  Target 
} from 'lucide-react';

export default function VisualMindMesh({ 
  activeAgent = null, 
  isProcessing = false, 
  currentRound = 1,
  steps = [],
  finalResult = null,
  teamMode = 'dual_mind'
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Normalize active speaker
  const speaker = activeAgent?.speaker || '';
  const role = activeAgent?.role || '';

  const isAriaActive = isProcessing && (speaker === 'Aria' || role === 'gemini' || role === 'Architect');
  const isNexusActive = isProcessing && (speaker === 'Nexus' || role === 'openrouter' || role === 'Reviewer');
  const isCipherActive = isProcessing && (speaker === 'Cipher' || role === 'Coder');
  const isAegisActive = isProcessing && (speaker === 'Aegis' || role === 'Security Auditor');
  const isAtlasActive = isProcessing && (speaker === 'Atlas' || role === 'Researcher');
  const isOrionActive = isProcessing && (speaker === 'Orion' || role === 'Critic');
  const isMindMeshActive = isProcessing && (speaker === 'MindMesh' || role === 'orchestrator' || role === 'Synthesizer');
  const isComplete = !isProcessing && finalResult;

  // Active communication link calculation
  let activeLink = 'none';
  if (teamMode === 'dev_squad') {
    if (isAriaActive) activeLink = 'user-aria';
    else if (isCipherActive) activeLink = 'aria-cipher';
    else if (isAegisActive) activeLink = 'cipher-aegis';
    else if (isMindMeshActive) activeLink = 'aegis-mindmesh';
    else if (isComplete) activeLink = 'mindmesh-user';
  } else if (teamMode === 'research_team') {
    if (isAtlasActive) activeLink = 'user-atlas';
    else if (isOrionActive) activeLink = 'atlas-orion';
    else if (isMindMeshActive) activeLink = 'research-mindmesh';
    else if (isComplete) activeLink = 'mindmesh-user';
  } else {
    // dual_mind or default
    if (isAriaActive) activeLink = currentRound === 1 ? 'user-aria' : 'nexus-aria';
    else if (isNexusActive) activeLink = 'aria-nexus';
    else if (isMindMeshActive) activeLink = 'convergence';
    else if (isComplete) activeLink = 'mindmesh-user';
  }

  // Header status badge info
  const modeBadgeText = 
    teamMode === 'dev_squad' ? 'Dev Squad • 5 Nodes' :
    teamMode === 'research_team' ? 'Research Team • 4 Nodes' :
    'Dual Mind • 4 Nodes';

  const modeBadgeColor =
    teamMode === 'dev_squad' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    teamMode === 'research_team' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

  const getStatusSubtitle = () => {
    if (!isProcessing) {
      return isComplete ? '✅ Synthesis Blueprint Complete' : 'Standby • Multi-AI Collaboration Mesh Ready';
    }
    if (isAriaActive) return '⚡ Aria: Generating architecture specification...';
    if (isNexusActive) return '🔍 Nexus: Reviewing architecture & code quality...';
    if (isCipherActive) return '💻 Cipher: Writing full production-ready code...';
    if (isAegisActive) return '🛡️ Aegis: Performing security & vulnerability audit...';
    if (isAtlasActive) return '🔬 Atlas: Deep-dive information gathering...';
    if (isOrionActive) return '🎯 Orion: Critical assessment & stress testing...';
    if (isMindMeshActive) return '🧠 MindMesh: Synthesizing final consensus...';
    return 'Collaborative Mesh Active...';
  };

  const getCenterStatusText = () => {
    if (isProcessing) {
      if (isAriaActive) return teamMode === 'dev_squad' ? 'Aria ➔ Drafting Architecture' : 'Aria ➔ Proposal Draft';
      if (isCipherActive) return 'Cipher ➔ Code Generation';
      if (isAegisActive) return 'Aegis ➔ Security Audit';
      if (isNexusActive) return 'Nexus ➔ Quality Review';
      if (isAtlasActive) return 'Atlas ➔ Information Gathering';
      if (isOrionActive) return 'Orion ➔ Critical Review';
      if (isMindMeshActive) return 'MindMesh ➔ Final Synthesis';
      return 'Agents Collaborating...';
    }
    if (isComplete) return 'Consensus Blueprint Locked';
    return 'Mesh Standby';
  };

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
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${modeBadgeColor}`}>
                {modeBadgeText}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {getStatusSubtitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className={`h-1.5 w-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isProcessing ? `Step ${steps.length || 1}` : 'Idle'}</span>
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

            {/* DEV SQUAD MODE (5 Nodes: User -> Aria -> Cipher -> Aegis -> MindMesh) */}
            {teamMode === 'dev_squad' && (
              <>
                {/* SVG Connection Lines for Dev Squad */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 320">
                  {/* Static Guidelines */}
                  <line x1="300" y1="270" x2="100" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="100" y1="150" x2="220" y2="55" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="220" y1="55" x2="380" y2="55" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="380" y1="55" x2="500" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="500" y1="150" x2="300" y2="270" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />

                  {/* Active Dynamic Links */}
                  {/* User -> Aria */}
                  <line 
                    x1="300" y1="270" x2="100" y2="150"
                    stroke={activeLink === 'user-aria' ? '#38bdf8' : '#334155'}
                    strokeWidth={activeLink === 'user-aria' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'user-aria' ? '8 4' : 'none'}
                    className={activeLink === 'user-aria' ? 'animate-flow-dash' : ''}
                  />

                  {/* Aria -> Cipher */}
                  <line 
                    x1="100" y1="150" x2="220" y2="55"
                    stroke={activeLink === 'aria-cipher' ? '#10b981' : '#334155'}
                    strokeWidth={activeLink === 'aria-cipher' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'aria-cipher' ? '8 4' : 'none'}
                    className={activeLink === 'aria-cipher' ? 'animate-flow-dash' : ''}
                  />

                  {/* Cipher -> Aegis */}
                  <line 
                    x1="220" y1="55" x2="380" y2="55"
                    stroke={activeLink === 'cipher-aegis' ? '#f59e0b' : '#334155'}
                    strokeWidth={activeLink === 'cipher-aegis' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'cipher-aegis' ? '8 4' : 'none'}
                    className={activeLink === 'cipher-aegis' ? 'animate-flow-dash' : ''}
                  />

                  {/* Aegis -> MindMesh */}
                  <line 
                    x1="380" y1="55" x2="500" y2="150"
                    stroke={activeLink === 'aegis-mindmesh' ? '#818cf8' : '#334155'}
                    strokeWidth={activeLink === 'aegis-mindmesh' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'aegis-mindmesh' ? '8 4' : 'none'}
                    className={activeLink === 'aegis-mindmesh' ? 'animate-flow-dash' : ''}
                  />

                  {/* MindMesh -> User (Final Delivery) */}
                  <line 
                    x1="500" y1="150" x2="300" y2="270"
                    stroke={activeLink === 'mindmesh-user' ? '#10b981' : '#1e293b'}
                    strokeWidth={activeLink === 'mindmesh-user' ? '2.5' : '1'}
                    strokeDasharray={activeLink === 'mindmesh-user' ? '6 4' : 'none'}
                    className={activeLink === 'mindmesh-user' ? 'animate-flow-dash' : ''}
                    opacity={activeLink === 'mindmesh-user' ? 1 : 0.3}
                  />
                </svg>

                {/* Node: Aria (Architect) */}
                <div className="absolute top-[150px] left-[100px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-900/90 via-slate-900/90 to-cyan-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isAriaActive ? 'border-cyan-400 ring-4 ring-cyan-500/40 shadow-cyan-500/50 scale-110' : 'border-blue-500/30'
                  }`}>
                    <span className={`text-base font-black ${isAriaActive ? 'text-cyan-300 animate-pulse' : 'text-blue-400'}`}>A</span>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-blue-300 block">Aria</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Architect</span>
                  </div>
                </div>

                {/* Node: Cipher (Coder) */}
                <div className="absolute top-[55px] left-[220px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-slate-900/90 to-teal-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isCipherActive ? 'border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/50 scale-110' : 'border-emerald-500/30'
                  }`}>
                    <Code2 className={`h-5 w-5 ${isCipherActive ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-emerald-300 block">Cipher</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Senior Coder</span>
                  </div>
                </div>

                {/* Node: Aegis (Security Auditor) */}
                <div className="absolute top-[55px] left-[380px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-900/90 via-slate-900/90 to-rose-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isAegisActive ? 'border-amber-400 ring-4 ring-amber-500/40 shadow-amber-500/50 scale-110' : 'border-amber-500/30'
                  }`}>
                    <ShieldAlert className={`h-5 w-5 ${isAegisActive ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-amber-300 block">Aegis</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Security Auditor</span>
                  </div>
                </div>

                {/* Node: MindMesh (Synthesizer) */}
                <div className="absolute top-[150px] left-[500px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-purple-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isMindMeshActive ? 'border-indigo-400 ring-4 ring-indigo-500/40 shadow-indigo-500/50 scale-110' : isComplete ? 'border-emerald-500/60 ring-2 ring-emerald-500/30' : 'border-indigo-500/30'
                  }`}>
                    <Brain className={`h-5 w-5 ${isMindMeshActive ? 'text-indigo-300 animate-pulse' : isComplete ? 'text-emerald-300' : 'text-indigo-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-indigo-300 block">MindMesh</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Synthesizer</span>
                  </div>
                </div>

                {/* Node: User */}
                <div className="absolute top-[270px] left-[300px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-emerald-400 block">You</span>
                    <span className="text-[9px] font-mono text-slate-500 block -mt-0.5">Controller</span>
                  </div>
                </div>
              </>
            )}

            {/* RESEARCH TEAM MODE (4 Nodes: User, Atlas, Orion, MindMesh) */}
            {teamMode === 'research_team' && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 320">
                  {/* Grid lines */}
                  <line x1="300" y1="270" x2="140" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="140" y1="150" x2="460" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="140" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="460" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="300" y1="40" x2="300" y2="270" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.4" />

                  {/* User -> Atlas */}
                  <line 
                    x1="300" y1="270" x2="140" y2="150"
                    stroke={activeLink === 'user-atlas' ? '#06b6d4' : '#334155'}
                    strokeWidth={activeLink === 'user-atlas' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'user-atlas' ? '8 4' : 'none'}
                    className={activeLink === 'user-atlas' ? 'animate-flow-dash' : ''}
                  />

                  {/* Atlas -> Orion */}
                  <line 
                    x1="140" y1="150" x2="460" y2="150"
                    stroke={activeLink === 'atlas-orion' ? '#f43f5e' : '#334155'}
                    strokeWidth={activeLink === 'atlas-orion' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'atlas-orion' ? '8 4' : 'none'}
                    className={activeLink === 'atlas-orion' ? 'animate-flow-dash' : ''}
                  />

                  {/* Orion / Atlas -> MindMesh */}
                  <line 
                    x1="460" y1="150" x2="300" y2="40"
                    stroke={activeLink === 'research-mindmesh' ? '#818cf8' : '#334155'}
                    strokeWidth={activeLink === 'research-mindmesh' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'research-mindmesh' ? '8 4' : 'none'}
                    className={activeLink === 'research-mindmesh' ? 'animate-flow-dash' : ''}
                  />
                  <line 
                    x1="140" y1="150" x2="300" y2="40"
                    stroke={activeLink === 'research-mindmesh' ? '#06b6d4' : '#334155'}
                    strokeWidth={activeLink === 'research-mindmesh' ? '3' : '1.5'}
                    strokeDasharray={activeLink === 'research-mindmesh' ? '8 4' : 'none'}
                    className={activeLink === 'research-mindmesh' ? 'animate-flow-dash' : ''}
                  />

                  {/* MindMesh -> User */}
                  <line 
                    x1="300" y1="40" x2="300" y2="270"
                    stroke={activeLink === 'mindmesh-user' ? '#10b981' : '#1e293b'}
                    strokeWidth={activeLink === 'mindmesh-user' ? '2.5' : '1'}
                    strokeDasharray={activeLink === 'mindmesh-user' ? '6 4' : 'none'}
                    className={activeLink === 'mindmesh-user' ? 'animate-flow-dash' : ''}
                    opacity={activeLink === 'mindmesh-user' ? 1 : 0.2}
                  />
                </svg>

                {/* Node: MindMesh */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-emerald-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isMindMeshActive ? 'border-indigo-400 ring-4 ring-indigo-500/40 shadow-indigo-500/50 scale-110' : isComplete ? 'border-emerald-500/60 ring-2 ring-emerald-500/30' : 'border-indigo-500/30'
                  }`}>
                    <Brain className={`h-6 w-6 ${isMindMeshActive ? 'text-indigo-300 animate-pulse' : isComplete ? 'text-emerald-300' : 'text-indigo-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-slate-200 block">MindMesh</span>
                    <span className="text-[9px] font-mono text-indigo-400 block -mt-0.5">Synthesizer</span>
                  </div>
                </div>

                {/* Node: Atlas (Researcher) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-8 sm:left-14 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-cyan-900/90 via-slate-900/90 to-blue-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isAtlasActive ? 'border-cyan-400 ring-4 ring-cyan-500/40 shadow-cyan-500/50 scale-110' : 'border-cyan-500/30'
                  }`}>
                    <Search className={`h-6 w-6 ${isAtlasActive ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-cyan-300 block">Atlas</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Lead Researcher</span>
                  </div>
                </div>

                {/* Node: Orion (Critic) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-8 sm:right-14 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-rose-900/90 via-slate-900/90 to-orange-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isOrionActive ? 'border-rose-400 ring-4 ring-rose-500/40 shadow-rose-500/50 scale-110' : 'border-rose-500/30'
                  }`}>
                    <Target className={`h-6 w-6 ${isOrionActive ? 'text-rose-300 animate-pulse' : 'text-rose-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-rose-300 block">Orion</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">Chief Critic</span>
                  </div>
                </div>

                {/* Node: User */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-emerald-400 block">You</span>
                    <span className="text-[9px] font-mono text-slate-500 block -mt-0.5">Controller</span>
                  </div>
                </div>
              </>
            )}

            {/* DUAL MIND / DEFAULT MODE (4 Nodes: User, Aria, Nexus, MindMesh) */}
            {teamMode !== 'dev_squad' && teamMode !== 'research_team' && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 320">
                  <line x1="300" y1="270" x2="150" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="300" y1="270" x2="450" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="150" y1="150" x2="450" y2="150" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="150" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="450" y1="150" x2="300" y2="40" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="300" y1="40" x2="300" y2="270" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.4" />

                  {/* User <-> Aria */}
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

                  {/* Aria -> MindMesh */}
                  <line 
                    x1="150" y1="150" x2="300" y2="40" 
                    stroke={activeLink === 'convergence' || activeLink === 'mindmesh-user' ? '#6366f1' : '#334155'} 
                    strokeWidth={activeLink === 'convergence' ? '3' : '1.5'}
                    className={activeLink === 'convergence' ? 'animate-flow-dash' : ''}
                    strokeDasharray={activeLink === 'convergence' ? '8 4' : 'none'}
                  />

                  {/* Nexus -> MindMesh */}
                  <line 
                    x1="450" y1="150" x2="300" y2="40" 
                    stroke={activeLink === 'convergence' || activeLink === 'mindmesh-user' ? '#818cf8' : '#334155'} 
                    strokeWidth={activeLink === 'convergence' ? '3' : '1.5'}
                    className={activeLink === 'convergence' ? 'animate-flow-dash' : ''}
                    strokeDasharray={activeLink === 'convergence' ? '8 4' : 'none'}
                  />

                  {/* MindMesh -> User */}
                  <line 
                    x1="300" y1="40" x2="300" y2="270" 
                    stroke={activeLink === 'mindmesh-user' ? '#10b981' : '#1e293b'} 
                    strokeWidth={activeLink === 'mindmesh-user' ? '2.5' : '1'}
                    className={activeLink === 'mindmesh-user' ? 'animate-flow-dash' : ''}
                    strokeDasharray={activeLink === 'mindmesh-user' ? '6 4' : 'none'}
                    opacity={activeLink === 'mindmesh-user' ? 1 : 0.2}
                  />
                </svg>

                {/* Node: MindMesh */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-emerald-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isMindMeshActive ? 'border-indigo-400 ring-4 ring-indigo-500/40 shadow-indigo-500/50 scale-110' : isComplete ? 'border-emerald-500/60 ring-2 ring-emerald-500/30' : 'border-indigo-500/30'
                  }`}>
                    <Brain className={`h-6 w-6 ${isMindMeshActive ? 'text-indigo-300 animate-pulse' : isComplete ? 'text-emerald-300' : 'text-indigo-400'}`} />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-slate-200 block">MindMesh</span>
                    <span className="text-[9px] font-mono text-indigo-400 block -mt-0.5">Synthesizer</span>
                  </div>
                </div>

                {/* Node: Aria */}
                <div className="absolute top-1/2 -translate-y-1/2 left-6 sm:left-12 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-blue-900/90 via-slate-900/90 to-cyan-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isAriaActive ? 'border-cyan-400 ring-4 ring-cyan-500/40 shadow-cyan-500/50 scale-110' : 'border-blue-500/30'
                  }`}>
                    <span className={`text-xl font-black ${isAriaActive ? 'text-cyan-300 animate-pulse' : 'text-blue-400'}`}>A</span>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-blue-300 block">Aria</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">AI Architect</span>
                  </div>
                </div>

                {/* Node: Nexus */}
                <div className="absolute top-1/2 -translate-y-1/2 right-6 sm:right-12 flex flex-col items-center z-10">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br from-purple-900/90 via-slate-900/90 to-pink-950/90 border flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isNexusActive ? 'border-pink-400 ring-4 ring-pink-500/40 shadow-pink-500/50 scale-110' : 'border-purple-500/30'
                  }`}>
                    <span className={`text-xl font-black ${isNexusActive ? 'text-pink-300 animate-pulse' : 'text-purple-400'}`}>N</span>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-purple-300 block">Nexus</span>
                    <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">AI Reviewer</span>
                  </div>
                </div>

                {/* Node: User */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-[11px] font-bold text-emerald-400 block">You</span>
                    <span className="text-[9px] font-mono text-slate-500 block -mt-0.5">Controller</span>
                  </div>
                </div>
              </>
            )}

            {/* Center Status / Active Channel Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 shadow-2xl backdrop-blur-md flex items-center gap-1.5">
                {isProcessing ? (
                  <>
                    <Zap className="h-3 w-3 text-amber-400 animate-bounce" />
                    <span className="text-amber-300 font-medium">
                      {getCenterStatusText()}
                    </span>
                  </>
                ) : isComplete ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">{getCenterStatusText()}</span>
                  </>
                ) : (
                  <span>{getCenterStatusText()}</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
