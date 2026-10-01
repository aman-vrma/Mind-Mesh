import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Sparkles, CheckCircle2, ShieldAlert, Copy, Check } from 'lucide-react';

export default function CollaborationTimeline({ rounds = [], userTask = '', activeAgent = null }) {
  const bottomRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rounds, activeAgent]);

  // Combine userTask if not already present in rounds
  const hasUserMsg = rounds.some((r) => r.role === 'user');
  const allMessages = hasUserMsg 
    ? rounds 
    : (userTask ? [{ role: 'user', speaker: 'You', content: userTask, timestamp: new Date().toISOString() }, ...rounds] : rounds);

  if (!allMessages.length && !activeAgent) return null;

  const getAIName = (role, speaker) => {
    if (speaker) return speaker;
    if (role?.toLowerCase() === 'gemini' || role === 'architect') return 'Aria';
    if (role?.toLowerCase() === 'openrouter' || role === 'reviewer') return 'Nexus';
    if (role === 'cipher' || role === 'coder') return 'Cipher';
    if (role === 'aegis' || role === 'security') return 'Aegis';
    if (role === 'atlas' || role === 'researcher') return 'Atlas';
    if (role === 'orion' || role === 'critic') return 'Orion';
    if (role?.toLowerCase() === 'orchestrator') return 'MindMesh';
    return role;
  };

  const getAIAvatar = (role, speaker) => {
    const name = getAIName(role, speaker);
    if (name === 'Aria' || role?.toLowerCase() === 'gemini') {
      return {
        bg: 'from-blue-500 to-cyan-400',
        border: 'border-blue-300/50',
        shadow: 'shadow-blue-500/30',
        textColor: 'text-blue-300',
        bubbleBorder: 'border-blue-500/30',
        glow: 'from-blue-500 to-cyan-500',
        text: 'A'
      };
    }
    if (name === 'Nexus' || role?.toLowerCase() === 'openrouter') {
      return {
        bg: 'from-purple-500 to-pink-400',
        border: 'border-purple-300/50',
        shadow: 'shadow-purple-500/30',
        textColor: 'text-purple-300',
        bubbleBorder: 'border-purple-500/30',
        glow: 'from-purple-500 to-pink-500',
        text: 'N'
      };
    }
    if (name === 'Cipher' || role === 'cipher' || role === 'coder') {
      return {
        bg: 'from-emerald-500 to-teal-400',
        border: 'border-emerald-300/50',
        shadow: 'shadow-emerald-500/30',
        textColor: 'text-emerald-300',
        bubbleBorder: 'border-emerald-500/30',
        glow: 'from-emerald-500 to-teal-500',
        text: 'C'
      };
    }
    if (name === 'Aegis' || role === 'aegis' || role === 'security') {
      return {
        bg: 'from-amber-500 to-rose-400',
        border: 'border-amber-300/50',
        shadow: 'shadow-amber-500/30',
        textColor: 'text-amber-300',
        bubbleBorder: 'border-amber-500/30',
        glow: 'from-amber-500 to-rose-500',
        text: 'S'
      };
    }
    if (name === 'Atlas' || role === 'atlas' || role === 'researcher') {
      return {
        bg: 'from-cyan-500 to-indigo-400',
        border: 'border-cyan-300/50',
        shadow: 'shadow-cyan-500/30',
        textColor: 'text-cyan-300',
        bubbleBorder: 'border-cyan-500/30',
        glow: 'from-cyan-500 to-indigo-500',
        text: 'R'
      };
    }
    if (name === 'Orion' || role === 'orion' || role === 'critic') {
      return {
        bg: 'from-rose-500 to-orange-400',
        border: 'border-rose-300/50',
        shadow: 'shadow-rose-500/30',
        textColor: 'text-rose-300',
        bubbleBorder: 'border-rose-500/30',
        glow: 'from-rose-500 to-orange-500',
        text: 'O'
      };
    }
    return {
      bg: 'from-indigo-600 to-emerald-400',
      border: 'border-indigo-300/50',
      shadow: 'shadow-indigo-500/30',
      textColor: 'text-indigo-300',
      bubbleBorder: 'border-indigo-500/30',
      glow: 'from-indigo-500 to-emerald-500',
      text: 'M'
    };
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300">Live 3-Way Collaboration</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {allMessages.map((item, index) => {
          const isUser = item.role === 'user';
          const isIntervention = isUser && typeof item.content === 'string' && item.content.startsWith('[Intervention]:');
          const cleanUserText = isIntervention ? item.content.replace('[Intervention]:', '').trim() : item.content;

          if (isUser) {
            return (
              <div key={index} className="flex justify-end animate-fadeIn">
                <div className="max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-center gap-2 mb-2 justify-end">
                    {isIntervention && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                        ⚡ User Intervened
                      </span>
                    )}
                    <span className="text-xs font-semibold text-emerald-400">You</span>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/50">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="group relative">
                    <div className={`absolute -inset-0.5 ${
                      isIntervention 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 opacity-30' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20'
                    } rounded-2xl blur group-hover:opacity-30 transition`}></div>
                    <div className={`relative rounded-2xl rounded-tr-md ${
                      isIntervention 
                        ? 'bg-gradient-to-br from-amber-600/90 to-orange-600/90' 
                        : 'bg-gradient-to-br from-emerald-600/90 to-teal-600/90'
                    } px-4 py-3 shadow-xl`}>
                      <p className="text-sm text-white font-medium leading-relaxed whitespace-pre-wrap">{cleanUserText}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // AI Agent Message (Aria, Nexus, MindMesh)
          const aiName = getAIName(item.role, item.speaker);
          const avatar = getAIAvatar(item.role, item.speaker);

          return (
            <div key={index} className="flex justify-start animate-fadeInUp">
              <div className="max-w-[88%] sm:max-w-[80%]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center shadow-lg ${avatar.shadow} border ${avatar.border}`}>
                      <span className="text-sm font-bold text-white">{avatar.text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${avatar.textColor}`}>
                        {aiName}
                      </span>
                      {item.round && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 font-mono border border-slate-700/50">
                          Round {item.round}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.content, index)}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition cursor-pointer"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="group relative">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${avatar.glow} rounded-2xl blur opacity-10 group-hover:opacity-20 transition`}></div>
                  <div className={`relative rounded-2xl rounded-tl-md bg-slate-900/90 border ${avatar.bubbleBorder} px-4 py-3.5 shadow-xl backdrop-blur-sm`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-sm text-slate-200 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                            em: ({node, ...props}) => <em className="text-indigo-300" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline 
                                ? <code className="px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-300 text-xs font-mono border border-slate-700/50" {...props} />
                                : <code className="block px-3 py-2 rounded-lg bg-slate-950/80 text-emerald-300 text-xs font-mono border border-slate-700/50 my-2 overflow-x-auto" {...props} />
                          }}
                        >
                          {item.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Active Thinking Indicator */}
        {activeAgent && (
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[85%] sm:max-w-[75%]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${
                  activeAgent.role === 'gemini' 
                    ? 'from-blue-500 to-cyan-400 border-blue-300/50' 
                    : activeAgent.role === 'openrouter'
                    ? 'from-purple-500 to-pink-400 border-purple-300/50'
                    : 'from-indigo-500 to-emerald-400 border-indigo-300/50'
                } flex items-center justify-center shadow-lg border animate-pulse`}>
                  <span className="text-sm font-bold text-white">
                    {activeAgent.role === 'gemini' ? 'A' : activeAgent.role === 'openrouter' ? 'N' : 'M'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    {activeAgent.speaker || (activeAgent.role === 'gemini' ? 'Aria' : activeAgent.role === 'openrouter' ? 'Nexus' : 'MindMesh')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                    collaborating
                  </span>
                </div>
              </div>
              <div className="rounded-2xl rounded-tl-md bg-slate-900/90 border border-slate-800 px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3">
                <div className="flex gap-1.5 items-center">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-slate-400 italic">
                  {activeAgent.message || 'Thinking & collaborating...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
