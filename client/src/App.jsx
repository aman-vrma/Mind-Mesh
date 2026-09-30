import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AIAgentCard from './components/AIAgentCard';
import OrchestratorCore from './components/OrchestratorCore';
import VisualMindMesh from './components/VisualMindMesh';
import CollaborationTimeline from './components/CollaborationTimeline';
import MessageComposer from './components/MessageComposer';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Get backend API URL from environment variable, fallback to localhost:5000 in dev
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://mind-mesh-x29v.onrender.com');

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentTask, setCurrentTask] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [maxRounds, setMaxRounds] = useState(4);
  const [error, setError] = useState(null);
  
  // Real-time dynamic agent states
  const [geminiStatus, setGeminiStatus] = useState({ status: 'idle', message: 'Standby', content: null });
  const [openRouterStatus, setOpenRouterStatus] = useState({ status: 'idle', message: 'Standby', content: null });
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
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('mindmesh_sessions', JSON.stringify(sessions.slice(0, 20))); // Keep last 20
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
          history: previousHistory
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
        buffer = parts.pop(); // keep partial chunk

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
      setGeminiStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
      setOpenRouterStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
    }
  };

  const handleSSEEvent = (data, sessionId) => {
    if (data.maxRounds) setMaxRounds(data.maxRounds);

    switch (data.event) {
      case 'step_start':
        setPipelineSteps((prev) => [
          ...prev,
          { id: data.step, title: data.title, agent: data.speaker, status: 'active' }
        ]);
        setActiveAgent({
          role: data.role,
          speaker: data.speaker,
          message: data.statusMessage
        });
        if (data.role === 'gemini') {
          setGeminiStatus((prev) => ({ ...prev, status: 'thinking', message: data.statusMessage }));
        } else if (data.role === 'openrouter') {
          setOpenRouterStatus((prev) => ({ ...prev, status: 'thinking', message: data.statusMessage }));
        }
        break;

      case 'step_complete':
        setPipelineSteps((prev) =>
          prev.map((s) => (s.id === data.step ? { ...s, status: 'complete' } : s))
        );
        setActiveAgent(null);
        if (data.role === 'gemini') {
          setGeminiStatus({ status: 'complete', message: data.statusMessage, content: data.content });
        } else if (data.role === 'openrouter') {
          setOpenRouterStatus({ status: 'complete', message: data.statusMessage, content: data.content });
        }

        const newMsg = {
          role: data.role,
          speaker: data.speaker,
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
        setGeminiStatus((prev) => ({ ...prev, status: 'complete', message: 'Proposal Complete' }));
        setOpenRouterStatus((prev) => ({ ...prev, status: 'complete', message: 'Review Complete' }));
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
        if (geminiStatus.status === 'thinking') setGeminiStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
        if (openRouterStatus.status === 'thinking') setOpenRouterStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
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

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
      const newSession = {
        id: sessionId,
        title: taskText.slice(0, 35) + (taskText.length > 35 ? '...' : ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        task: taskText,
        rounds: updatedRounds,
        finalResult: null
      };
      setSessions((prev) => [newSession, ...prev]);
    } else {
      setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, rounds: updatedRounds } : s));
    }

    setGeminiStatus({ status: 'thinking', message: 'Analyzing task...', content: null });
    setOpenRouterStatus({ status: 'idle', message: 'Standby', content: null });
    setActiveAgent({ role: 'gemini', speaker: 'Aria', message: isIntervene ? 'Processing intervention...' : 'Analyzing the task...' });

    // Stream SSE with history
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
    setGeminiStatus({ status: 'idle', message: 'Standby', content: null });
    setOpenRouterStatus({ status: 'idle', message: 'Standby', content: null });
  };

  const handleSelectSession = (id) => {
    handleStop();
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentTask(session.task || '');
      setRounds(session.rounds || []);
      setFinalResult(session.finalResult || null);
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Visual MindMesh Network Graph (Phase 15 Roadmap) */}
              <VisualMindMesh
                activeAgent={activeAgent}
                isProcessing={isProcessing}
                currentRound={rounds.length > 0 ? (rounds[rounds.length - 1].round || 1) : 1}
                steps={pipelineSteps}
                finalResult={finalResult}
              />

              {/* Real-time Pipeline Progress Status Bar */}
              <OrchestratorCore 
                steps={pipelineSteps} 
                maxRounds={maxRounds} 
                isRunning={isProcessing} 
              />

              {/* Dual Mind Visual Stage: Real-Time Live Agent Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIAgentCard
                  name="Aria"
                  role="AI Architect"
                  avatarColor="from-blue-600 to-cyan-500"
                  borderColor="border-blue-500/40"
                  glowColor="shadow-blue-500/10"
                  status={geminiStatus.status}
                  statusMessage={geminiStatus.message}
                  content={geminiStatus.content}
                  active={geminiStatus.status === 'thinking'}
                />

                <AIAgentCard
                  name="Nexus"
                  role="AI Reviewer"
                  avatarColor="from-purple-600 to-pink-500"
                  borderColor="border-purple-500/40"
                  glowColor="shadow-purple-500/10"
                  status={openRouterStatus.status}
                  statusMessage={openRouterStatus.message}
                  content={openRouterStatus.content}
                  active={openRouterStatus.status === 'thinking'}
                />
              </div>

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

              {/* Real-time 3-Way Collaboration Chat Timeline */}
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