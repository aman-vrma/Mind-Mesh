import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AIAgentCard from './components/AIAgentCard';
import OrchestratorCore from './components/OrchestratorCore';
import CollaborationTimeline from './components/CollaborationTimeline';
import FinalConsensus from './components/FinalConsensus';
import MessageComposer from './components/MessageComposer';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentTask, setCurrentTask] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([]); // grows live as real turns happen; no phantom future rounds
  const [maxRounds, setMaxRounds] = useState(4); // true safety ceiling, reported by the backend each run
  const [error, setError] = useState(null);
  
  // Real-time dynamic states
  const [geminiStatus, setGeminiStatus] = useState({ status: 'idle', message: 'Standby', content: null });
  const [openRouterStatus, setOpenRouterStatus] = useState({ status: 'idle', message: 'Standby', content: null });
  const [rounds, setRounds] = useState([]);
  const [finalResult, setFinalResult] = useState(null);

  const eventSourceRef = useRef(null);

  const handleRunTask = (taskText) => {
    if (!taskText || isProcessing) return;

    // Reset current states
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setCurrentTask(taskText);
    setIsProcessing(true);
    setError(null);
    setPipelineSteps([]);
    setRounds([]);
    setFinalResult(null);

    setGeminiStatus({ status: 'thinking', message: 'Starting analysis...', content: null });
    setOpenRouterStatus({ status: 'idle', message: 'Standby', content: null });

    // Store Session in Sidebar
    const newSession = {
      id: Date.now().toString(),
      title: taskText.slice(0, 35) + (taskText.length > 35 ? '...' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      task: taskText
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);

    // Open Real-time SSE stream
    const url = `https://mind-mesh-x29v.onrender.com/api/ai/task/stream?task=${encodeURIComponent(taskText)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.maxRounds) setMaxRounds(data.maxRounds);

        switch (data.event) {
          case 'step_start':
            setPipelineSteps((prev) => [
              ...prev,
              { id: data.step, title: data.title, agent: data.speaker, status: 'active' }
            ]);
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
            if (data.role === 'gemini') {
              setGeminiStatus({ status: 'complete', message: data.statusMessage, content: data.content });
            } else if (data.role === 'openrouter') {
              setOpenRouterStatus({ status: 'complete', message: data.statusMessage, content: data.content });
            }

            // Append to collaboration timeline in real time
            setRounds((prev) => [
              ...prev,
              {
                role: data.role,
                type: data.type,
                title: data.title,
                content: data.content,
                round: data.round,
                timestamp: data.timestamp
              }
            ]);
            break;

          case 'pipeline_complete':
            setIsProcessing(false);
            setGeminiStatus((prev) => ({ ...prev, status: 'complete', message: 'Proposal & Revision Complete' }));
            setOpenRouterStatus((prev) => ({ ...prev, status: 'complete', message: 'Review Complete' }));
            if (data.summary?.finalResult) {
              setFinalResult(data.summary.finalResult);
            }
            eventSource.close();
            break;

          case 'pipeline_error':
            setError(data.error);
            setIsProcessing(false);
            if (geminiStatus.status === 'thinking') setGeminiStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
            if (openRouterStatus.status === 'thinking') setOpenRouterStatus((prev) => ({ ...prev, status: 'error', message: 'Failed' }));
            eventSource.close();
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err);
      if (isProcessing) {
        setError('Lost connection to orchestration server stream.');
        setIsProcessing(false);
      }
      eventSource.close();
    };
  };

  const handleStop = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsProcessing(false);
  };

  const handleNewSession = () => {
    handleStop();
    setActiveSessionId(null);
    setCurrentTask('');
    setFinalResult(null);
    setRounds([]);
    setError(null);
    setPipelineSteps([]);
    setGeminiStatus({ status: 'idle', message: 'Standby', content: null });
    setOpenRouterStatus({ status: 'idle', message: 'Standby', content: null });
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentTask(session.task);
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
              
              {/* Real-time Pipeline Progress Status Bar */}
              <OrchestratorCore 
                steps={pipelineSteps} 
                maxRounds={maxRounds} 
                isRunning={isProcessing} 
              />

              {/* Dual Mind Visual Stage: Real-Time Live Agent Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AIAgentCard
                  name="AI 1"
                  role="Architect"
                  avatarColor="from-blue-600 to-cyan-500"
                  borderColor="border-blue-500/40"
                  glowColor="shadow-blue-500/10"
                  status={geminiStatus.status}
                  statusMessage={geminiStatus.message}
                  content={geminiStatus.content}
                  active={geminiStatus.status === 'thinking'}
                />

                <AIAgentCard
                  name="AI 2"
                  role="Reviewer"
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

              {/* Real-time Collaboration Log Timeline */}
              {rounds.length > 0 && <CollaborationTimeline rounds={rounds} />}

              {/* Final Consensus Blueprint */}
              {finalResult && (
                <FinalConsensus 
                  content={finalResult} 
                  onRegenerate={() => handleRunTask(currentTask)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          {/* Persistent Message Composer with Cancel support */}
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