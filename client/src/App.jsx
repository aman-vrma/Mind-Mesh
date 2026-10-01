import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AIAgentCard from './components/AIAgentCard';
import OrchestratorCore from './components/OrchestratorCore';
import VisualMindMesh from './components/VisualMindMesh';
import CollaborationTimeline from './components/CollaborationTimeline';
import MessageComposer from './components/MessageComposer';
import { 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Code2, 
  Search, 
  BrainCircuit, 
  Users 
} from 'lucide-react';

const INITIAL_AGENT_STATES = {
  Aria: { status: 'idle', message: 'Standby', content: null },
  Nexus: { status: 'idle', message: 'Standby', content: null },
  Cipher: { status: 'idle', message: 'Standby', content: null },
  Aegis: { status: 'idle', message: 'Standby', content: null },
  Atlas: { status: 'idle', message: 'Standby', content: null },
  Orion: { status: 'idle', message: 'Standby', content: null },
  MindMesh: { status: 'idle', message: 'Standby', content: null }
};

export default function App() {
  // Backend API URL from environment variable, fallback to localhost:5000 in dev
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://mind-mesh-x29v.onrender.com');

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentTask, setCurrentTask] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [maxRounds, setMaxRounds] = useState(4);
  const [error, setError] = useState(null);

  // Phase 5 Dynamic Team Mode Selection
  const [selectedTeamMode, setSelectedTeamMode] = useState('auto'); // 'auto' | 'dual_mind' | 'dev_squad' | 'research_team'
  const [activeTeamMode, setActiveTeamMode] = useState('dual_mind'); // currently active or previewed mode
  
  // Real-time dynamic agent states across all squad members
  const [agentStates, setAgentStates] = useState(INITIAL_AGENT_STATES);
  const [activeAgent, setActiveAgent] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [finalResult, setFinalResult] = useState(null);

  const abortControllerRef = useRef(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('mindmesh_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0 && !activeSessionId) {
          const first = parsed[0];
          setActiveSessionId(first.id);
          setCurrentTask(first.task || '');
          setRounds(first.rounds || []);
          setFinalResult(first.finalResult || null);
          if (first.teamMode) {
            setSelectedTeamMode(first.teamMode);
            setActiveTeamMode(first.teamMode === 'auto' ? 'dual_mind' : first.teamMode);
          }
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('mindmesh_sessions', JSON.stringify(sessions.slice(0, 20)));
    }
  }, [sessions]);

  // Handle SSE streaming via fetch POST with ReadableStream
  const startStream = async (taskText, previousHistory = [], sessionId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/api/ai/task/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task: taskText,
          history: previousHistory,
          mode: selectedTeamMode
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr && jsonStr !== '{}') {
                try {
                  const data = JSON.parse(jsonStr);
                  handleSSEEvent(data, sessionId);
                } catch (parseErr) {
                  console.error('Error parsing SSE data:', parseErr);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted.');
        return;
      }
      console.error('Streaming error:', err);
      setError(err.message || 'Connection lost.');
      setIsProcessing(false);
      setActiveAgent(null);
      setAgentStates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k].status === 'thinking') {
            next[k] = { ...next[k], status: 'error', message: 'Failed' };
          }
        });
        return next;
      });
    }
  };

  const normalizeSpeaker = (data) => {
    if (data.speaker) return data.speaker;
    if (data.role === 'gemini' || data.role === 'Architect') return 'Aria';
    if (data.role === 'openrouter' || data.role === 'Reviewer') return 'Nexus';
    if (data.role === 'Coder' || data.role === 'cipher') return 'Cipher';
    if (data.role === 'Security Auditor' || data.role === 'aegis') return 'Aegis';
    if (data.role === 'Researcher' || data.role === 'atlas') return 'Atlas';
    if (data.role === 'Critic' || data.role === 'orion') return 'Orion';
    if (data.role === 'orchestrator' || data.role === 'Synthesizer') return 'MindMesh';
    return data.role || 'Aria';
  };

  const handleSSEEvent = (data, sessionId) => {
    if (data.maxRounds) setMaxRounds(data.maxRounds);
    if (data.teamMode) {
      setActiveTeamMode(data.teamMode);
    }

    const speakerName = normalizeSpeaker(data);

    switch (data.event) {
      case 'intent_detected':
        if (data.teamMode) {
          setActiveTeamMode(data.teamMode);
        }
        break;

      case 'step_start':
        setPipelineSteps((prev) => [
          ...prev,
          { id: data.step, title: data.title, agent: speakerName, status: 'active' }
        ]);
        setActiveAgent({
          role: data.role,
          speaker: speakerName,
          message: data.statusMessage
        });
        setAgentStates((prev) => ({
          ...prev,
          [speakerName]: {
            status: 'thinking',
            message: data.statusMessage || 'Processing...',
            content: prev[speakerName]?.content || null
          }
        }));
        break;

      case 'step_complete':
        setPipelineSteps((prev) =>
          prev.map((s) => (s.id === data.step ? { ...s, status: 'complete' } : s))
        );
        setActiveAgent(null);
        setAgentStates((prev) => ({
          ...prev,
          [speakerName]: {
            status: 'complete',
            message: data.statusMessage || 'Complete',
            content: data.content
          }
        }));

        const newMsg = {
          role: data.role,
          speaker: speakerName,
          type: data.type,
          title: data.title,
          content: data.content,
          round: data.round,
          timestamp: data.timestamp || new Date().toISOString()
        };

        setRounds((prev) => {
          const next = [...prev, newMsg];
          setSessions((sList) => sList.map(s => s.id === sessionId ? { ...s, rounds: next } : s));
          return next;
        });
        break;

      case 'pipeline_complete':
        setIsProcessing(false);
        setActiveAgent(null);
        setAgentStates((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (next[k].status === 'thinking') {
              next[k] = { ...next[k], status: 'complete', message: 'Complete' };
            }
          });
          return next;
        });

        if (data.summary?.finalResult) {
          const finalRes = data.summary.finalResult;
          setFinalResult(finalRes);
          setSessions((sList) => sList.map(s => s.id === sessionId ? { ...s, finalResult: finalRes } : s));
        }
        break;

      case 'pipeline_error':
        setError(data.error);
        setIsProcessing(false);
        setActiveAgent(null);
        setAgentStates((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (next[k].status === 'thinking') {
              next[k] = { ...next[k], status: 'error', message: 'Error' };
            }
          });
          return next;
        });
        break;

      default:
        break;
    }
  };

  const handleRunTask = (taskText, isIntervene = false) => {
    if (!taskText) return;

    if (isIntervene) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    const userMessage = {
      role: 'user',
      speaker: 'You',
      content: isIntervene ? `[Intervention]: ${taskText}` : taskText,
      timestamp: new Date().toISOString()
    };

    const previousHistory = [...rounds];
    const updatedRounds = [...rounds, userMessage];

    setRounds(updatedRounds);
    setCurrentTask(taskText);
    setIsProcessing(true);
    setError(null);
    setPipelineSteps([]);
    setAgentStates(INITIAL_AGENT_STATES);

    // Initial agent card status
    const initialSpeaker = activeTeamMode === 'research_team' ? 'Atlas' : 'Aria';
    setAgentStates((prev) => ({
      ...prev,
      [initialSpeaker]: { status: 'thinking', message: isIntervene ? 'Processing intervention...' : 'Analyzing task...', content: null }
    }));
    setActiveAgent({ role: 'Architect', speaker: initialSpeaker, message: isIntervene ? 'Processing intervention...' : 'Analyzing task...' });

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
      const newSession = {
        id: sessionId,
        title: taskText.slice(0, 35) + (taskText.length > 35 ? '...' : ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        task: taskText,
        teamMode: selectedTeamMode,
        rounds: updatedRounds,
        finalResult: null
      };
      setSessions((prev) => [newSession, ...prev]);
    } else {
      setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, rounds: updatedRounds, teamMode: selectedTeamMode } : s));
    }

    // Stream SSE with history and team mode
    startStream(taskText, previousHistory, sessionId);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setActiveAgent(null);
  };

  const handleNewSession = () => {
    handleStop();
    setActiveSessionId(null);
    setCurrentTask('');
    setFinalResult(null);
    setRounds([]);
    setError(null);
    setPipelineSteps([]);
    setActiveAgent(null);
    setAgentStates(INITIAL_AGENT_STATES);
  };

  const handleSelectSession = (id) => {
    handleStop();
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentTask(session.task || '');
      setRounds(session.rounds || []);
      setFinalResult(session.finalResult || null);
      if (session.teamMode) {
        setSelectedTeamMode(session.teamMode);
        setActiveTeamMode(session.teamMode === 'auto' ? 'dual_mind' : session.teamMode);
      }
    }
  };

  const handleModeChange = (mode) => {
    setSelectedTeamMode(mode);
    if (!isProcessing) {
      setActiveTeamMode(mode === 'auto' ? 'dual_mind' : mode);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#080B11] text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <Header status={isProcessing ? 'processing' : 'idle'} />

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation / History Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          isOpen={true}
        />

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#080B11] via-[#0B0F19] to-[#080B11]">
          {/* Scrollable Stage */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="max-w-5xl mx-auto space-y-5">

              {/* Phase 5: Dynamic AI Team Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 px-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">AI Team:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Option 1: Auto Mode */}
                  <button
                    onClick={() => handleModeChange('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedTeamMode === 'auto'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Auto-detect task complexity and route to the best specialized team"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Auto Route</span>
                  </button>

                  {/* Option 2: Dual Mind */}
                  <button
                    onClick={() => handleModeChange('dual_mind')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedTeamMode === 'dual_mind'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Dual Mind: Aria (Architect) & Nexus (Reviewer) multi-turn debate"
                  >
                    <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
                    <span>Dual Mind</span>
                  </button>

                  {/* Option 3: Dev Squad */}
                  <button
                    onClick={() => handleModeChange('dev_squad')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedTeamMode === 'dev_squad'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Dev Squad: Aria (Architect) ➔ Cipher (Senior Coder) ➔ Aegis (Security Auditor)"
                  >
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Dev Squad</span>
                  </button>

                  {/* Option 4: Research Team */}
                  <button
                    onClick={() => handleModeChange('research_team')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedTeamMode === 'research_team'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Research Team: Atlas (Researcher) ➔ Orion (Critic) deep analysis"
                  >
                    <Search className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Research Team</span>
                  </button>
                </div>
              </div>

              {/* Visual MindMesh Network Graph (Phase 15 Roadmap) */}
              <VisualMindMesh
                activeAgent={activeAgent}
                isProcessing={isProcessing}
                currentRound={rounds.length > 0 ? (rounds[rounds.length - 1].round || 1) : 1}
                steps={pipelineSteps}
                finalResult={finalResult}
                teamMode={activeTeamMode}
              />

              {/* Real-time Pipeline Progress Status Bar */}
              <OrchestratorCore 
                steps={pipelineSteps} 
                maxRounds={maxRounds} 
                isRunning={isProcessing} 
              />

              {/* Dynamic Live AI Specialist Cards Based on Team Mode */}
              {activeTeamMode === 'dev_squad' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AIAgentCard
                    name="Aria"
                    role="Architect"
                    avatarColor="from-blue-600 to-cyan-500"
                    borderColor="border-blue-500/40"
                    glowColor="shadow-blue-500/10"
                    status={agentStates.Aria.status}
                    statusMessage={agentStates.Aria.message}
                    content={agentStates.Aria.content}
                    active={agentStates.Aria.status === 'thinking'}
                  />

                  <AIAgentCard
                    name="Cipher"
                    role="Senior Coder"
                    avatarColor="from-emerald-600 to-teal-500"
                    borderColor="border-emerald-500/40"
                    glowColor="shadow-emerald-500/10"
                    status={agentStates.Cipher.status}
                    statusMessage={agentStates.Cipher.message}
                    content={agentStates.Cipher.content}
                    active={agentStates.Cipher.status === 'thinking'}
                  />

                  <AIAgentCard
                    name="Aegis"
                    role="Security Auditor"
                    avatarColor="from-amber-600 to-rose-500"
                    borderColor="border-amber-500/40"
                    glowColor="shadow-amber-500/10"
                    status={agentStates.Aegis.status}
                    statusMessage={agentStates.Aegis.message}
                    content={agentStates.Aegis.content}
                    active={agentStates.Aegis.status === 'thinking'}
                  />
                </div>
              ) : activeTeamMode === 'research_team' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AIAgentCard
                    name="Atlas"
                    role="Lead Researcher"
                    avatarColor="from-cyan-600 to-indigo-500"
                    borderColor="border-cyan-500/40"
                    glowColor="shadow-cyan-500/10"
                    status={agentStates.Atlas.status}
                    statusMessage={agentStates.Atlas.message}
                    content={agentStates.Atlas.content}
                    active={agentStates.Atlas.status === 'thinking'}
                  />

                  <AIAgentCard
                    name="Orion"
                    role="Chief Critic"
                    avatarColor="from-rose-600 to-orange-500"
                    borderColor="border-rose-500/40"
                    glowColor="shadow-rose-500/10"
                    status={agentStates.Orion.status}
                    statusMessage={agentStates.Orion.message}
                    content={agentStates.Orion.content}
                    active={agentStates.Orion.status === 'thinking'}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AIAgentCard
                    name="Aria"
                    role="AI Architect"
                    avatarColor="from-blue-600 to-cyan-500"
                    borderColor="border-blue-500/40"
                    glowColor="shadow-blue-500/10"
                    status={agentStates.Aria.status}
                    statusMessage={agentStates.Aria.message}
                    content={agentStates.Aria.content}
                    active={agentStates.Aria.status === 'thinking'}
                  />

                  <AIAgentCard
                    name="Nexus"
                    role="AI Reviewer"
                    avatarColor="from-purple-600 to-pink-500"
                    borderColor="border-purple-500/40"
                    glowColor="shadow-purple-500/10"
                    status={agentStates.Nexus.status}
                    statusMessage={agentStates.Nexus.message}
                    content={agentStates.Nexus.content}
                    active={agentStates.Nexus.status === 'thinking'}
                  />
                </div>
              )}

              {/* Error Notification with Retry */}
              {error && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => handleRunTask(currentTask)}
                    className="flex items-center gap-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-200 transition cursor-pointer font-medium"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Real-time Multi-AI Collaboration Chat Timeline */}
              {(rounds.length > 0 || isProcessing) && (
                <CollaborationTimeline 
                  rounds={rounds} 
                  userTask={currentTask} 
                  activeAgent={activeAgent}
                />
              )}
            </div>
          </div>

          {/* Persistent Message Composer with Intervene & Cancel support */}
          <MessageComposer
            onSendMessage={handleRunTask}
            isProcessing={isProcessing}
            onStop={handleStop}
          />
        </main>
      </div>
    </div>
  );
}