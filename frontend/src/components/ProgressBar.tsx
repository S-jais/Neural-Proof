import React from 'react';
import { RunStatus } from '../types';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  status: RunStatus;
  currentStage?: string;
}

const STAGES = [
  { id: 'EXTRACT', label: 'Extract Claims' },
  { id: 'REVIEW', label: 'Claim Review' },
  { id: 'SEARCH', label: 'Search TinyFish' },
  { id: 'FETCH', label: 'Fetch Pages' },
  { id: 'EVALUATE', label: 'Evaluate Evidence' },
  { id: 'FINALIZE', label: 'Finalize Report' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ status, currentStage }) => {
  const isTerminal = status === 'COMPLETED' || status === 'PARTIAL' || status === 'FAILED' || status === 'TIMED_OUT';

  const getStageState = (index: number) => {
    if (status === 'COMPLETED') return 'completed';
    if (status === 'AWAITING_CLAIM_REVIEW' && index <= 1) return index === 1 ? 'active' : 'completed';
    if (status === 'EXTRACTING_CLAIMS') return index === 0 ? 'active' : 'pending';
    if (status === 'VERIFYING') {
      if (index < 2) return 'completed';
      if (index <= 4) return 'active';
      return 'pending';
    }
    if (status === 'FINALIZING') return index < 5 ? 'completed' : 'active';
    return isTerminal ? 'completed' : 'pending';
  };

  return (
    <div className="rounded-xl border border-navy-750 bg-navy-850 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isTerminal ? (
            <Loader2 className="h-4 w-4 animate-spin text-accent-cyan" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span className="text-sm font-semibold text-white">
            {isTerminal ? `Verification Status: ${status}` : 'Verification Pipeline Active'}
          </span>
        </div>
        {currentStage && (
          <span className="text-xs font-mono text-accent-teal uppercase tracking-wider">
            Stage: {currentStage}
          </span>
        )}
      </div>

      {/* Steps visualization */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
        {STAGES.map((step, idx) => {
          const state = getStageState(idx);
          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                state === 'completed'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : state === 'active'
                  ? 'bg-navy-750 text-accent-cyan border-accent-cyan/40 shadow-sm shadow-accent-cyan/10 animate-pulse'
                  : 'bg-navy-900/60 text-slate-500 border-navy-800'
              }`}
            >
              <div className="font-semibold">{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
