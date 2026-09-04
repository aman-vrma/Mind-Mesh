import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

export default function FinalConsensus({ content, onRegenerate, isProcessing }) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-indigo-950/20 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 backdrop-blur-xl p-6 shadow-2xl shadow-indigo-500/10 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Final Answer</span>
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Synthesized from the AI 1 / AI 2 discussion</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="prose prose-invert prose-indigo max-w-none text-xs leading-relaxed prose-headings:font-bold prose-headings:text-slate-100 prose-p:text-slate-300 prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-slate-800 prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:p-2 prose-td:border prose-td:border-slate-800 prose-td:p-2">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}