import React from 'react';

export default function StatusIndicator({ status = 'idle', label }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
      case 'thinking':
        return {
          dot: 'bg-indigo-400 animate-ping',
          solid: 'bg-indigo-500',
          text: 'text-indigo-300',
          defaultLabel: 'Thinking...'
        };
      case 'complete':
        return {
          dot: 'hidden',
          solid: 'bg-emerald-400',
          text: 'text-emerald-400',
          defaultLabel: 'Complete'
        };
      case 'error':
        return {
          dot: 'hidden',
          solid: 'bg-rose-500',
          text: 'text-rose-400',
          defaultLabel: 'Failed'
        };
      default:
        return {
          dot: 'hidden',
          solid: 'bg-slate-600',
          text: 'text-slate-500',
          defaultLabel: 'Standby'
        };
    }
  };

  const current = getStatusStyles();

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        {status === 'thinking' && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.solid}`}></span>
      </div>
      <span className={`text-[11px] font-mono tracking-tight font-medium ${current.text}`}>
        {label || current.defaultLabel}
      </span>
    </div>
  );
}